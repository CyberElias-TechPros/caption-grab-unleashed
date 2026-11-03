package com.captiongrab.app.data

/**
 * YouTube URL parsing, video-id validation and platform detection.
 *
 * Direct Kotlin port of `src/lib/youtube.ts`, plus a few shapes that matter on
 * Android (Share-sheet text with trailing chatter, `si=` tracking params,
 * playlist links, `youtube.com/clip/...`, timestamps).
 *
 * Everything here is pure and unit-tested: no Android dependencies, so it runs
 * in plain JVM tests.
 */
object YouTubeUrl {

    val VIDEO_ID_REGEX = Regex("^[A-Za-z0-9_-]{11}$")

    private val URL_IN_TEXT = Regex("""(?:https?://)?(?:[a-z0-9-]+\.)*(?:youtube\.com|youtu\.be|youtube-nocookie\.com)/\S+""", RegexOption.IGNORE_CASE)
    private val BARE_ID_IN_TEXT = Regex("""(?<![A-Za-z0-9_-])([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])""")
    private val V_PARAM = Regex("""[?&#]v=([A-Za-z0-9_-]{11})""")
    private val VI_PARAM = Regex("""[?&#]vi=([A-Za-z0-9_-]{11})""")
    private val PATH_ID = Regex("""/(?:shorts|live|embed|v|e|reel|clip)/([A-Za-z0-9_-]{11})""")
    private val YT_BE_PATH = Regex("""youtu\.be/([A-Za-z0-9_-]{11})""", RegexOption.IGNORE_CASE)

    enum class Platform { YOUTUBE, FACEBOOK, TWITTER, LINKEDIN, TIKTOK, INSTAGRAM, UNSUPPORTED }

    fun isValidVideoId(value: String): Boolean = VIDEO_ID_REGEX.matches(value.trim())

    fun detectPlatform(input: String): Platform {
        val value = input.trim()
        if (value.isEmpty()) return Platform.UNSUPPORTED
        if (isValidVideoId(value)) return Platform.YOUTUBE
        val host = hostOf(value) ?: return Platform.UNSUPPORTED
        return when {
            host == "youtube.com" || host.endsWith(".youtube.com") ||
                host == "youtu.be" || host == "youtube-nocookie.com" ||
                host.endsWith(".youtube-nocookie.com") -> Platform.YOUTUBE
            host == "facebook.com" || host.endsWith(".facebook.com") ||
                host == "fb.watch" || host == "fb.com" -> Platform.FACEBOOK
            host == "twitter.com" || host.endsWith(".twitter.com") ||
                host == "x.com" || host.endsWith(".x.com") || host == "t.co" -> Platform.TWITTER
            host == "linkedin.com" || host.endsWith(".linkedin.com") || host == "lnkd.in" -> Platform.LINKEDIN
            host == "tiktok.com" || host.endsWith(".tiktok.com") || host == "vm.tiktok.com" -> Platform.TIKTOK
            host == "instagram.com" || host.endsWith(".instagram.com") -> Platform.INSTAGRAM
            else -> Platform.UNSUPPORTED
        }
    }

    /**
     * Extract a YouTube id from anything a user can realistically hand us:
     * watch URLs, youtu.be, /shorts, /live, /embed, /clip, music.youtube.com,
     * attribution links, playlist items, bare ids, and full share-sheet text
     * such as "Check this out https://youtu.be/abc123XYZ_- 🙂".
     */
    fun extractVideoId(input: String): String? {
        val value = input.trim()
        if (value.isEmpty()) return null
        if (isValidVideoId(value)) return value

        // 1. Every URL embedded in the text (share sheets add chatter, and a
        //    message may contain a non-YouTube link before the YouTube one).
        for (hit in URL_IN_TEXT.findAll(value)) {
            fromUrl(hit.value)?.let { return it }
        }

        // 2. A URL we can parse directly (handles exotic hosts/paths).
        fromUrl(value)?.let { return it }

        // 3. A bare 11-character id inside a sentence.
        if (value.length in 11..200) {
            BARE_ID_IN_TEXT.find(value)?.let { if (isValidVideoId(it.value)) return it.value }
        }
        return null
    }

    private fun fromUrl(raw: String): String? {
        val withScheme = if (raw.startsWith("http://", true) || raw.startsWith("https://", true)) raw else "https://$raw"
        val host = hostOf(withScheme) ?: return null
        val isYouTube = host == "youtu.be" || host == "youtube.com" || host.endsWith(".youtube.com") ||
            host == "youtube-nocookie.com" || host.endsWith(".youtube-nocookie.com")
        if (!isYouTube) return null

        // ?v= / &v=
        V_PARAM.find(withScheme)?.groupValues?.get(1)?.let { if (isValidVideoId(it)) return it }
        // legacy embed form ?vi=
        VI_PARAM.find(withScheme)?.groupValues?.get(1)?.let { if (isValidVideoId(it)) return it }

        // youtu.be/<id>
        YT_BE_PATH.find(withScheme)?.groupValues?.get(1)?.let { if (isValidVideoId(it)) return it }

        // /shorts/<id>, /live/<id>, /embed/<id>, /clip/<id>, ...
        PATH_ID.find(withScheme)?.groupValues?.get(1)?.let { if (isValidVideoId(it)) return it }

        // ?u=/watch?v=<id> (attribution links)
        Regex("""[?&]u=([^&]+)""").find(withScheme)?.groupValues?.get(1)?.let { nested ->
            val decoded = java.net.URLDecoder.decode(nested, "UTF-8")
            fromUrl(if (decoded.startsWith("/")) "https://www.youtube.com$decoded" else decoded)?.let { return it }
        }
        return null
    }

    private fun hostOf(value: String): String? = try {
        java.net.URI(value).host?.lowercase()?.removePrefix("www.")?.removePrefix("m.")
    } catch (_: Exception) {
        null
    }

    /** Start offset in seconds from `?t=` / `?start=` / `#t=` or `youtu.be/ID?t=90s`. */
    fun extractStartSeconds(input: String): Int? {
        val raw = Regex("""[?&#](?:t|start|time_continue)=([0-9hms]+)""", RegexOption.IGNORE_CASE)
            .find(input)?.groupValues?.get(1) ?: return null
        return parseClockish(raw)
    }

    /** "90", "1m30s", "1h2m3s", "01:30" → seconds. */
    fun parseClockish(raw: String): Int? {
        val t = raw.trim().lowercase()
        if (t.isEmpty()) return null
        t.toIntOrNull()?.let { return it }
        if (":" in t) {
            val parts = t.split(":").mapNotNull { it.toIntOrNull() }
            return when (parts.size) {
                2 -> parts[0] * 60 + parts[1]
                3 -> parts[0] * 3600 + parts[1] * 60 + parts[2]
                else -> null
            }
        }
        if (!t.any { it.isDigit() }) return null
        var total = 0
        var number = 0
        var sawUnit = false
        for (ch in t) {
            when {
                ch.isDigit() -> number = number * 10 + (ch - '0')
                ch == 'h' -> { total += number * 3600; number = 0; sawUnit = true }
                ch == 'm' -> { total += number * 60; number = 0; sawUnit = true }
                ch == 's' -> { total += number; number = 0; sawUnit = true }
                else -> return null
            }
        }
        if (sawUnit) total += number
        return if (total >= 0) total else null
    }

    fun watchUrl(videoId: String) = "https://www.youtube.com/watch?v=$videoId"

    fun watchUrlAt(videoId: String, seconds: Int): String =
        if (seconds <= 0) watchUrl(videoId) else "${watchUrl(videoId)}&t=${seconds}s"

    fun thumbnailUrl(videoId: String, quality: String = "hq") =
        "https://i.ytimg.com/vi/$videoId/${if (quality == "max") "maxresdefault" else "hqdefault"}.jpg"

    /**
     * Human explanation for platforms we cannot read captions from. Honest,
     * actionable copy beats a generic "unsupported" error.
     */
    fun platformMessage(platform: Platform): String = when (platform) {
        Platform.YOUTUBE -> "YouTube links are fully supported — paste any link to begin."
        Platform.FACEBOOK -> "Facebook doesn't expose captions to third-party apps. Open the video on Facebook and tap CC to read along."
        Platform.TWITTER -> "X (Twitter) has no public captions API. If the author enabled them, use the CC button on the player."
        Platform.LINKEDIN -> "LinkedIn doesn't expose captions to third-party apps. Use the CC button on the LinkedIn player."
        Platform.TIKTOK -> "TikTok has no public captions API. Turn on auto-captions inside the TikTok app to read along."
        Platform.INSTAGRAM -> "Instagram doesn't expose captions to third-party apps. Enable captions in Instagram's accessibility settings."
        Platform.UNSUPPORTED -> "That doesn't look like a video link. Paste a YouTube URL or an 11-character video id."
    }
}
