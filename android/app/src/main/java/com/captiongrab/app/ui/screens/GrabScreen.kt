package com.captiongrab.app.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ArrowForward
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.BoltOutlined
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.ContentPaste
import androidx.compose.material.icons.rounded.ErrorOutline
import androidx.compose.material.icons.rounded.Language
import androidx.compose.material.icons.rounded.Link
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material.icons.rounded.Verified
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.captiongrab.app.data.ApiError
import com.captiongrab.app.data.CaptionTrack
import com.captiongrab.app.data.TrackKind
import com.captiongrab.app.data.VideoInfo
import com.captiongrab.app.data.YouTubeUrl
import com.captiongrab.app.ui.AppViewModel
import com.captiongrab.app.ui.Extraction
import com.captiongrab.app.ui.components.CaptionCard
import com.captiongrab.app.ui.components.EmptyState
import com.captiongrab.app.ui.components.Equaliser
import com.captiongrab.app.ui.components.GhostButton
import com.captiongrab.app.ui.components.GradientText
import com.captiongrab.app.ui.components.MonoLabel
import com.captiongrab.app.ui.components.NewBadge
import com.captiongrab.app.ui.components.PrimaryButton
import com.captiongrab.app.ui.components.SectionHeading
import com.captiongrab.app.ui.components.Tag
import com.captiongrab.app.ui.theme.CaptionTheme

private data class Sample(val label: String, val id: String, val blurb: String)

private val SAMPLES = listOf(
    Sample("TED · Try something new", "8jPQjjsBbIc", "A talk with clean creator captions"),
    Sample("Fireship · 100 seconds", "vu6Jp8RIZLU", "Fast dev explainer, auto-captions"),
    Sample("Kurzgesagt · Science", "sNhhvQGsMEc", "Animated explainer with 20+ languages"),
)

/**
 * Screen 1 — Grab.
 *
 * One job: turn a link into a transcript with as few taps as possible. The
 * link can arrive three ways (typed, pasted, shared from YouTube), so all three
 * land in the same field and the same flow.
 */
@Composable
fun GrabScreen(
    vm: AppViewModel,
    extraction: Extraction,
    url: String,
    onUrlChange: (String) -> Unit,
    onOpenSettings: () -> Unit,
    onOpenLibrary: () -> Unit,
) {
    val c = CaptionTheme.colors
    val detectedId = remember(url) { YouTubeUrl.extractVideoId(url) }
    val savedEntries by vm.entries.collectAsStateWithLifecycle()
    val scroll = rememberScrollState()

    val busy = extraction is Extraction.Resolving || extraction is Extraction.Working
    val video = when (extraction) {
        is Extraction.Working -> extraction.video
        is Extraction.Ready -> extraction.video
        is Extraction.Failed -> extraction.video
        else -> null
    }
    val error = (extraction as? Extraction.Failed)?.error

    Column(
        Modifier
            .fillMaxWidth()
            .verticalScroll(scroll)
            .imePadding()
            .padding(horizontal = 20.dp),
    ) {
        Spacer(Modifier.height(18.dp))

        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            NewBadge("Free")
            Spacer(Modifier.width(10.dp))
            Text(
                "No sign-up · no API key · no ads",
                style = MaterialTheme.typography.bodySmall,
                color = c.textMuted,
            )
        }

        Spacer(Modifier.height(18.dp))

        Text(
            "Every word,",
            style = MaterialTheme.typography.displayLarge,
            color = c.text,
        )
        GradientText("timestamped.", style = MaterialTheme.typography.displayLarge)
        Spacer(Modifier.height(14.dp))
        Text(
            "Paste a YouTube link and get a clean, searchable transcript with real " +
                "timecodes. Tap a line to jump the video, then export as SRT, VTT, TXT or JSON.",
            style = MaterialTheme.typography.bodyMedium,
            color = c.textMuted,
        )

        Spacer(Modifier.height(24.dp))

        // ── The link ──────────────────────────────────────────────────────
        CaptionCard(modifier = Modifier.fillMaxWidth(), highlighted = detectedId != null) {
            Column(Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    StepBadge("1")
                    Spacer(Modifier.width(9.dp))
                    MonoLabel("Paste a YouTube link")
                    Spacer(Modifier.weight(1f))
                    if (detectedId != null) {
                        Tag("Valid id", color = c.green, icon = Icons.Rounded.Check, filled = true)
                    }
                }

                Spacer(Modifier.height(12.dp))

                OutlinedTextField(
                    value = url,
                    onValueChange = onUrlChange,
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = {
                        Text(
                            "youtube.com/watch?v=…  or  11-char id",
                            color = c.textFaint,
                            style = MaterialTheme.typography.bodyMedium,
                        )
                    },
                    singleLine = true,
                    shape = RoundedCornerShape(14.dp),
                    textStyle = MaterialTheme.typography.bodyMedium,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Uri,
                        imeAction = ImeAction.Go,
                    ),
                    keyboardActions = KeyboardActions(onGo = { vm.submit(url) }),
                    leadingIcon = {
                        Icon(Icons.Rounded.Link, contentDescription = null, tint = c.textMuted, modifier = Modifier.size(18.dp))
                    },
                    trailingIcon = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            if (url.isNotEmpty()) {
                                Icon(
                                    Icons.Rounded.ContentPaste,
                                    contentDescription = "Paste from clipboard",
                                    tint = c.primary,
                                    modifier = Modifier
                                        .size(30.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .clickable {
                                            vm.services.readClipboard()?.let { onUrlChange(it) }
                                        }
                                        .padding(6.dp),
                                )
                            }
                        }
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = c.primary.copy(alpha = 0.7f),
                        unfocusedBorderColor = c.border,
                        focusedContainerColor = c.backgroundElevated.copy(alpha = 0.7f),
                        unfocusedContainerColor = c.backgroundElevated.copy(alpha = 0.45f),
                        cursorColor = c.primary,
                        focusedTextColor = c.text,
                        unfocusedTextColor = c.text,
                    ),
                )

                // Clipboard hint: the highest-value shortcut on a phone.
                val clipId = remember(url) { if (url.isBlank()) vm.services.clipboardLooksLikeVideo() else null }
                AnimatedVisibility(visible = clipId != null) {
                    Column {
                        Spacer(Modifier.height(10.dp))
                        Row(
                            Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(c.primary.copy(alpha = 0.10f))
                                .clickable { clipId?.let { onUrlChange(it) } }
                                .padding(horizontal = 12.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Icon(Icons.Rounded.ContentPaste, contentDescription = null, tint = c.primary, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(8.dp))
                            Text(
                                "YouTube link on your clipboard — tap to use it",
                                style = MaterialTheme.typography.bodySmall,
                                color = c.primary,
                                modifier = Modifier.weight(1f),
                            )
                            Icon(Icons.Rounded.ArrowForward, contentDescription = null, tint = c.primary, modifier = Modifier.size(15.dp))
                        }
                    }
                }

                Spacer(Modifier.height(14.dp))

                PrimaryButton(
                    text = when {
                        extraction is Extraction.Resolving -> "Reading the video…"
                        extraction is Extraction.Working -> "Grabbing captions…"
                        else -> "Grab transcript"
                    },
                    onClick = { vm.submit(url) },
                    icon = Icons.Rounded.AutoAwesome,
                    enabled = !busy,
                    loading = busy,
                )

                if (busy) {
                    Spacer(Modifier.height(12.dp))
                    StageStrip(extraction)
                }
            }
        }

        // ── Errors and language choice ────────────────────────────────────
        error?.let {
            Spacer(Modifier.height(14.dp))
            ErrorCard(error = it, onRetry = { vm.retry() }, onOpenSettings = onOpenSettings)
        }

        video?.let { info ->
            Spacer(Modifier.height(14.dp))
            VideoCard(info)
            Spacer(Modifier.height(14.dp))
            LanguageSection(video = info, extraction = extraction, onPick = { vm.extract(info, it) })
        }

        if (video == null && error == null && !busy) {
            Spacer(Modifier.height(22.dp))
            TrySamples(onPick = { sample ->
                onUrlChange(YouTubeUrl.watchUrl(sample.id))
                vm.resolveAndExtract(sample.id)
            })
        }

        Spacer(Modifier.height(26.dp))

        TrustRow()

        Spacer(Modifier.height(18.dp))

        if (savedEntries.isNotEmpty()) {
            Row(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(c.surface.copy(alpha = 0.6f))
                    .border(1.dp, c.border, RoundedCornerShape(16.dp))
                    .clickable(onClick = onOpenLibrary)
                    .padding(horizontal = 14.dp, vertical = 13.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Rounded.Verified, contentDescription = null, tint = c.cyan, modifier = Modifier.size(17.dp))
                Spacer(Modifier.width(9.dp))
                Text(
                    "${savedEntries.size} captures saved on this device",
                    style = MaterialTheme.typography.bodyMedium,
                    color = c.text,
                    modifier = Modifier.weight(1f),
                )
                Icon(Icons.Rounded.ArrowForward, contentDescription = null, tint = c.textMuted, modifier = Modifier.size(16.dp))
            }
        }

        Spacer(Modifier.height(120.dp))
    }
}

/* -------------------------------------------------------------------- */

@Composable
private fun StageStrip(extraction: Extraction) {
    val c = CaptionTheme.colors
    val stages = when (extraction) {
        is Extraction.Working -> listOf("Selecting the best caption track", "Downloading timed text", "Parsing timecodes")
        else -> listOf("Resolving the video", "Asking YouTube for captions", "Reading the track list")
    }
    val transition = rememberInfiniteTransition(label = "stage")
    val progress by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(2400, easing = LinearEasing), RepeatMode.Restart),
        label = "progress",
    )
    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(c.surfaceHigh.copy(alpha = 0.6f))
            .padding(13.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Equaliser(tint = c.primary, height = 13.dp)
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                stages.forEachIndexed { index, label ->
                    val active = progress >= index.toFloat() / stages.size
                    Text(
                        label,
                        style = MaterialTheme.typography.bodySmall.copy(fontSize = 12.sp),
                        color = if (active) c.text else c.textFaint,
                    )
                }
            }
            Text(
                "${(progress * 100).toInt()}%",
                style = MaterialTheme.typography.labelSmall,
                color = c.textFaint,
            )
        }
        Spacer(Modifier.height(10.dp))
        Box(
            Modifier
                .fillMaxWidth()
                .height(3.dp)
                .clip(RoundedCornerShape(50))
                .background(c.border),
        ) {
            Box(
                Modifier
                    .fillMaxWidth(progress.coerceIn(0.05f, 1f))
                    .height(3.dp)
                    .clip(RoundedCornerShape(50))
                    .background(Brush.horizontalGradient(listOf(c.primary, c.magenta))),
            )
        }
    }
}

@Composable
private fun ErrorCard(error: ApiError, onRetry: () -> Unit, onOpenSettings: () -> Unit) {
    val c = CaptionTheme.colors
    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(c.danger.copy(alpha = 0.10f))
            .border(1.dp, c.danger.copy(alpha = 0.35f), RoundedCornerShape(18.dp))
            .padding(15.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Rounded.ErrorOutline, contentDescription = null, tint = c.danger, modifier = Modifier.size(19.dp))
            Spacer(Modifier.width(8.dp))
            Text(error.title, style = MaterialTheme.typography.titleMedium, color = c.text)
        }
        Spacer(Modifier.height(6.dp))
        Text(
            error.message.ifBlank { error.suggestion },
            style = MaterialTheme.typography.bodyMedium,
            color = c.text.copy(alpha = 0.85f),
        )
        if (error.message.isNotBlank() && error.message != error.suggestion) {
            Spacer(Modifier.height(4.dp))
            Text(error.suggestion, style = MaterialTheme.typography.bodySmall, color = c.textMuted)
        }
        Spacer(Modifier.height(12.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            if (error.isRetryable) {
                GhostButton("Try again", onRetry, icon = Icons.Rounded.Refresh, height = 42.dp)
            }
            if (error.code == ApiError.Code.LANGUAGE_UNAVAILABLE) {
                GhostButton("Auto-translate", onOpenSettings, icon = Icons.Rounded.Settings, height = 42.dp)
            }
        }
    }
}

@Composable
private fun VideoCard(info: VideoInfo) {
    val c = CaptionTheme.colors
    CaptionCard(modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    Modifier
                        .size(38.dp)
                        .clip(RoundedCornerShape(11.dp))
                        .background(Brush.linearGradient(listOf(c.primary.copy(alpha = 0.3f), c.magenta.copy(alpha = 0.2f)))),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Rounded.Verified, contentDescription = null, tint = c.text, modifier = Modifier.size(19.dp))
                }
                Spacer(Modifier.width(11.dp))
                Column(Modifier.weight(1f)) {
                    Text(
                        info.title.ifBlank { info.videoId },
                        style = MaterialTheme.typography.titleMedium,
                        color = c.text,
                        maxLines = 2,
                    )
                    Text(
                        info.author.ifBlank { "YouTube" } +
                            if (info.lengthSeconds > 0) " · ${com.captiongrab.app.data.TranscriptFormat.formatDuration(info.lengthSeconds)}" else "",
                        style = MaterialTheme.typography.bodySmall,
                        color = c.textMuted,
                        maxLines = 1,
                    )
                }
            }
        }
    }
}

@Composable
private fun LanguageSection(
    video: VideoInfo,
    extraction: Extraction,
    onPick: (String) -> Unit,
) {
    val c = CaptionTheme.colors
    val selected = when (extraction) {
        is Extraction.Working -> extraction.language
        is Extraction.Ready -> extraction.transcript.language
        else -> null
    }
    val manual = video.tracks.filter { it.kind == TrackKind.MANUAL }
    val auto = video.tracks.filter { it.kind == TrackKind.AUTO }

    CaptionCard(modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                StepBadge("2")
                Spacer(Modifier.width(9.dp))
                MonoLabel("Pick a caption track")
                Spacer(Modifier.weight(1f))
                Text(
                    "${video.tracks.size} available",
                    style = MaterialTheme.typography.bodySmall,
                    color = c.textMuted,
                )
            }
            Spacer(Modifier.height(4.dp))
            Text(
                "Creator captions are the most accurate. Auto-generated tracks cover almost every upload.",
                style = MaterialTheme.typography.bodySmall,
                color = c.textFaint,
            )
            Spacer(Modifier.height(14.dp))

            if (manual.isNotEmpty()) {
                MonoLabel("Creator captions", color = c.green, size = 9.5f)
                Spacer(Modifier.height(8.dp))
                TrackChips(manual, selected, onPick, accent = c.green)
                Spacer(Modifier.height(14.dp))
            }
            if (auto.isNotEmpty()) {
                MonoLabel("Auto-generated", color = c.amber, size = 9.5f)
                Spacer(Modifier.height(8.dp))
                TrackChips(auto, selected, onPick, accent = c.amber)
            }
        }
    }
}

@Composable
private fun TrackChips(tracks: List<CaptionTrack>, selected: String?, onPick: (String) -> Unit, accent: Color) {
    val c = CaptionTheme.colors
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
        maxItemsInEachRow = 3,
    ) {
        tracks.forEach { track ->
            val isSelected = track.languageCode.equals(selected, ignoreCase = true)
            val bg by animateColorAsState(
                if (isSelected) accent.copy(alpha = 0.22f) else c.surfaceHigh.copy(alpha = 0.65f),
                label = "chipBg",
            )
            Row(
                Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .background(bg)
                    .border(
                        1.dp,
                        if (isSelected) accent.copy(alpha = 0.7f) else c.border,
                        RoundedCornerShape(12.dp),
                    )
                    .clickable { onPick(track.languageCode) }
                    .padding(horizontal = 11.dp, vertical = 9.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(
                    Icons.Rounded.Language,
                    contentDescription = null,
                    tint = if (isSelected) accent else c.textMuted,
                    modifier = Modifier.size(13.dp),
                )
                Spacer(Modifier.width(6.dp))
                Text(
                    track.languageName.ifBlank { track.languageCode },
                    style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Medium),
                    color = if (isSelected) c.text else c.textMuted,
                )
                if (track.translatable) {
                    Spacer(Modifier.width(4.dp))
                    Icon(Icons.Rounded.BoltOutlined, contentDescription = "Can be machine-translated", tint = c.cyan, modifier = Modifier.size(11.dp))
                }
            }
        }
    }
}

@Composable
private fun TrySamples(onPick: (Sample) -> Unit) {
    val c = CaptionTheme.colors
    Column {
        SectionHeading(eyebrow = "Try it now", title = "Three taps, no link")
        Spacer(Modifier.height(12.dp))
        SAMPLES.forEach { sample ->
            Row(
                Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp)
                    .clip(RoundedCornerShape(15.dp))
                    .background(c.surface.copy(alpha = 0.55f))
                    .border(1.dp, c.border, RoundedCornerShape(15.dp))
                    .clickable { onPick(sample) }
                    .padding(horizontal = 14.dp, vertical = 13.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(Modifier.weight(1f)) {
                    Text(sample.label, style = MaterialTheme.typography.titleMedium, color = c.text)
                    Text(sample.blurb, style = MaterialTheme.typography.bodySmall, color = c.textMuted)
                }
                Icon(Icons.Rounded.ArrowForward, contentDescription = null, tint = c.primary, modifier = Modifier.size(18.dp))
            }
        }
    }
}

@Composable
private fun TrustRow() {
    val c = CaptionTheme.colors
    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(Brush.linearGradient(listOf(c.primary.copy(alpha = 0.10f), c.cyan.copy(alpha = 0.06f))))
            .padding(16.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Rounded.Verified, contentDescription = null, tint = c.cyan, modifier = Modifier.size(16.dp))
            Spacer(Modifier.width(8.dp))
            Text("Private by default", style = MaterialTheme.typography.titleMedium, color = c.text)
        }
        Spacer(Modifier.height(6.dp))
        Text(
            "Captures are stored only on this device. No account, no tracking, nothing to leak — " +
                "and your library still opens when you're offline.",
            style = MaterialTheme.typography.bodySmall,
            color = c.textMuted,
        )
    }
}

@Composable
fun StepBadge(text: String) {
    val c = CaptionTheme.colors
    Box(
        Modifier
            .size(22.dp)
            .clip(RoundedCornerShape(50))
            .background(c.primary.copy(alpha = 0.18f)),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text,
            style = MaterialTheme.typography.bodySmall.copy(
                fontWeight = FontWeight.Bold,
                fontSize = 11.sp,
            ),
            color = c.primary,
            textAlign = TextAlign.Center,
        )
    }
}
