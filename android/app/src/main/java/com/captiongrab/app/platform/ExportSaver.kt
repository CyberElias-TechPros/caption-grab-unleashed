package com.captiongrab.app.platform

import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import java.io.File

/** A file the user asked to save. */
data class ExportPayload(val name: String, val mime: String, val content: String)

/**
 * Saving a transcript to the device.
 *
 * Android 10+ goes straight into `Downloads/CaptionGrab/` through MediaStore —
 * one tap, no picker, and the file shows up in the Files app and Downloads
 * notification. Older devices (API 24–28) fall back to the system document
 * picker, which needs no storage permission at all.
 */
class ExportSaver(private val context: Context) {

    /** Returns true when the file was written. */
    fun save(payload: ExportPayload): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            saveViaMediaStore(payload)?.let { return it }
        }
        return false
    }

    fun saveViaMediaStore(payload: ExportPayload): Boolean? = runCatching {
        val values = ContentValues().apply {
            put(MediaStore.Downloads.DISPLAY_NAME, payload.name)
            put(MediaStore.Downloads.MIME_TYPE, payload.mime)
            put(
                MediaStore.Downloads.RELATIVE_PATH,
                Environment.DIRECTORY_DOWNLOADS + File.separator + "CaptionGrab",
            )
            put(MediaStore.Downloads.IS_PENDING, 1)
        }
        val resolver = context.contentResolver
        val uri: Uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values) ?: return false
        resolver.openOutputStream(uri)?.use { stream ->
            stream.write(payload.content.toByteArray(Charsets.UTF_8))
        } ?: return false
        values.clear()
        values.put(MediaStore.Downloads.IS_PENDING, 0)
        resolver.update(uri, values, null, null)
        true
    }.getOrNull()

    fun writeToUri(uri: Uri, content: String): Boolean = runCatching {
        context.contentResolver.openOutputStream(uri)?.use { it.write(content.toByteArray(Charsets.UTF_8)) } != null
    }.getOrDefault(false)

    /** Absolute destination hint for the confirmation message. */
    fun destinationHint(name: String): String =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) "Downloads/CaptionGrab/$name" else name
}

/**
 * Composable bridge: returns a function that saves (MediaStore on Q+, the
 * document picker otherwise) and reports success through [onResult].
 */
@Composable
fun rememberExportSaver(
    saver: ExportSaver,
    onResult: (Boolean, String) -> Unit,
): (ExportPayload) -> Unit {
    var pending by remember { mutableStateOf<ExportPayload?>(null) }

    val picker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.CreateDocument("text/plain"),
    ) { uri ->
        val payload = pending
        pending = null
        if (payload == null) return@rememberLauncherForActivityResult
        val ok = uri != null && saver.writeToUri(uri, payload.content)
        onResult(ok, payload.name)
    }

    return { payload ->
        val ok = saver.save(payload)
        if (ok) {
            onResult(true, saver.destinationHint(payload.name))
        } else {
            // Legacy path (or MediaStore refused): let the user choose a location.
            pending = payload
            runCatching { picker.launch(payload.name) }.onFailure { onResult(false, payload.name) }
        }
    }
}
