package com.captiongrab.app.platform

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.net.Uri
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.widget.Toast
import androidx.core.content.FileProvider
import com.captiongrab.app.data.TranscriptFormat
import com.captiongrab.app.data.YouTubeUrl
import java.io.File
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Everything that needs an Android context, in one place: clipboard, share
 * sheet, storage-access-framework export, YouTube handoff, haptics and
 * connectivity. Keeping these out of composables makes the UI testable and
 * keeps platform quirks (API 24 → 34) in one file.
 */
class AndroidServices(private val context: Context) {

    /* ------------------------------------------------------------------ */
    /* Clipboard                                                           */
    /* ------------------------------------------------------------------ */

    fun copyToClipboard(text: String, label: String = "Transcript"): Boolean = runCatching {
        val manager = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        manager.setPrimaryClip(ClipData.newPlainText(label, text))
        // Android 13+ shows its own clipboard confirmation; older versions need ours.
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.S_V2) {
            toast("$label copied")
        }
        true
    }.getOrDefault(false)

    fun readClipboard(): String? = runCatching {
        val manager = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        val clip = manager.primaryClip ?: return null
        if (clip.itemCount == 0) return null
        clip.getItemAt(0).coerceToText(context)?.toString()?.trim()?.takeIf { it.isNotEmpty() }
    }.getOrNull()

    fun clipboardLooksLikeVideo(): String? = readClipboard()?.takeIf { YouTubeUrl.extractVideoId(it) != null }

    /* ------------------------------------------------------------------ */
    /* Share                                                               */
    /* ------------------------------------------------------------------ */

    fun shareText(text: String, subject: String, chooserTitle: String = "Share transcript") {
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_SUBJECT, subject)
            putExtra(Intent.EXTRA_TEXT, text)
        }
        launchChooser(intent, chooserTitle)
    }

    /** Share an exported file so the user can drop it straight into Drive/WhatsApp/Notes. */
    fun shareFile(file: File, mime: String, chooserTitle: String = "Share transcript") {
        val uri = fileUri(file) ?: return
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = mime
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        launchChooser(intent, chooserTitle)
    }

    fun fileUri(file: File): Uri? = runCatching {
        FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
    }.getOrNull()

    /** Writable cache location used for document-picker exports. */
    fun exportCacheFile(name: String): File {
        val dir = File(context.cacheDir, "exports").apply { mkdirs() }
        return File(dir, name)
    }

    private fun launchChooser(intent: Intent, title: String) {
        runCatching {
            val chooser = Intent.createChooser(intent, title).apply {
                if (context !is android.app.Activity) addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(chooser)
        }.onFailure { toast("Nothing on this device can share that") }
    }

    /* ------------------------------------------------------------------ */
    /* YouTube handoff (no WebView — the official app or browser)           */
    /* ------------------------------------------------------------------ */

    /**
     * Open the video at a timestamp. Preference order:
     *  1. YouTube app via `vnd.youtube:` (supports the exact timestamp)
     *  2. https link, which Android resolves to the YouTube app when installed
     *  3. any browser
     */
    fun openVideo(videoId: String, startSeconds: Int = 0, preferApp: Boolean = true) {
        val seconds = startSeconds.coerceAtLeast(0)
        if (preferApp) {
            val deepLink = if (seconds > 0) "vnd.youtube:$videoId?t=$seconds" else "vnd.youtube:$videoId"
            if (tryStart(Intent(Intent.ACTION_VIEW, Uri.parse(deepLink)))) return
        }
        val web = YouTubeUrl.watchUrlAt(videoId, seconds)
        if (tryStart(Intent(Intent.ACTION_VIEW, Uri.parse(web)))) return
        toast("No app available to open YouTube")
    }

    fun openUrl(url: String) {
        if (!tryStart(Intent(Intent.ACTION_VIEW, Uri.parse(url)))) {
            toast("No app available to open that link")
        }
    }

    fun openChannelUrl(author: String) {
        if (author.isBlank()) return
        val q = Uri.encode("\"$author\"")
        openUrl("https://www.youtube.com/results?search_query=$q")
    }

    private fun tryStart(intent: Intent): Boolean = runCatching {
        if (context !is android.app.Activity) intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
        true
    }.getOrElse { false }

    /* ------------------------------------------------------------------ */
    /* Haptics                                                             */
    /* ------------------------------------------------------------------ */

    fun tick() {
        runCatching {
            val vibrator: Vibrator? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                (context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager)?.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            } ?: return
            if (!vibrator.hasVibrator()) return
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                vibrator.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_TICK))
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(12)
            }
        }
    }

    fun toast(message: String) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
    }

    /* ------------------------------------------------------------------ */
    /* Connectivity                                                        */
    /* ------------------------------------------------------------------ */

    private val _online = MutableStateFlow(isOnlineNow())
    val online: StateFlow<Boolean> = _online.asStateFlow()

    fun startNetworkMonitoring() {
        val manager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return
        runCatching {
            manager.registerNetworkCallback(
                NetworkRequest.Builder()
                    .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                    .build(),
                object : ConnectivityManager.NetworkCallback() {
                    override fun onAvailable(network: Network) { _online.value = true }
                    override fun onLost(network: Network) { _online.value = isOnlineNow() }
                    override fun onCapabilitiesChanged(network: Network, caps: NetworkCapabilities) {
                        _online.value = caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED) ||
                            caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                    }
                },
            )
        }
        _online.value = isOnlineNow()
    }

    fun isOnlineNow(): Boolean = runCatching {
        val manager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return true
        val caps = manager.getNetworkCapabilities(manager.activeNetwork) ?: return false
        caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }.getOrDefault(true)

    /* ------------------------------------------------------------------ */
    /* Misc                                                                */
    /* ------------------------------------------------------------------ */

    fun shareApp() {
        shareText(
            "CaptionGrab — grab any YouTube transcript with real timecodes, free and private. " +
                "No sign-up, no API keys.",
            subject = "CaptionGrab",
            chooserTitle = "Share CaptionGrab",
        )
    }

    fun attributionFor(title: String, author: String, videoId: String, languageName: String): String = buildString {
        append("\n\n—\nTranscript: \"$title\"")
        if (author.isNotBlank()) append(" by $author")
        append("\nSource: ${YouTubeUrl.watchUrl(videoId)}")
        append("\nLanguage: $languageName · Captured with CaptionGrab")
    }

    fun exportSummary(format: TranscriptFormat.ExportFormat, name: String) = "Saved $name"
}
