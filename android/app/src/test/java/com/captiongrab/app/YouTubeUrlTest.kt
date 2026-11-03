package com.captiongrab.app

import com.captiongrab.app.data.YouTubeUrl
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class YouTubeUrlTest {

    private val id = "dQw4w9WgXcQ"

    @Test
    fun `validates 11 character ids`() {
        assertTrue(YouTubeUrl.isValidVideoId(id))
        assertTrue(YouTubeUrl.isValidVideoId("  $id  "))
        assertFalse(YouTubeUrl.isValidVideoId("too-short"))
        assertFalse(YouTubeUrl.isValidVideoId("contains space"))
        assertFalse(YouTubeUrl.isValidVideoId(""))
    }

    @Test
    fun `extracts from every watch url shape`() {
        val inputs = listOf(
            "https://www.youtube.com/watch?v=$id",
            "http://youtube.com/watch?v=$id&feature=share",
            "https://m.youtube.com/watch?app=desktop&v=$id",
            "https://music.youtube.com/watch?v=$id&list=RDAMVM",
            "https://www.youtube.com/watch?vi=$id",
            "https://youtu.be/$id",
            "https://youtu.be/$id?t=42",
            "https://www.youtube.com/shorts/$id",
            "https://www.youtube.com/live/$id?feature=share",
            "https://www.youtube.com/embed/$id",
            "https://www.youtube.com/v/$id",
            "https://www.youtube-nocookie.com/embed/$id",
            "https://www.youtube.com/clip/$id",
            "https://www.youtube.com/attribution_link?a=xyz&u=%2Fwatch%3Fv%3D$id",
            "youtube.com/watch?v=$id",
            id,
        )
        inputs.forEach { input ->
            assertEquals("failed for $input", id, YouTubeUrl.extractVideoId(input))
        }
    }

    @Test
    fun `extracts from share sheet text`() {
        val shared = "Look at this talk 😀 https://youtu.be/$id?si=abc123 — worth 20 minutes"
        assertEquals(id, YouTubeUrl.extractVideoId(shared))
    }

    @Test
    fun `rejects non youtube links`() {
        assertNull(YouTubeUrl.extractVideoId("https://vimeo.com/123456789"))
        assertNull(YouTubeUrl.extractVideoId("https://example.com"))
        assertNull(YouTubeUrl.extractVideoId(""))
        assertNull(YouTubeUrl.extractVideoId("hello world"))
    }

    @Test
    fun `detects platforms for honest messaging`() {
        assertEquals(YouTubeUrl.Platform.YOUTUBE, YouTubeUrl.detectPlatform("https://youtu.be/$id"))
        assertEquals(YouTubeUrl.Platform.FACEBOOK, YouTubeUrl.detectPlatform("https://www.facebook.com/watch/?v=1"))
        assertEquals(YouTubeUrl.Platform.TWITTER, YouTubeUrl.detectPlatform("https://x.com/user/status/1"))
        assertEquals(YouTubeUrl.Platform.TIKTOK, YouTubeUrl.detectPlatform("https://www.tiktok.com/@user/video/1"))
        assertEquals(YouTubeUrl.Platform.LINKEDIN, YouTubeUrl.detectPlatform("https://www.linkedin.com/posts/x"))
        assertEquals(YouTubeUrl.Platform.INSTAGRAM, YouTubeUrl.detectPlatform("https://instagram.com/reel/abc"))
        assertEquals(YouTubeUrl.Platform.UNSUPPORTED, YouTubeUrl.detectPlatform("not a link"))
    }

    @Test
    fun `platform messages stay actionable`() {
        YouTubeUrl.Platform.entries.forEach { platform ->
            assertTrue(YouTubeUrl.platformMessage(platform).isNotBlank())
        }
        assertTrue(YouTubeUrl.platformMessage(YouTubeUrl.Platform.FACEBOOK).contains("CC"))
    }

    @Test
    fun `parses start offsets`() {
        assertEquals(90, YouTubeUrl.extractStartSeconds("https://youtu.be/$id?t=90"))
        assertEquals(90, YouTubeUrl.extractStartSeconds("https://youtu.be/$id?t=90s"))
        assertEquals(90, YouTubeUrl.extractStartSeconds("https://www.youtube.com/watch?v=$id&t=1m30s"))
        assertEquals(3723, YouTubeUrl.extractStartSeconds("https://www.youtube.com/watch?v=$id&start=1h2m3s"))
        assertNull(YouTubeUrl.extractStartSeconds("https://youtu.be/$id"))
    }

    @Test
    fun `parses clockish strings`() {
        assertEquals(90, YouTubeUrl.parseClockish("90"))
        assertEquals(90, YouTubeUrl.parseClockish("01:30"))
        assertEquals(3723, YouTubeUrl.parseClockish("01:02:03"))
        assertEquals(3723, YouTubeUrl.parseClockish("1h2m3s"))
        assertEquals(125, YouTubeUrl.parseClockish("2m5s"))
        assertNull(YouTubeUrl.parseClockish("soon"))
    }

    @Test
    fun `builds watch urls with timestamps`() {
        assertEquals(
            "https://www.youtube.com/watch?v=$id",
            YouTubeUrl.watchUrl(id),
        )
        assertEquals(
            "https://www.youtube.com/watch?v=$id&t=42s",
            YouTubeUrl.watchUrlAt(id, 42),
        )
    }
}
