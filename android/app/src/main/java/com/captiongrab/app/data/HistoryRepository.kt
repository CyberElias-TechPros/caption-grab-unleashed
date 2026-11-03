package com.captiongrab.app.data

import android.content.Context
import java.io.File
import java.io.IOException
import java.util.concurrent.ConcurrentHashMap
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json

/**
 * On-device transcript library.
 *
 * Design notes (why it is a file per capture, not one giant JSON blob):
 *  - A 2-hour talk is ~1.5 MB of segments. A single list file would be
 *    rewritten on every star / open / delete, and a quota overflow would cost
 *    the user *everything*.
 *  - One file per capture means writes are O(size of that capture) and a
 *    corrupt file only loses one entry.
 *  - An in-memory index (metadata only) keeps list rendering instant.
 *
 * Everything stays in app-private storage. No upload, no sync, no account.
 */
class HistoryRepository(
    private val dir: File,
    private val io: CoroutineDispatcher = Dispatchers.IO,
    private val clock: () -> Long = { System.currentTimeMillis() },
) {
    constructor(context: Context) : this(File(context.filesDir, "library"))

    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true; explicitNulls = false }
    private val mutex = Mutex()
    private val thumbCache = ConcurrentHashMap<String, ByteArray>()

    private val _entries = MutableStateFlow<List<HistoryEntry>>(emptyList())
    val entries: StateFlow<List<HistoryEntry>> = _entries.asStateFlow()

    private val indexFile: File get() = File(dir, "index.json")

    /** Stable, collision-resistant-enough file name (FNV-1a 64) for an entry id. */
    private fun entryFile(id: String): File = File(dir, "entry-${hash64(id)}.json")

    private fun hash64(value: String): String {
        var hash = 0xCBF29CE484222325L // FNV-1a 64-bit offset basis
        for (byte in value.toByteArray()) {
            hash = hash xor (byte.toLong() and 0xff)
            hash *= 0x100000001b3L
        }
        return hash.toULong().toString(16)
    }

    suspend fun load() = withContext(io) {
        mutex.withLock {
            dir.mkdirs()
            val loaded = if (indexFile.exists()) {
                runCatching { json.decodeFromString<List<HistoryEntry>>(indexFile.readText()) }
                    .getOrElse { emptyList() }
            } else emptyList()
            _entries.value = sort(loaded.filter { it.segments.isNotEmpty() })
        }
    }

    /**
     * Save a capture. De-duplicates by video + language (the newest transcript
     * wins) and enforces the retention limit, dropping the oldest unpinned
     * capture first.
     */
    suspend fun save(
        transcript: Transcript,
        thumbnailUrl: String,
        limit: Int,
    ): HistoryEntry = withContext(io) {
        mutex.withLock {
            dir.mkdirs()
            val now = clock()
            val existing = _entries.value.firstOrNull {
                it.videoId == transcript.videoId && it.language == transcript.language
            }
            val entry = HistoryEntry.from(transcript, thumbnailUrl, now).let {
                if (existing != null) it.copy(id = existing.id, pinned = existing.pinned) else it
            }
            if (existing != null) entryFile(existing.id).delete()

            runCatching { entryFile(entry.id).writeText(json.encodeToString(HistoryEntry.serializer(), entry)) }

            var next = (listOf(entry) + _entries.value.filterNot { it.id == entry.id })
            if (next.size > limit) {
                val keep = next.filter { it.pinned }.take(limit)
                val others = next.filterNot { it.pinned }.take(maxOf(0, limit - keep.size))
                val dropped = next - keep.toSet() - others.toSet()
                dropped.forEach { runCatching { entryFile(it.id).delete() } }
                next = (keep + others).sortedByDescending { it.createdAt }
            }
            persistIndex(next)
            _entries.value = sort(next)
            entry
        }
    }

    suspend fun importEntry(entry: HistoryEntry, limit: Int) = withContext(io) {
        mutex.withLock {
            dir.mkdirs()
            val next = (listOf(entry) + _entries.value.filterNot { it.id == entry.id })
                .sortedByDescending { it.createdAt }
                .take(limit.coerceAtLeast(1))
            next.forEach {
                runCatching { entryFile(it.id).writeText(json.encodeToString(HistoryEntry.serializer(), it)) }
            }
            persistIndex(next)
            _entries.value = sort(next)
        }
    }

    suspend fun delete(id: String) = withContext(io) {
        mutex.withLock {
            runCatching { entryFile(id).delete() }
            val next = _entries.value.filterNot { it.id == id }
            persistIndex(next)
            _entries.value = sort(next)
        }
    }

    suspend fun clearUnpinned() = withContext(io) {
        mutex.withLock {
            _entries.value.filterNot { it.pinned }.forEach { runCatching { entryFile(it.id).delete() } }
            val next = _entries.value.filter { it.pinned }
            persistIndex(next)
            _entries.value = sort(next)
            Unit
        }
    }

    suspend fun setPinned(id: String, pinned: Boolean) = withContext(io) {
        mutex.withLock {
            val next = _entries.value.map { if (it.id == id) it.copy(pinned = pinned) else it }
            next.firstOrNull { it.id == id }?.let {
                runCatching { entryFile(it.id).writeText(json.encodeToString(HistoryEntry.serializer(), it)) }
            }
            persistIndex(next)
            _entries.value = sort(next)
        }
    }

    suspend fun markOpened(id: String) = withContext(io) {
        mutex.withLock {
            val next = _entries.value.map { if (it.id == id) it.copy(openedAt = clock()) else it }
            persistIndex(next)
            _entries.value = sort(next)
        }
    }

    /** Full text search across the library — titles, channels and transcript bodies. */
    fun search(query: String): List<HistoryEntry> {
        val q = query.trim()
        if (q.isEmpty()) return _entries.value
        val lower = q.lowercase()
        return _entries.value.filter { entry ->
            entry.title.lowercase().contains(lower) ||
                entry.author.lowercase().contains(lower) ||
                entry.segments.any { it.text.lowercase().contains(lower) }
        }
    }

    /* ------------------------------------------------------------------ */
    /* Thumbnails                                                          */
    /* ------------------------------------------------------------------ */

    private fun thumbFile(videoId: String) = File(dir, "thumb-$videoId.img")

    /**
     * Cache a thumbnail so the library renders offline. Coil keeps its own disk
     * cache, but that one is evictable — the library must survive a clean-up.
     */
    suspend fun cacheThumbnail(videoId: String, bytes: ByteArray) = withContext(io) {
        if (bytes.isEmpty()) return@withContext
        dir.mkdirs()
        runCatching {
            thumbFile(videoId).writeBytes(bytes)
            thumbCache[videoId] = bytes
        }
        Unit
    }

    suspend fun thumbnail(videoId: String): ByteArray? = withContext(io) {
        thumbCache[videoId]?.let { return@withContext it }
        val file = thumbFile(videoId)
        if (!file.exists()) return@withContext null
        runCatching { file.readBytes() }.getOrNull()?.also { thumbCache[videoId] = it }
    }

    /* ------------------------------------------------------------------ */
    /* internals                                                           */
    /* ------------------------------------------------------------------ */

    private fun persistIndex(entries: List<HistoryEntry>) {
        runCatching {
            dir.mkdirs()
            val tmp = File(dir, "index.json.tmp")
            tmp.writeText(json.encodeToString(ListSerializer(HistoryEntry.serializer()), entries))
            if (!tmp.renameTo(indexFile)) {
                indexFile.writeText(tmp.readText())
                tmp.delete()
            }
        }.onFailure { e -> if (e is IOException) Unit }
    }

    private fun sort(entries: List<HistoryEntry>): List<HistoryEntry> =
        entries.sortedWith(compareByDescending<HistoryEntry> { it.pinned }.thenByDescending { it.createdAt })
}
