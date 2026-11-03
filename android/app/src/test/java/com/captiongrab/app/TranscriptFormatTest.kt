package com.captiongrab.app

import com.captiongrab.app.data.Transcript
import com.captiongrab.app.data.TranscriptFormat
import com.captiongrab.app.data.TranscriptSegment
import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class TranscriptFormatTest {

    private val segments = listOf(
        TranscriptSegment(0.0, 2.0, "Welcome to the show."),
        TranscriptSegment(2.0, 2.5, "Today we talk about captions."),
        TranscriptSegment(9.0, 3.0, "Let's dive in."),
        TranscriptSegment(12.4, 1500.0, "A long stretch near the end."),
    )

    private val transcript = Transcript(
        videoId = "dQw4w9WgXcQ",
        title = "Every Word: A Talk",
        author = "CaptionGrab",
        language = "en",
        languageName = "English",
        segments = segments,
        text = TranscriptFormat.plainText(segments),
    )

    @Test
    fun `formats clocks with and without hours`() {
        assertEquals("00:00", TranscriptFormat.clock(0.0))
        assertEquals("01:30", TranscriptFormat.clock(90.0))
        assertEquals("01:01:01", TranscriptFormat.clock(3661.0))
        assertEquals("01:01:01,500", TranscriptFormat.clock(3661.5, millis = true))
    }

    @Test
    fun `formats subtitle timestamps`() {
        assertEquals("00:00:00,000", TranscriptFormat.srtTimestamp(0.0))
        assertEquals("01:01:01,250", TranscriptFormat.srtTimestamp(3661.25))
        assertEquals("01:30.000", TranscriptFormat.vttTimestamp(90.0))
        assertEquals("01:01:01.250", TranscriptFormat.vttTimestamp(3661.25))
    }

    @Test
    fun `srt is numbered and uses comma decimals`() {
        val srt = TranscriptFormat.srt(segments.take(2))
        assertTrue(srt.startsWith("1\n00:00:00,000 --> 00:00:02,000\nWelcome to the show."))
        assertTrue(srt.contains("\n\n2\n00:00:02,000 --> 00:00:04,500\nToday we talk about captions."))
        assertTrue(srt.endsWith("\n"))
    }

    @Test
    fun `vtt starts with the required header`() {
        val vtt = TranscriptFormat.vtt(segments.take(1))
        assertTrue(vtt.startsWith("WEBVTT\n\n"))
        assertTrue(vtt.contains("00:00:00.000 --> 00:00:02.000"))
    }

    @Test
    fun `plain text collapses whitespace`() {
        val text = TranscriptFormat.plainText(
            listOf(TranscriptSegment(0.0, 1.0, "  one  "), TranscriptSegment(1.0, 1.0, "two\nthree ")),
        )
        assertEquals("one two three", text)
    }

    @Test
    fun `timestamped text prefixes every line`() {
        val out = TranscriptFormat.timestampedText(segments.take(2))
        assertEquals("[00:00] Welcome to the show.\n[00:02] Today we talk about captions.", out)
    }

    @Test
    fun `json export is valid and escapes quotes`() {
        val tricky = listOf(TranscriptSegment(1.5, 2.0, "He said \"hi\"\nand left\\"))
        val json = TranscriptFormat.json(tricky)
        val parsed = Json.parseToJsonElement(json)
        assertTrue(parsed.toString().contains("He said"))
        assertTrue(json.contains("\\\""))
        assertTrue(json.contains("\\n"))
    }

    @Test
    fun `csv quotes and escapes fields`() {
        val out = TranscriptFormat.csv(listOf(TranscriptSegment(0.0, 1.0, "He said \"hi\"")))
        val lines = out.trim().split("\n")
        assertEquals("\"index\",\"start\",\"end\",\"start_seconds\",\"text\"", lines[0])
        assertTrue(lines[1].contains("\"He said \"\"hi\"\"\""))
    }

    @Test
    fun `markdown carries attribution and timecodes`() {
        val md = TranscriptFormat.markdown(transcript)
        assertTrue(md.contains("# Every Word: A Talk"))
        assertTrue(md.contains("**Channel:** CaptionGrab"))
        assertTrue(md.contains("https://www.youtube.com/watch?v=dQw4w9WgXcQ"))
        assertTrue(md.contains("**00:09** — Let's dive in."))
    }

    @Test
    fun `paragraphs break on long pauses`() {
        val paragraphs = TranscriptFormat.paragraphsWithStart(segments.take(3))
        assertEquals(2, paragraphs.size)
        assertEquals(0.0, paragraphs[0].first, 0.001)
        assertEquals("Welcome to the show. Today we talk about captions.", paragraphs[0].second)
        assertEquals(9.0, paragraphs[1].first, 0.001)
    }

    @Test
    fun `paragraphs respect the character budget`() {
        val long = (1..40).map { TranscriptSegment(it.toDouble(), 1.0, "word$it") }
        val paragraphs = TranscriptFormat.paragraphsWithStart(long, maxChars = 60)
        assertTrue(paragraphs.size > 1)
        assertTrue(paragraphs.all { it.second.length <= 80 })
    }

    @Test
    fun `counts words and reading time`() {
        assertEquals(0, TranscriptFormat.countWords("   "))
        assertEquals(4, TranscriptFormat.countWords("one two three four"))
        assertEquals("1 min read", TranscriptFormat.readingTime("short text"))
        assertTrue(TranscriptFormat.readingTime("word ".repeat(600)).startsWith("3 min"))
    }

    @Test
    fun `formats counts and durations`() {
        assertEquals("—", TranscriptFormat.formatCount(null))
        assertEquals("999", TranscriptFormat.formatCount(999))
        assertEquals("1.5K", TranscriptFormat.formatCount(1_500))
        assertEquals("2.3M", TranscriptFormat.formatCount(2_300_000))
        assertEquals("—", TranscriptFormat.formatDuration(0.0))
        assertEquals("1:05", TranscriptFormat.formatDuration(65.0))
        assertEquals("1:02:05", TranscriptFormat.formatDuration(3725.0))
    }

    @Test
    fun `slugifies filenames safely`() {
        assertEquals("every-word-a-talk-en", TranscriptFormat.slugify("Every Word: A Talk — en"))
        assertEquals("transcript", TranscriptFormat.slugify("!!!", "transcript"))
        assertEquals("captiongrab-talk-en.srt", TranscriptFormat.fileName(transcript, TranscriptFormat.ExportFormat.SRT))
    }

    @Test
    fun `build dispatches to the right exporter`() {
        assertEquals(transcript.text, TranscriptFormat.build(transcript, TranscriptFormat.ExportFormat.TXT))
        assertTrue(TranscriptFormat.build(transcript, TranscriptFormat.ExportFormat.SRT).contains("-->"))
        assertTrue(TranscriptFormat.build(transcript, TranscriptFormat.ExportFormat.VTT).startsWith("WEBVTT"))
        assertTrue(TranscriptFormat.build(transcript, TranscriptFormat.ExportFormat.JSON).startsWith("["))
        assertTrue(TranscriptFormat.build(transcript, TranscriptFormat.ExportFormat.CSV).contains("\"text\""))
        assertTrue(TranscriptFormat.build(transcript, TranscriptFormat.ExportFormat.MARKDOWN).startsWith("# "))
        assertTrue(TranscriptFormat.build(transcript, TranscriptFormat.ExportFormat.TIMESTAMPED).startsWith("[00:00]"))
    }

    @Test
    fun `export format names round trip`() {
        TranscriptFormat.ExportFormat.entries.forEach { format ->
            assertEquals(format, TranscriptFormat.ExportFormat.fromName(format.name))
        }
        assertEquals(TranscriptFormat.ExportFormat.TXT, TranscriptFormat.ExportFormat.fromName("nonsense"))
        assertEquals(TranscriptFormat.ExportFormat.TXT, TranscriptFormat.ExportFormat.fromName(null))
    }

    @Test
    fun `chunking never splits words and respects the limit`() {
        val text = (1..500).joinToString(" ") { "word$it" }
        val chunks = TranscriptFormat.chunkText(text, maxChars = 200)
        assertTrue(chunks.size > 1)
        assertTrue(chunks.all { it.length <= 200 })
        assertEquals(text.replace(" ", ""), chunks.joinToString("").replace(" ", ""))
    }
}
