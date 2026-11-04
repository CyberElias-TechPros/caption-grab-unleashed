package com.captiongrab.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Article
import androidx.compose.material.icons.rounded.ContentCopy
import androidx.compose.material.icons.rounded.FileDownload
import androidx.compose.material.icons.rounded.FormatListBulleted
import androidx.compose.material.icons.rounded.Language
import androidx.compose.material.icons.rounded.OpenInNew
import androidx.compose.material.icons.rounded.Share
import androidx.compose.material.icons.rounded.SmartToy
import androidx.compose.material.icons.rounded.Translate
import androidx.compose.material.icons.rounded.VerifiedUser
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.captiongrab.app.data.Transcript
import com.captiongrab.app.data.VideoInfo
import com.captiongrab.app.data.TranscriptFormat
import com.captiongrab.app.data.TranscriptView
import com.captiongrab.app.ui.AppViewModel
import com.captiongrab.app.ui.Extraction
import com.captiongrab.app.ui.components.Equaliser
import com.captiongrab.app.ui.components.GhostButton
import com.captiongrab.app.ui.components.IconPill
import com.captiongrab.app.ui.components.MonoLabel
import com.captiongrab.app.ui.components.PlayerRail
import com.captiongrab.app.ui.components.Tag
import com.captiongrab.app.ui.components.TranscriptReader
import com.captiongrab.app.ui.theme.CaptionTheme

/**
 * Screen 2 — the transcript studio.
 *
 * Everything the reader needs without leaving the page: language switching,
 * view mode, search, copy/share, and export. The video stays one tap away via
 * the player rail (the YouTube app opens at the tapped timecode).
 */
@Composable
fun TranscriptScreen(
    vm: AppViewModel,
    extraction: Extraction,
    onBack: () -> Unit,
    onExport: (Transcript) -> Unit,
    onCopy: (Transcript, Boolean) -> Unit,
    onShare: (Transcript, Boolean) -> Unit,
    onChooseLanguage: (Transcript) -> Unit,
) {
    when (extraction) {
        is Extraction.Ready -> ReadyContent(
            vm = vm,
            transcript = extraction.transcript,
            video = extraction.video,
            onBack = onBack,
            onExport = onExport,
            onCopy = onCopy,
            onShare = onShare,
            onChooseLanguage = onChooseLanguage,
        )

        is Extraction.Working -> WorkingContent(extraction)
        is Extraction.Resolving -> WorkingContent(null)
        is Extraction.Failed -> FailedContent(extraction, vm)
        Extraction.Idle -> WorkingContent(null)
    }
}

@Composable
private fun ReadyContent(
    vm: AppViewModel,
    transcript: Transcript,
    video: VideoInfo?,
    onBack: () -> Unit,
    onExport: (Transcript) -> Unit,
    onCopy: (Transcript, Boolean) -> Unit,
    onShare: (Transcript, Boolean) -> Unit,
    onChooseLanguage: (Transcript) -> Unit,
) {
    val c = CaptionTheme.colors
    val settings by vm.settings.collectAsStateWithLifecycle()
    var query by rememberSaveable(transcript.videoId, transcript.language) { mutableStateOf("") }
    var lastSeek by remember(transcript.videoId, transcript.language) { mutableStateOf<Double?>(null) }
    val view = settings.transcriptView
    val listState = remember(transcript.videoId, transcript.language) { LazyListState() }

    val seek: (Double) -> Unit = { seconds ->
        lastSeek = seconds
        if (settings.hapticsEnabled) vm.services.tick()
        vm.play(transcript, seconds)
    }

    Column(Modifier.fillMaxSize()) {
        TranscriptHeader(
            transcript = transcript,
            onBack = onBack,
            onCopy = { onCopy(transcript, false) },
            onShare = { onShare(transcript, false) },
            onExport = { onExport(transcript) },
            onChooseLanguage = { onChooseLanguage(transcript) },
            onOpenVideo = { vm.play(transcript, 0.0) },
        )

        // ── Meta strip ────────────────────────────────────────────────────
        Row(
            Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(7.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Tag(transcript.languageName, color = c.primary, icon = Icons.Rounded.Language, filled = true)
            Tag(
                if (transcript.isAutoGenerated) "Auto-generated" else "Creator captions",
                color = if (transcript.isAutoGenerated) c.amber else c.green,
                icon = if (transcript.isAutoGenerated) Icons.Rounded.SmartToy else Icons.Rounded.VerifiedUser,
            )
            if (transcript.translated) {
                Tag(
                    "Translated from ${transcript.sourceLanguageName ?: transcript.sourceLanguage ?: "source"}",
                    color = c.cyan,
                    icon = Icons.Rounded.Translate,
                )
            }
            Tag("${transcript.words} words", color = c.textMuted)
            Tag(TranscriptFormat.formatDuration(transcript.durationSeconds), color = c.textMuted)
            if (transcript.demo) Tag("Demo data", color = c.amber, filled = true)
        }

        // ── View switch + inline tools ────────────────────────────────────
        Row(
            Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            ViewChip(
                label = "Timed lines",
                icon = Icons.Rounded.FormatListBulleted,
                selected = view == TranscriptView.SEGMENTS,
                onClick = { vm.setTranscriptView(TranscriptView.SEGMENTS) },
            )
            ViewChip(
                label = "Reading",
                icon = Icons.Rounded.Article,
                selected = view == TranscriptView.PARAGRAPHS,
                onClick = { vm.setTranscriptView(TranscriptView.PARAGRAPHS) },
            )
            Spacer(Modifier.weight(1f))
            // Quick copy of the whole transcript (the dock below has the full actions).
            Box(Modifier.padding(end = 2.dp)) {
                IconPill(
                    icon = Icons.Rounded.ContentCopy,
                    contentDescription = "Copy whole transcript",
                    onClick = { onCopy(transcript, false) },
                    size = 38.dp,
                    tint = c.textMuted,
                    background = c.surfaceHigh.copy(alpha = 0.6f),
                )
            }
        }

        Spacer(Modifier.height(10.dp))

        Box(Modifier.weight(1f)) {
            TranscriptReader(
                transcript = transcript,
                view = view,
                query = query,
                onQueryChange = { query = it },
                onSeek = seek,
                listState = listState,
                focusSecond = lastSeek,
                followAlong = settings.wordHighlight,
                contentPadding = androidx.compose.foundation.layout.PaddingValues(bottom = 28.dp),
                modifier = Modifier.padding(horizontal = 16.dp),
            )
        }

        // ── Sticky action dock ────────────────────────────────────────────
        Column(
            Modifier
                .fillMaxWidth()
                .background(c.background.copy(alpha = 0.97f))
                .padding(horizontal = 16.dp)
                .padding(top = 8.dp, bottom = 12.dp),
        ) {
            PlayerRail(
                transcript = transcript,
                lastSeek = lastSeek,
                onOpenAt = { vm.play(transcript, it) },
                onOpenStart = { vm.play(transcript, 0.0) },
            )
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(Modifier.weight(1f)) {
                    GhostButton(
                        "Share",
                        { onShare(transcript, false) },
                        icon = Icons.Rounded.Share,
                        height = 46.dp,
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
                Box(Modifier.weight(1f)) {
                    Box(
                        Modifier
                            .fillMaxWidth()
                            .height(46.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Brush.linearGradient(listOf(c.primary, c.magenta)))
                            .clickable { onExport(transcript) },
                        contentAlignment = Alignment.Center,
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Rounded.FileDownload, contentDescription = null, tint = c.primaryOn, modifier = Modifier.size(17.dp))
                            Spacer(Modifier.width(7.dp))
                            Text("Export", color = c.primaryOn, style = MaterialTheme.typography.labelLarge)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TranscriptHeader(
    transcript: Transcript,
    onBack: () -> Unit,
    onCopy: () -> Unit,
    onShare: () -> Unit,
    onExport: () -> Unit,
    onChooseLanguage: () -> Unit,
    onOpenVideo: () -> Unit,
) {
    val c = CaptionTheme.colors
    Column(
        Modifier
            .fillMaxWidth()
            .background(c.background.copy(alpha = 0.6f))
            .padding(horizontal = 12.dp)
            .padding(top = 8.dp, bottom = 6.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconPill(
                Icons.Rounded.ArrowBack,
                "Back",
                onBack,
                background = c.surfaceHigh.copy(alpha = 0.7f),
                size = 40.dp,
            )
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    transcript.title.ifBlank { "Transcript" },
                    style = MaterialTheme.typography.titleMedium,
                    color = c.text,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        transcript.author.ifBlank { "YouTube" },
                        style = MaterialTheme.typography.bodySmall,
                        color = c.textMuted,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                    Spacer(Modifier.width(6.dp))
                    Icon(
                        Icons.Rounded.OpenInNew,
                        contentDescription = "Open on YouTube",
                        tint = c.textMuted,
                        modifier = Modifier
                            .size(15.dp)
                            .clickable(onClick = onOpenVideo),
                    )
                }
            }
            IconPill(Icons.Rounded.Language, "Change language", onChooseLanguage, background = c.surfaceHigh.copy(alpha = 0.7f), size = 40.dp)
            Spacer(Modifier.width(7.dp))
            IconPill(Icons.Rounded.Share, "Share", onShare, background = c.surfaceHigh.copy(alpha = 0.7f), size = 40.dp)
        }
    }
}

@Composable
private fun ViewChip(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    selected: Boolean,
    onClick: () -> Unit,
) {
    val c = CaptionTheme.colors
    Row(
        Modifier
            .clip(RoundedCornerShape(50))
            .background(if (selected) c.primary.copy(alpha = 0.16f) else Color.Transparent)
            .border(1.dp, if (selected) c.primary.copy(alpha = 0.5f) else c.border, RoundedCornerShape(50))
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 7.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icon, contentDescription = null, tint = if (selected) c.primary else c.textMuted, modifier = Modifier.size(14.dp))
        Spacer(Modifier.width(5.dp))
        Text(
            label,
            style = MaterialTheme.typography.bodySmall.copy(fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal),
            color = if (selected) c.text else c.textMuted,
            fontSize = 12.5.sp,
        )
    }
}

@Composable
private fun WorkingContent(working: Extraction.Working?) {
    val c = CaptionTheme.colors
    Column(
        Modifier
            .fillMaxSize()
            .padding(28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Equaliser(tint = c.primary, height = 40.dp)
        Spacer(Modifier.height(22.dp))
        Text(
            working?.video?.title ?: "Reading captions from YouTube",
            style = MaterialTheme.typography.headlineSmall,
            color = c.text,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            maxLines = 3,
        )
        Spacer(Modifier.height(8.dp))
        MonoLabel(
            working?.let { "Track: ${it.language}" } ?: "Resolving video…",
            color = c.textMuted,
        )
    }
}

@Composable
private fun FailedContent(failed: Extraction.Failed, vm: AppViewModel) {
    val c = CaptionTheme.colors
    Column(
        Modifier
            .fillMaxSize()
            .padding(28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(failed.error.title, style = MaterialTheme.typography.headlineSmall, color = c.text)
        Spacer(Modifier.height(8.dp))
        Text(
            failed.error.message.ifBlank { failed.error.suggestion },
            style = MaterialTheme.typography.bodyMedium,
            color = c.textMuted,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
        )
        Spacer(Modifier.height(20.dp))
        if (failed.error.isRetryable) {
            GhostButton("Try again", { vm.retry() })
        }
    }
}
