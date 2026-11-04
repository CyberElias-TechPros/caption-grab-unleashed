package com.captiongrab.app.data

import java.util.Locale

/**
 * Formatting, statistics and exporters. Direct port of `src/lib/format.ts`
 * with added helpers the native app needs (grouped paragraphs with timecodes,
 * plain-text chunking for "share as text", filename slugs).
 *
 * Pure Kotlin — unit-tested on the JVM.
 */
object TranscriptFormat {

    enum class ExportFormat(val label: String, val extension: String, val mime: String) {
        TXT("Plain text", "txt", "text/plain"),
        TIMESTAMPED("Timestamped text", "txt", "text/plain"),
        SRT("SubRip subtitles", "srt", "application/x-subrip"),
        VTT("WebVTT subtitles", "vtt", "text/vtt"),
        JSON("Structured JSON", "json", "application/json"),
        CSV("Spreadsheet (CSV)", "csv", "text/csv"),
        MARKDOWN("Markdown", "md", "text/markdown"),
        ;

        companion object {
            fun fromName(name: String?): ExportFormat =
                ExportFormat.entries.firstOrNull { it.name.equals(name, true) } ?: TXT
        }
    }

    fun clock(totalSeconds: Double, hours: Boolean = false, millis: Boolean = false): String {
        val s = totalSeconds.coerceAtLeast(0.0)
        val h = (s / 3600).toInt()
        val m = ((s % 3600) / 60).toInt()
        val sec = (s % 60).toInt()
        val ms = ((s % 1) * 1000).toInt()
        val base = if (hours || h > 0) String.format(Locale.US, "%02d:%02d:%02d", h, m, sec)
        else String.format(Locale.US, "%02d:%02d", m, sec)
        return if (millis) "$base,${String.format(Locale.US, "%03d", ms)}" else base
    }

    fun srtTimestamp(totalSeconds: Double): String {
        val s = totalSeconds.coerceAtLeast(0.0)
        val h = (s / 3600).toInt()
        val m = ((s % 3600) / 60).toInt()
        val sec = (s % 60).toInt()
        val ms = ((s % 1) * 1000).toInt()
        return String.format(Locale.US, "%02d:%02d:%02d,%03d", h, m, sec, ms)
    }

    fun vttTimestamp(totalSeconds: Double): String {
        val s = totalSeconds.coerceAtLeast(0.0)
        val h = (s / 3600).toInt()
        val m = ((s % 3600) / 60).toInt()
        val sec = (s % 60).toInt()
        val ms = ((s % 1) * 1000).toInt()
        val head = if (h > 0) String.format(Locale.US, "%02d:", h) else ""
        return head + String.format(Locale.US, "%02d:%02d.%03d", m, sec, ms)
    }

    fun srt(segments: List<TranscriptSegment>): String = segments.mapIndexed { index, seg ->
        "${index + 1}\n${srtTimestamp(seg.start)} --> ${srtTimestamp(seg.end)}\n${seg.text}"
    }.joinToString("\n\n", postfix = "\n")

    fun vtt(segments: List<TranscriptSegment>): String =
        "WEBVTT\n\n" + segments.joinToString("\n\n") { seg ->
            "${vttTimestamp(seg.start)} --> ${vttTimestamp(seg.end)}\n${seg.text}"
        } + "\n"

    fun plainText(segments: List<TranscriptSegment>): String =
        segments.joinToString(" ") { it.text }.replace(Regex("\\s+"), " ").trim()

    fun timestampedText(segments: List<TranscriptSegment>): String =
        segments.joinToString("\n") { "[${clock(it.start)}] ${it.text}" }

    fun json(segments: List<TranscriptSegment>): String = segments.joinToString(
        separator = ",\n",
        prefix = "[\n",
        postfix = "\n]",
    ) { seg ->
        """  {"start": ${round3(seg.start)}, "dur": ${round3(seg.dur)}, "text": "${escapeJson(seg.text)}"}"""
    }

    /** RFC-4180 CSV, with a header row and a timestamp column for spreadsheets. */
    fun csv(segments: List<TranscriptSegment>, includeStart: Boolean = true, includeEnd: Boolean = true): String {
        val header = buildList {
            add("\"index\"")
            if (includeStart) add("\"start\"")
            if (includeEnd) add("\"end\"")
            add("\"start_seconds\"")
            add("\"text\"")
        }.joinToString(",")
        val rows = segments.mapIndexed { index, seg ->
            buildList {
                add("${index + 1}")
                if (includeStart) add("\"${clock(seg.start)}\"")
                if (includeEnd) add("\"${clock(seg.end)}\"")
                add(round3(seg.start).toString())
                add("\"${seg.text.replace("\"", "\"\"")}\"")
            }.joinToString(",")
        }
        return (listOf(header) + rows).joinToString("\n") + "\n"
    }

    fun markdown(transcript: Transcript, withTimecodes: Boolean = true): String = buildString {
        appendLine("# ${transcript.title.ifBlank { "Transcript" }}")
        appendLine()
        if (transcript.author.isNotBlank()) appendLine("**Channel:** ${transcript.author}  ")
        appendLine("**Language:** ${transcript.languageName}${if (transcript.translated) " (machine-translated)" else ""}  ")
        appendLine("**Source:** ${YouTubeUrl.watchUrl(transcript.videoId)}  ")
        appendLine("**Words:** ${transcript.words} · **Segments:** ${transcript.segments.size}")
        appendLine()
        appendLine("---")
        appendLine()
        if (withTimecodes) {
            transcript.segments.forEach { seg ->
                appendLine("**${clock(seg.start)}** — ${seg.text}")
                appendLine()
            }
        } else {
            paragraphs(transcript.segments).forEach { p -> appendLine(p); appendLine() }
        }
        appendLine("---")
        appendLine()
        append("Transcript generated with CaptionGrab. Transcripts belong to the original video's creator.")
    }

    /**
     * Group segments into readable paragraphs by pause length / size.
     * Returns the paragraph text plus the timecode of its first segment so the
     * reading view can still jump the player.
     */
    fun paragraphsWithStart(segments: List<TranscriptSegment>, maxChars: Int = 480, pauseSeconds: Double = 2.5):
        List<Pair<Double, String>> {
        val out = mutableListOf<Pair<Double, String>>()
        var current = StringBuilder()
        var currentStart = 0.0
        var prevEnd = 0.0
        for (seg in segments) {
            val gap = seg.start - prevEnd
            if (current.isNotEmpty() && (gap > pauseSeconds || current.length + seg.text.length + 1 > maxChars)) {
                out += currentStart to current.toString().trim()
                current = StringBuilder()
            }
            if (current.isEmpty()) currentStart = seg.start
            if (current.isNotEmpty()) current.append(' ')
            current.append(seg.text)
            prevEnd = seg.end
        }
        if (current.isNotBlank()) out += currentStart to current.toString().trim()
        return out
    }

    fun paragraphs(segments: List<TranscriptSegment>, maxChars: Int = 480): List<String> =
        paragraphsWithStart(segments, maxChars).map { it.second }

    fun countWords(text: String): Int {
        val trimmed = text.trim()
        if (trimmed.isEmpty()) return 0
        return trimmed.split(Regex("\\s+")).count { it.isNotBlank() }
    }

    fun readingTime(text: String, wpm: Int = 200): String {
        val minutes = (countWords(text).toDouble() / wpm).let { if (it < 1) 1 else Math.round(it).toInt() }
        return if (minutes == 1) "1 min read" else "$minutes min read"
    }

    fun formatCount(n: Long?): String = when {
        n == null -> "—"
        n >= 1_000_000_000 -> String.format(Locale.US, "%.1fB", n / 1_000_000_000.0)
        n >= 1_000_000 -> String.format(Locale.US, "%.1fM", n / 1_000_000.0)
        n >= 1_000 -> String.format(Locale.US, "%.1fK", n / 1_000.0)
        else -> n.toString()
    }

    fun formatDuration(totalSeconds: Double): String {
        if (totalSeconds <= 0) return "—"
        val h = (totalSeconds / 3600).toInt()
        val m = ((totalSeconds % 3600) / 60).toInt()
        val s = (totalSeconds % 60).toInt()
        return if (h > 0) String.format(Locale.US, "%d:%02d:%02d", h, m, s)
        else String.format(Locale.US, "%d:%02d", m, s)
    }

    fun slugify(input: String, fallback: String = "transcript"): String {
        val slug = input.lowercase(Locale.US)
            .replace(Regex("[^a-z0-9]+"), "-")
            .trim('-')
            .take(60)
        return slug.ifBlank { fallback }
    }

    fun build(transcript: Transcript, format: ExportFormat): String = when (format) {
        ExportFormat.TXT -> transcript.text.ifBlank { plainText(transcript.segments) }
        ExportFormat.TIMESTAMPED -> timestampedText(transcript.segments)
        ExportFormat.SRT -> srt(transcript.segments)
        ExportFormat.VTT -> vtt(transcript.segments)
        ExportFormat.JSON -> json(transcript.segments)
        ExportFormat.CSV -> csv(transcript.segments)
        ExportFormat.MARKDOWN -> markdown(transcript)
    }

    fun fileName(transcript: Transcript, format: ExportFormat): String {
        val base = slugify("${transcript.title}-${transcript.language}", "transcript-${transcript.videoId}")
        return "$base.${format.extension}"
    }

    /**
     * Split a long transcript into share-safe chunks (Android intents and
     * clipboard handles are happier with bounded payloads).
     */
    fun chunkText(text: String, maxChars: Int = 12_000): List<String> {
        if (text.length <= maxChars) return listOf(text)
        val chunks = mutableListOf<String>()
        var index = 0
        while (index < text.length) {
            var end = minOf(index + maxChars, text.length)
            if (end < text.length) {
                val breakAt = text.lastIndexOf(' ', end)
                if (breakAt > index + maxChars / 2) end = breakAt
            }
            chunks += text.substring(index, end).trim()
            index = end
        }
        return chunks
    }

    private fun round3(value: Double): String =
        String.format(Locale.US, "%.3f", value).trimEnd('0').trimEnd('.').ifBlank { "0" }

    private fun escapeJson(text: String): String = buildString {
        for (ch in text) {
            when (ch) {
                '"' -> append("\\\"")
                '\\' -> append("\\\\")
                '\n' -> append("\\n")
                '\r' -> append("\\r")
                '\t' -> append("\\t")
                else -> if (ch < ' ') append(String.format(Locale.US, "\\u%04x", ch.code)) else append(ch)
            }
        }
    }
}
