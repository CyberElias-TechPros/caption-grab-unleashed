package com.captiongrab.app.ui

import android.app.Application
import androidx.annotation.VisibleForTesting
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.captiongrab.app.data.ApiError
import com.captiongrab.app.data.AppSettings
import com.captiongrab.app.data.CaptionApi
import com.captiongrab.app.data.CaptionTrack
import com.captiongrab.app.data.HistoryEntry
import com.captiongrab.app.data.HistoryRepository
import com.captiongrab.app.data.SettingsRepository
import com.captiongrab.app.data.TrackKind
import com.captiongrab.app.data.Transcript
import com.captiongrab.app.data.TranscriptFormat
import com.captiongrab.app.data.VideoInfo
import com.captiongrab.app.data.YouTubeUrl
import com.captiongrab.app.platform.AndroidServices
import java.io.File
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request

/** High-level extraction state machine. */
sealed interface Extraction {
    data object Idle : Extraction
    data class Resolving(val link: String) : Extraction
    data class Working(val video: VideoInfo?, val language: String, val resuming: Transcript? = null) : Extraction
    data class Ready(val transcript: Transcript, val video: VideoInfo?) : Extraction
    data class Failed(val error: ApiError, val video: VideoInfo?, val lastLink: String = "") : Extraction
}

data class ApiStatus(val reachable: Boolean, val degraded: Boolean, val checking: Boolean)

class AppViewModel(
    application: Application,
    private val api: CaptionApi = CaptionApi(
        baseUrl = com.captiongrab.app.BuildConfig.API_BASE_URL.ifBlank { CaptionApi.DEFAULT_BASE },
    ),
    val settingsRepository: SettingsRepository = SettingsRepository(application),
    val library: HistoryRepository = HistoryRepository(application),
    val services: AndroidServices = AndroidServices(application),
) : AndroidViewModel(application) {

    /** Only for platform services that genuinely need a Context (file saving, sharing). */
    fun application(): Application = getApplication<Application>()

    private val thumbClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .build()

    private val _settings = MutableStateFlow(AppSettings())
    val settings: StateFlow<AppSettings> = _settings.asStateFlow()

    private val _extraction = MutableStateFlow<Extraction>(Extraction.Idle)
    val extraction: StateFlow<Extraction> = _extraction.asStateFlow()

    private val _status = MutableStateFlow(ApiStatus(reachable = true, degraded = false, checking = true))
    val status: StateFlow<ApiStatus> = _status.asStateFlow()

    private val _messages = MutableSharedFlow<String>(extraBufferCapacity = 4)
    val messages = _messages.asSharedFlow()

    private val _pendingLink = MutableStateFlow<String?>(null)
    val pendingLink: StateFlow<String?> = _pendingLink.asStateFlow()

    val entries: StateFlow<List<HistoryEntry>> = library.entries
        .stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())

    private var extractJob: Job? = null

    init {
        viewModelScope.launch {
            settingsRepository.settings.collect { _settings.value = it }
        }
        viewModelScope.launch { library.load() }
        viewModelScope.launch {
            val health = api.health(force = true)
            _status.value = ApiStatus(health.reachable, health.degraded, checking = false)
        }
        services.startNetworkMonitoring()
    }

    /* ------------------------------------------------------------------ */
    /* Share-sheet / deep link intake                                      */
    /* ------------------------------------------------------------------ */

    fun consumeSharedText(text: String?) {
        val id = text?.let { YouTubeUrl.extractVideoId(it) } ?: return
        _pendingLink.value = id
    }

    fun consumePendingLink() {
        _pendingLink.value = null
    }

    /** Called by the UI once after a shared link arrives. */
    fun startFromShared(id: String) {
        _pendingLink.value = null
        resolveAndExtract(id)
    }

    /* ------------------------------------------------------------------ */
    /* Extraction                                                          */
    /* ------------------------------------------------------------------ */

    fun submit(rawInput: String) {
        val trimmed = rawInput.trim()
        if (trimmed.isEmpty()) {
            _extraction.value = Extraction.Failed(
                ApiError(ApiError.Code.INVALID_VIDEO_ID, "Paste a YouTube link to begin."),
                null,
            )
            return
        }
        val id = YouTubeUrl.extractVideoId(trimmed)
        if (id == null) {
            val platform = YouTubeUrl.detectPlatform(trimmed)
            val code = if (platform == YouTubeUrl.Platform.UNSUPPORTED) ApiError.Code.INVALID_VIDEO_ID
            else ApiError.Code.UNPLAYABLE_VIDEO
            _extraction.value = Extraction.Failed(
                ApiError(code, YouTubeUrl.platformMessage(platform)),
                null,
            )
            return
        }
        resolveAndExtract(id)
    }

    fun resolveAndExtract(rawId: String) {
        val id = YouTubeUrl.extractVideoId(rawId) ?: rawId
        if (!YouTubeUrl.isValidVideoId(id)) {
            _extraction.value = Extraction.Failed(
                ApiError(ApiError.Code.INVALID_VIDEO_ID, "That isn't a valid YouTube video id."),
                null,
            )
            return
        }
        extractJob?.cancel()
        extractJob = viewModelScope.launch {
            _extraction.value = Extraction.Resolving(id)
            val video = try {
                api.videoInfo(id)
            } catch (e: ApiError) {
                _extraction.value = Extraction.Failed(e, null, id)
                refreshStatus()
                return@launch
            } catch (e: Exception) {
                _extraction.value = Extraction.Failed(ApiError.network(e), null, id)
                return@launch
            }

            if (video.tracks.isEmpty()) {
                _extraction.value = Extraction.Failed(
                    ApiError(ApiError.Code.NO_CAPTIONS, "This video has no caption tracks yet."),
                    video,
                    id,
                )
                return@launch
            }

            val preferred = preferredTrack(video.tracks, _settings.value.defaultLanguage)
            extract(video, preferred.languageCode, alreadyKnownVideo = video)
        }
    }

    fun extract(video: VideoInfo, language: String, alreadyKnownVideo: VideoInfo? = null) {
        extractJob?.cancel()
        extractJob = viewModelScope.launch {
            val known = alreadyKnownVideo ?: video
            _extraction.value = Extraction.Working(known, language)
            val current = _settings.value
            try {
                val transcript = api.transcript(known.videoId, language, current.autoTranslate)
                _extraction.value = Extraction.Ready(transcript, known)
                _status.value = _status.value.copy(reachable = true)
                persist(transcript, known)
                _messages.tryEmit(
                    if (transcript.translated)
                        "${transcript.languageName} transcript ready (machine-translated)"
                    else "${transcript.languageName} transcript ready · ${transcript.segments.size} lines",
                )
            } catch (e: ApiError) {
                _extraction.value = Extraction.Failed(e, known)
                if (e.code == ApiError.Code.LANGUAGE_UNAVAILABLE && !current.autoTranslate) {
                    _messages.tryEmit("Try turning on smart auto-translate")
                }
                refreshStatus()
            } catch (e: Exception) {
                _extraction.value = Extraction.Failed(ApiError.network(e), known)
            }
        }
    }

    /** Re-run the last request, e.g. after a timeout or rate limit. */
    fun retry() {
        when (val state = _extraction.value) {
            is Extraction.Failed -> {
                val video = state.video
                val id = video?.videoId ?: state.lastLink
                if (video != null) {
                    val lang = preferredTrack(video.tracks, _settings.value.defaultLanguage).languageCode
                    extract(video, lang)
                } else if (id.isNotBlank()) {
                    resolveAndExtract(id)
                }
            }
            is Extraction.Ready -> {
                val video = state.video ?: return
                extract(video, state.transcript.language)
            }
            else -> Unit
        }
    }

    fun changeLanguage(language: String) {
        val state = _extraction.value
        val video = when (state) {
            is Extraction.Ready -> state.video
            is Extraction.Failed -> state.video
            is Extraction.Working -> state.video
            is Extraction.Resolving -> null
            Extraction.Idle -> null
        } ?: return
        extract(video, language)
    }

    /** Toggle between reading modes without re-fetching. */
    fun setTranscriptView(view: com.captiongrab.app.data.TranscriptView) {
        viewModelScope.launch { settingsRepository.update { it.copy(transcriptView = view) } }
    }

    fun reset() {
        extractJob?.cancel()
        _extraction.value = Extraction.Idle
    }

    /** Open a saved capture instantly — no network needed. */
    fun openEntry(entry: HistoryEntry) {
        extractJob?.cancel()
        _extraction.value = Extraction.Ready(entry.toTranscript(), null)
        viewModelScope.launch { library.markOpened(entry.id) }
    }

    /* ------------------------------------------------------------------ */
    /* Settings                                                            */
    /* ------------------------------------------------------------------ */

    fun updateSettings(transform: (AppSettings) -> AppSettings) {
        viewModelScope.launch { settingsRepository.update(transform) }
    }

    fun resetSettings() {
        viewModelScope.launch {
            settingsRepository.reset()
            _messages.tryEmit("Settings restored to defaults")
        }
    }

    /* ------------------------------------------------------------------ */
    /* Library                                                             */
    /* ------------------------------------------------------------------ */

    fun togglePinned(entry: HistoryEntry) {
        viewModelScope.launch {
            library.setPinned(entry.id, !entry.pinned)
            _messages.tryEmit(if (entry.pinned) "Unstarred" else "Starred — kept when you clear the rest")
        }
    }

    fun deleteEntry(entry: HistoryEntry) {
        viewModelScope.launch {
            library.delete(entry.id)
            _messages.tryEmit("Removed from library")
        }
    }

    fun clearLibrary(keepStarred: Boolean = true) {
        viewModelScope.launch {
            if (keepStarred) {
                library.clearUnpinned()
            } else {
                library.entries.value.toList().forEach { library.delete(it.id) }
            }
            _messages.tryEmit(if (keepStarred) "Cleared — starred captures kept" else "Library cleared")
        }
    }

    fun importEntry(entry: HistoryEntry) {
        viewModelScope.launch {
            library.importEntry(entry, _settings.value.historyLimit)
            _messages.tryEmit("Imported \"${entry.title.take(40)}\"")
        }
    }

    /* ------------------------------------------------------------------ */
    /* Export / share                                                      */
    /* ------------------------------------------------------------------ */

    /** Building a 2-hour SRT is string work on a big list — keep it off the main thread. */
    suspend fun buildExport(
        transcript: Transcript,
        format: TranscriptFormat.ExportFormat,
    ): Pair<String, String> = withContext(Dispatchers.Default) {
        val body = TranscriptFormat.build(transcript, format)
        val attributed = if (
            _settings.value.includeAttribution &&
            format in setOf(TranscriptFormat.ExportFormat.TXT, TranscriptFormat.ExportFormat.TIMESTAMPED, TranscriptFormat.ExportFormat.MARKDOWN)
        ) {
            body + services.attributionFor(transcript.title, transcript.author, transcript.videoId, transcript.languageName)
        } else body
        return attributed to TranscriptFormat.fileName(transcript, format)
    }

    /** Writes the export to cache and returns the file (used by the SAF picker + share sheet). */
    suspend fun writeExportFile(
        transcript: Transcript,
        format: TranscriptFormat.ExportFormat,
    ): Pair<File, String>? = withContext(Dispatchers.IO) {
        val (content, name) = buildExport(transcript, format)
        val file = runCatching {
            services.exportCacheFile(name).apply { writeText(content) }
        }.getOrNull()
        file?.let { it to name }
    }

    fun copyTranscript(transcript: Transcript, withTimestamps: Boolean): Boolean {
        val body = if (withTimestamps) TranscriptFormat.timestampedText(transcript.segments) else transcript.text
        return services.copyToClipboard(body, if (withTimestamps) "Timestamped transcript" else "Transcript")
    }

    fun shareTranscript(transcript: Transcript, withTimestamps: Boolean) {
        val body = buildString {
            append(if (withTimestamps) TranscriptFormat.timestampedText(transcript.segments) else transcript.text)
            if (_settings.value.includeAttribution) {
                append(services.attributionFor(transcript.title, transcript.author, transcript.videoId, transcript.languageName))
            }
        }
        services.shareText(body, subject = transcript.title, chooserTitle = "Share transcript")
    }

    fun play(transcript: Transcript, atSecond: Double) {
        services.openVideo(transcript.videoId, atSecond.toInt(), _settings.value.preferYouTubeApp)
    }

    /* ------------------------------------------------------------------ */
    /* internals                                                           */
    /* ------------------------------------------------------------------ */

    private suspend fun persist(transcript: Transcript, video: VideoInfo?) {
        if (!_settings.value.historyEnabled || transcript.segments.isEmpty()) return
        val thumbUrl = video?.thumbnail?.takeIf { it.isNotBlank() }
            ?: YouTubeUrl.thumbnailUrl(transcript.videoId)
        library.save(transcript, thumbUrl, _settings.value.historyLimit)
        cacheThumbnail(transcript.videoId, thumbUrl)
    }

    private fun cacheThumbnail(videoId: String, url: String) {
        viewModelScope.launch {
            runCatching {
                val request = Request.Builder().url(url).header("user-agent", "CaptionGrab-Android/1.0").build()
                thumbClient.newCall(request).execute().use { res ->
                    if (res.isSuccessful) res.body?.bytes()?.let { library.cacheThumbnail(videoId, it) }
                }
            }
        }
    }

    private suspend fun refreshStatus() {
        val health = api.health(force = true)
        _status.value = ApiStatus(health.reachable, health.degraded, checking = false)
    }

    fun recheckApi() {
        viewModelScope.launch {
            _status.value = _status.value.copy(checking = true)
            refreshStatus()
        }
    }

    fun preferredTrack(tracks: List<CaptionTrack>, preferredLanguage: String): CaptionTrack {
        val wanted = preferredLanguage.lowercase()
        val base = wanted.substringBefore('-')
        return tracks.firstOrNull { it.languageCode.lowercase() == wanted }
            ?: tracks.firstOrNull { it.languageCode.lowercase().substringBefore('-') == base }
            ?: tracks.firstOrNull { it.kind == TrackKind.MANUAL && it.languageCode.startsWith("en") }
            ?: tracks.firstOrNull { it.kind == TrackKind.MANUAL && it.languageCode.substringBefore('-') == base }
            ?: tracks.firstOrNull { it.languageCode.startsWith("en") }
            ?: tracks.first()
    }

    fun tracksForLanguage(language: String, video: VideoInfo?): CaptionTrack? {
        if (video == null) return null
        return video.tracks.firstOrNull { it.languageCode.equals(language, ignoreCase = true) }
    }
}
