package com.captiongrab.app.data

/**
 * A typed, user-actionable failure.
 *
 * Every failure the user can hit gets a plain-language title, an explanation of
 * what happened, and (where we know one) the next best action. That is the
 * difference between "Error 502" and "YouTube hiccup — tap retry".
 */
data class ApiError(
    val code: Code,
    override val message: String = "",
    val retryAfterSeconds: Int? = null,
    val availableLanguages: List<String> = emptyList(),
    override val cause: Throwable? = null,
) : Exception(message.ifBlank { code.name }, cause) {

    enum class Code {
        INVALID_VIDEO_ID,
        VIDEO_NOT_FOUND,
        PRIVATE_VIDEO,
        UNPLAYABLE_VIDEO,
        NO_CAPTIONS,
        LANGUAGE_UNAVAILABLE,
        TRANSCRIPT_UNAVAILABLE,
        RATE_LIMITED,
        UPSTREAM_ERROR,
        // client-side
        NETWORK_ERROR,
        TIMEOUT,
        PARSE_ERROR,
        BAD_REQUEST,
        UNKNOWN,
        ;

        companion object {
            fun fromWire(value: String?): Code = when (value) {
                "INVALID_VIDEO_ID" -> INVALID_VIDEO_ID
                "VIDEO_NOT_FOUND" -> VIDEO_NOT_FOUND
                "PRIVATE_VIDEO" -> PRIVATE_VIDEO
                "UNPLAYABLE_VIDEO" -> UNPLAYABLE_VIDEO
                "NO_CAPTIONS" -> NO_CAPTIONS
                "LANGUAGE_UNAVAILABLE" -> LANGUAGE_UNAVAILABLE
                "TRANSCRIPT_UNAVAILABLE" -> TRANSCRIPT_UNAVAILABLE
                "RATE_LIMITED" -> RATE_LIMITED
                "UPSTREAM_ERROR" -> UPSTREAM_ERROR
                "BAD_REQUEST" -> BAD_REQUEST
                "NOT_FOUND" -> BAD_REQUEST
                else -> UNKNOWN
            }
        }
    }

    val title: String
        get() = when (code) {
            Code.VIDEO_NOT_FOUND -> "Video not found"
            Code.PRIVATE_VIDEO -> "Private video"
            Code.UNPLAYABLE_VIDEO -> "Video unavailable"
            Code.NO_CAPTIONS -> "No captions on this video"
            Code.LANGUAGE_UNAVAILABLE -> "That language isn't on this video"
            Code.TRANSCRIPT_UNAVAILABLE -> "Transcript blocked"
            Code.RATE_LIMITED -> "Slow down a moment"
            Code.TIMEOUT -> "Request timed out"
            Code.NETWORK_ERROR -> "No connection"
            Code.UPSTREAM_ERROR -> "YouTube hiccup"
            Code.INVALID_VIDEO_ID, Code.BAD_REQUEST -> "Check that link"
            Code.PARSE_ERROR -> "Unexpected response"
            Code.UNKNOWN -> "Something went wrong"
        }

    val suggestion: String
        get() = when (code) {
            Code.VIDEO_NOT_FOUND -> "The video may be deleted or the link incomplete. Check the URL and try again."
            Code.PRIVATE_VIDEO -> "This video needs a sign-in, so its captions can't be reached. Try a public video."
            Code.UNPLAYABLE_VIDEO -> "YouTube won't serve this video right now. Age-restricted and region-locked videos often can't be read."
            Code.NO_CAPTIONS -> "Auto-captions often appear a few hours after upload. Try again later, or pick a video that has CC."
            Code.LANGUAGE_UNAVAILABLE ->
                if (availableLanguages.isNotEmpty())
                    "Available: ${availableLanguages.take(8).joinToString(", ")}. Pick one, or turn on smart auto-translate in Settings."
                else "Pick a language this video offers, or turn on smart auto-translate in Settings."
            Code.TRANSCRIPT_UNAVAILABLE -> "YouTube refused to hand over the caption file. This usually clears up on a retry."
            Code.RATE_LIMITED -> retryAfterSeconds?.let { "Too many requests — try again in ${it}s." }
                ?: "Too many requests from this network. Wait a few seconds and retry."
            Code.TIMEOUT -> "YouTube is answering slowly. Retry, or try a shorter video."
            Code.NETWORK_ERROR -> "CaptionGrab couldn't reach the transcript service. Check your connection — saved captures still work offline."
            Code.UPSTREAM_ERROR -> "YouTube didn't respond properly. Wait a moment and retry."
            Code.INVALID_VIDEO_ID -> "Paste a full YouTube link or an 11-character video id."
            Code.BAD_REQUEST -> "That request wasn't understood. Try pasting the link again."
            Code.PARSE_ERROR -> "The service answered with something unexpected. Retry in a moment."
            Code.UNKNOWN -> "Please try again. If it keeps happening, try a different video."
        }

    val isRetryable: Boolean
        get() = code in setOf(
            Code.NETWORK_ERROR, Code.TIMEOUT, Code.UPSTREAM_ERROR,
            Code.RATE_LIMITED, Code.TRANSCRIPT_UNAVAILABLE, Code.UNKNOWN, Code.PARSE_ERROR,
        )

    companion object {
        fun network(cause: Throwable? = null) = ApiError(
            Code.NETWORK_ERROR,
            "Couldn't reach the transcript service.",
            cause = cause,
        )

        fun timeout(cause: Throwable? = null) = ApiError(
            Code.TIMEOUT,
            "The request timed out.",
            cause = cause,
        )
    }
}
