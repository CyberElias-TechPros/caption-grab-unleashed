package com.captiongrab.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.captiongrab.app.data.YouTubeUrl
import com.captiongrab.app.ui.AppViewModel
import com.captiongrab.app.ui.CaptionGrabAppRoot

/**
 * Single activity. No WebView, no fragments — Compose throughout.
 *
 * Inbound paths that make it feel like a real Android citizen:
 *  - Share sheet (`ACTION_SEND`, text/plain) from the YouTube app
 *  - `ACTION_VIEW` on youtube.com / youtu.be links ("Open with CaptionGrab")
 */
class MainActivity : ComponentActivity() {

    private val viewModel: AppViewModel by viewModels()

    private var incomingLink by mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Only honour a share/deep link on a fresh launch — not on rotation,
        // which would silently re-run the last extraction.
        if (savedInstanceState == null) handleIntent(intent)

        setContent {
            CaptionGrabAppRoot(
                viewModel = viewModel,
                incomingLink = incomingLink,
                onIncomingLinkHandled = { incomingLink = null },
            )
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        if (intent == null) return
        val text: String? = when (intent.action) {
            Intent.ACTION_SEND -> intent.getStringExtra(Intent.EXTRA_TEXT)
            Intent.ACTION_VIEW -> intent.dataString
            else -> null
        }
        val id = text?.let { YouTubeUrl.extractVideoId(it) } ?: return
        incomingLink = id
    }

}
