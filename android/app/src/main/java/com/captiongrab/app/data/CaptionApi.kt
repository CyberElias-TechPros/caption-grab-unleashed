package com.captiongrab.app.data

import java.io.IOException
import java.net.SocketTimeoutException
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.Call
import okhttp3.Callback
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * Client for the CaptionGrab Worker API.
 *
 * Zero secrets ship in the app: the Worker resolves YouTube caption tracks
 * server-side (a phone can't do that itself — YouTube's timedtext endpoints
 * have no CORS and `captions.download` needs OAuth). See docs/ARCHITECTURE.md.
 */
class CaptionApi(
    private val baseUrl: String,
    private val client: OkHttpClient = defaultClient(),
) {
    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        explicitNulls = false
        coerceInputValues = true
    }

    @Volatile
    private var cachedHealth: Health? = null

    data class Health(val reachable: Boolean, val degraded: Boolean, val checkedAt: Long)

    suspend fun videoInfo(videoId: String): VideoInfo {
        requireId(videoId)
        val url = urlBuilder("api/video").addQueryParameter("id", videoId).build()
        val body = get(url)
        return decode(body) { json.decodeFromString<VideoInfo>(body) }
    }

    suspend fun transcript(videoId: String, language: String, allowTranslate: Boolean): Transcript {
        requireId(videoId)
        val url = urlBuilder("api/transcript")
            .addQueryParameter("id", videoId)
            .addQueryParameter("lang", language.ifBlank { "en" })
            .addQueryParameter("translate", if (allowTranslate) "1" else "0")
            .build()
        val body = get(url)
        return decode(body) { json.decodeFromString<Transcript>(body) }
    }

    /** Cheap liveness probe used by the status chip and the first-run check. */
    suspend fun health(force: Boolean = false): Health {
        val cached = cachedHealth
        val now = System.currentTimeMillis()
        if (!force && cached != null && now - cached.checkedAt < 45_000) return cached
        val health = try {
            val body = get(urlBuilder("api/health").build())
            val obj = json.parseToJsonElement(body) as? JsonObject
            Health(
                reachable = obj?.get("ok")?.jsonPrimitive?.content?.toBooleanStrictOrNull() == true,
                degraded = obj?.get("degraded")?.jsonPrimitive?.content?.toBooleanStrictOrNull() == true ||
                    obj?.get("demo")?.jsonPrimitive?.content?.toBooleanStrictOrNull() == true,
                checkedAt = now,
            )
        } catch (e: Exception) {
            // Health is advisory: any failure simply reads as "unreachable".
            Health(reachable = false, degraded = false, checkedAt = now)
        }
        cachedHealth = health
        return health
    }

    /* ------------------------------------------------------------------ */
    /* transport                                                           */
    /* ------------------------------------------------------------------ */

    private fun urlBuilder(path: String): HttpUrl.Builder {
        val base = (baseUrl.ifBlank { DEFAULT_BASE }.trimEnd('/')) + "/" + path.trimStart('/')
        return base.toHttpUrlOrNull()?.newBuilder()
            ?: throw ApiError(ApiError.Code.BAD_REQUEST, "The API base URL is misconfigured.")
    }

    private fun requireId(videoId: String) {
        if (!YouTubeUrl.isValidVideoId(videoId)) {
            throw ApiError(ApiError.Code.INVALID_VIDEO_ID, "Not a valid YouTube video id: $videoId")
        }
    }

    private suspend fun get(url: HttpUrl): String = withContext(Dispatchers.IO) {
        val request = Request.Builder()
            .url(url)
            .header("accept", "application/json")
            .header("user-agent", "CaptionGrab-Android/1.0")
            .get()
            .build()

        val response: Response = try {
            client.newCall(request).await()
        } catch (e: SocketTimeoutException) {
            throw ApiError.timeout(e)
        } catch (e: IOException) {
            throw ApiError.network(e)
        }

        response.use { res ->
            val body = res.body?.string().orEmpty()
            if (!res.isSuccessful) throw errorFromResponse(res.code, res.header("retry-after"), body)
            if (body.isBlank()) throw ApiError(ApiError.Code.PARSE_ERROR, "The service returned an empty response.")
            body
        }
    }

    private fun errorFromResponse(status: Int, retryAfterHeader: String?, body: String): ApiError {
        var code: ApiError.Code? = null
        var message = ""
        var available: List<String> = emptyList()

        runCatching {
            val root = json.parseToJsonElement(body).jsonObject
            val err = root["error"]?.jsonObject
            code = ApiError.Code.fromWire(err?.get("code")?.jsonPrimitive?.content)
            message = err?.get("message")?.jsonPrimitive?.content.orEmpty()
            err?.get("details")?.jsonObject?.get("availableLanguages")?.jsonArray?.forEach {
                it.jsonPrimitive.contentOrNullSafe()?.let { lang -> available = available + lang }
            }
        }

        val retryAfter = retryAfterHeader?.trim()?.toLongOrNull()?.toInt()
            ?: Regex("""(\d+)s""").find(message)?.groupValues?.get(1)?.toIntOrNull()

        val resolved = code ?: when (status) {
            404 -> ApiError.Code.VIDEO_NOT_FOUND
            429 -> ApiError.Code.RATE_LIMITED
            400 -> ApiError.Code.BAD_REQUEST
            403 -> ApiError.Code.PRIVATE_VIDEO
            else -> ApiError.Code.UPSTREAM_ERROR
        }
        return ApiError(resolved, message, retryAfter, available)
    }

    private inline fun <T> decode(body: String, block: () -> T): T = try {
        block()
    } catch (e: ApiError) {
        throw e
    } catch (e: Exception) {
        throw ApiError(ApiError.Code.PARSE_ERROR, "Couldn't read the transcript service response.", cause = e)
    }

    private fun kotlinx.serialization.json.JsonPrimitive.contentOrNullSafe(): String? =
        if (this is kotlinx.serialization.json.JsonNull) null else content

    companion object {
        /** Production Worker. Overridden at build time via `CAPTIONGRAB_API_URL`. */
        const val DEFAULT_BASE = "https://captiongrab-api.cyber-e54.workers.dev"

        fun defaultClient(): OkHttpClient = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(35, TimeUnit.SECONDS)
            .callTimeout(45, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build()
    }
}

/** Suspending bridge over OkHttp's callback API (no extra dependency). */
private suspend fun Call.await(): Response = suspendCancellableCoroutine { cont ->
    enqueue(object : Callback {
        override fun onResponse(call: Call, response: Response) {
            cont.resume(response)
        }

        override fun onFailure(call: Call, e: IOException) {
            if (cont.isCancelled) return
            cont.resumeWithException(e)
        }
    })
    cont.invokeOnCancellation { runCatching { cancel() } }
}
