package com.captiongrab.app.ui

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ContentCopy
import androidx.compose.material.icons.rounded.Download
import androidx.compose.material.icons.rounded.FolderOpen
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.Save
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material.icons.rounded.Share
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.captiongrab.app.data.Transcript
import com.captiongrab.app.data.TranscriptFormat
import com.captiongrab.app.data.VideoInfo
import com.captiongrab.app.platform.ExportPayload
import com.captiongrab.app.platform.rememberExportSaver
import com.captiongrab.app.ui.components.AuroraBackdrop
import com.captiongrab.app.ui.components.GhostButton
import com.captiongrab.app.ui.components.GradientDivider
import com.captiongrab.app.ui.components.MonoLabel
import com.captiongrab.app.ui.components.PrimaryButton
import com.captiongrab.app.ui.components.Tag
import com.captiongrab.app.ui.screens.GrabScreen
import com.captiongrab.app.ui.screens.LibraryScreen
import com.captiongrab.app.ui.screens.SettingsScreen
import com.captiongrab.app.ui.screens.TrackRow
import com.captiongrab.app.ui.screens.TranscriptScreen
import com.captiongrab.app.ui.theme.CaptionGrabTheme
import com.captiongrab.app.ui.theme.CaptionTheme
import kotlinx.coroutines.launch

private enum class Tab { GRAB, LIBRARY, SETTINGS }

private enum class ExportAction { SAVE, SHARE, COPY }

/**
 * Root shell: three destinations plus the full-screen transcript reader.
 *
 * Deliberate phone-first choices:
 *  - The bottom bar appears only on browse-level tabs; the reader owns the screen.
 *  - Primary actions live in a docked thumb zone, never at the top edge.
 *  - Back behaviour is shallow and predictable: reader → grab, sheet → dismiss.
 */
@Composable
fun CaptionGrabAppRoot(
    viewModel: AppViewModel,
    incomingLink: String? = null,
    onIncomingLinkHandled: () -> Unit = {},
) {
    val settings by viewModel.settings.collectAsStateWithLifecycle()
    val extraction by viewModel.extraction.collectAsStateWithLifecycle()
    val entries by viewModel.entries.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    var tab by rememberSaveable { mutableStateOf(Tab.GRAB.name) }
    var url by rememberSaveable { mutableStateOf("") }
    var showExport by remember { mutableStateOf(false) }
    var exportTarget by remember { mutableStateOf<Transcript?>(null) }
    var showLanguages by remember { mutableStateOf(false) }
    var languageTarget by remember { mutableStateOf<Transcript?>(null) }

    val currentTab = Tab.entries.firstOrNull { it.name == tab } ?: Tab.GRAB
    val reading = extraction is Extraction.Ready

    val saver = remember { com.captiongrab.app.platform.ExportSaver(viewModel.application()) }
    val saveExport = rememberExportSaver(saver) { ok, name ->
        scope.launch {
            snackbar.showSnackbar(if (ok) "Saved to $name" else "Couldn't save that file")
        }
    }

    LaunchedEffect(incomingLink) {
        val id = incomingLink ?: return@LaunchedEffect
        url = "https://www.youtube.com/watch?v=$id"
        tab = Tab.GRAB.name
        viewModel.resolveAndExtract(id)
        onIncomingLinkHandled()
    }

    LaunchedEffect(Unit) {
        viewModel.messages.collect { message -> snackbar.showSnackbar(message) }
    }

    CaptionGrabTheme(themeMode = settings.themeMode, textSize = settings.textSize) {
        val c = CaptionTheme.colors
        Box(
            Modifier
                .fillMaxSize()
                .background(c.background),
        ) {
            AuroraBackdrop()

            Column(
                Modifier
                    .fillMaxSize()
                    .padding(top = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()),
            ) {
                Box(Modifier.weight(1f)) {
                    AnimatedContent(
                        targetState = reading,
                        transitionSpec = { fadeIn(tween(220)) togetherWith fadeOut(tween(150)) },
                        label = "reader",
                    ) { isReading ->
                        if (isReading) {
                            TranscriptScreen(
                                vm = viewModel,
                                extraction = extraction,
                                onBack = { viewModel.reset() },
                                onExport = { transcript ->
                                    exportTarget = transcript
                                    showExport = true
                                },
                                onCopy = { transcript, withTimestamps ->
                                    val ok = viewModel.copyTranscript(transcript, withTimestamps)
                                    scope.launch {
                                        snackbar.showSnackbar(if (ok) "Copied to clipboard" else "Clipboard unavailable")
                                    }
                                },
                                onShare = { transcript, withTimestamps ->
                                    viewModel.shareTranscript(transcript, withTimestamps)
                                },
                                onChooseLanguage = { transcript ->
                                    languageTarget = transcript
                                    showLanguages = true
                                },
                            )
                        } else {
                            AnimatedContent(
                                targetState = currentTab,
                                transitionSpec = {
                                    if (targetState.ordinal > initialState.ordinal) {
                                        (fadeIn(tween(200)) + slideInHorizontally { it / 16 }) togetherWith
                                            (fadeOut(tween(110)) + slideOutHorizontally { -it / 16 })
                                    } else {
                                        (fadeIn(tween(200)) + slideInHorizontally { -it / 16 }) togetherWith
                                            (fadeOut(tween(110)) + slideOutHorizontally { it / 16 })
                                    }
                                },
                                label = "tabs",
                            ) { target ->
                                when (target) {
                                    Tab.GRAB -> GrabScreen(
                                        vm = viewModel,
                                        extraction = extraction,
                                        url = url,
                                        onUrlChange = { url = it },
                                        onOpenSettings = { tab = Tab.SETTINGS.name },
                                        onOpenLibrary = { tab = Tab.LIBRARY.name },
                                    )

                                    Tab.LIBRARY -> LibraryScreen(
                                        vm = viewModel,
                                        onOpenEntry = { entry ->
                                            viewModel.openEntry(entry)
                                            tab = Tab.GRAB.name
                                        },
                                        onBrowse = { tab = Tab.GRAB.name },
                                    )

                                    Tab.SETTINGS -> SettingsScreen(
                                        vm = viewModel,
                                        onBack = { tab = Tab.GRAB.name },
                                    )
                                }
                            }
                        }
                    }
                }

                if (!reading) {
                    BottomBar(
                        current = currentTab,
                        onSelect = { tab = it.name },
                        libraryCount = entries.size,
                    )
                }
            }

            SnackbarHost(
                hostState = snackbar,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = if (reading) 158.dp else 88.dp)
                    .padding(horizontal = 20.dp),
            ) { data ->
                Box(
                    Modifier
                        .clip(RoundedCornerShape(14.dp))
                        .background(c.surfaceHigh)
                        .border(1.dp, c.border, RoundedCornerShape(14.dp))
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                ) {
                    Text(data.visuals.message, style = MaterialTheme.typography.bodyMedium, color = c.text)
                }
            }
        }

        if (showExport) {
            exportTarget?.let { transcript ->
                ExportSheet(
                    transcript = transcript,
                    defaultFormat = settings.exportFormat,
                    onDismiss = { showExport = false },
                    onAction = { format, action ->
                        showExport = false
                        when (action) {
                            ExportAction.SAVE -> scope.launch {
                                val (content, name) = viewModel.buildExport(transcript, format)
                                saveExport(ExportPayload(name, format.mime, content))
                            }

                            ExportAction.SHARE -> scope.launch {
                                val file = viewModel.writeExportFile(transcript, format)
                                if (file != null) {
                                    viewModel.services.shareFile(file.first, format.mime, "Share transcript")
                                } else {
                                    snackbar.showSnackbar("Couldn't prepare that file")
                                }
                            }

                            ExportAction.COPY -> scope.launch {
                                val (content, _) = viewModel.buildExport(transcript, format)
                                val ok = viewModel.services.copyToClipboard(content, format.label)
                                snackbar.showSnackbar(if (ok) "${format.label} copied" else "Clipboard unavailable")
                            }
                        }
                    },
                    onSetDefault = { format ->
                        viewModel.updateSettings { it.copy(exportFormat = format) }
                        scope.launch { snackbar.showSnackbar("One-tap export is now .${format.extension}") }
                    },
                )
            }
        }

        if (showLanguages) {
            languageTarget?.let { transcript ->
                LanguageSheet(
                    transcript = transcript,
                    video = currentVideo(viewModel),
                    onDismiss = { showLanguages = false },
                    onPick = { language ->
                        showLanguages = false
                        viewModel.changeLanguage(language)
                    },
                )
            }
        }

        KeepScreenOn(enabled = reading && settings.keepScreenOn)
    }
}

/* -------------------------------------------------------------------- */
/* Navigation bar                                                        */
/* -------------------------------------------------------------------- */

@Composable
private fun BottomBar(current: Tab, onSelect: (Tab) -> Unit, libraryCount: Int) {
    val c = CaptionTheme.colors
    val navPadding = WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding()
    Column(
        Modifier
            .fillMaxWidth()
            .background(c.background.copy(alpha = 0.94f)),
    ) {
        GradientDivider(alpha = 0.35f)
        Row(
            Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp)
                .padding(bottom = navPadding),
            horizontalArrangement = Arrangement.SpaceEvenly,
        ) {
            BarItem("Grab", Icons.Rounded.Home, current == Tab.GRAB) { onSelect(Tab.GRAB) }
            BarItem("Library", Icons.Rounded.FolderOpen, current == Tab.LIBRARY, badge = libraryCount) {
                onSelect(Tab.LIBRARY)
            }
            BarItem("Settings", Icons.Rounded.Settings, current == Tab.SETTINGS) { onSelect(Tab.SETTINGS) }
        }
    }
}

@Composable
private fun BarItem(
    label: String,
    icon: ImageVector,
    selected: Boolean,
    badge: Int = 0,
    onClick: () -> Unit,
) {
    val c = CaptionTheme.colors
    Column(
        Modifier
            .clip(RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 18.dp, vertical = 7.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Box {
            Icon(
                icon,
                contentDescription = label,
                tint = if (selected) c.primary else c.textMuted,
                modifier = Modifier.size(22.dp),
            )
            if (badge > 0) {
                Box(
                    Modifier
                        .align(Alignment.TopEnd)
                        .size(14.dp)
                        .clip(CircleShape)
                        .background(c.primary),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        if (badge > 9) "9+" else badge.toString(),
                        style = MaterialTheme.typography.bodySmall.copy(fontSize = 8.sp, fontWeight = FontWeight.Bold),
                        color = c.primaryOn,
                    )
                }
            }
        }
        Spacer(Modifier.height(3.dp))
        Text(
            label,
            style = MaterialTheme.typography.bodySmall.copy(fontSize = 10.5.sp),
            color = if (selected) c.text else c.textMuted,
            fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
        )
    }
}

/* -------------------------------------------------------------------- */
/* Export sheet                                                          */
/* -------------------------------------------------------------------- */

@Composable
private fun ExportSheet(
    transcript: Transcript,
    defaultFormat: TranscriptFormat.ExportFormat,
    onDismiss: () -> Unit,
    onAction: (TranscriptFormat.ExportFormat, ExportAction) -> Unit,
    onSetDefault: (TranscriptFormat.ExportFormat) -> Unit,
) {
    val c = CaptionTheme.colors
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var selected by remember { mutableStateOf(defaultFormat) }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = c.backgroundElevated,
        scrimColor = Color.Black.copy(alpha = 0.55f),
        dragHandle = {
            Box(
                Modifier
                    .padding(top = 10.dp, bottom = 4.dp)
                    .width(38.dp)
                    .height(4.dp)
                    .clip(CircleShape)
                    .background(c.borderStrong),
            )
        },
    ) {
        Column(Modifier.padding(horizontal = 20.dp).padding(bottom = 26.dp)) {
            MonoLabel("Export", color = c.primary)
            Spacer(Modifier.height(6.dp))
            Text(
                transcript.title.ifBlank { "Transcript" },
                style = MaterialTheme.typography.headlineSmall,
                color = c.text,
                maxLines = 2,
            )
            Spacer(Modifier.height(6.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Tag("${transcript.words} words", color = c.textMuted)
                Tag(transcript.languageName, color = c.primary)
                Tag("${transcript.segments.size} lines", color = c.textMuted)
            }

            Spacer(Modifier.height(16.dp))

            LazyColumn(Modifier.height(330.dp)) {
                items(TranscriptFormat.ExportFormat.entries) { format ->
                    val isSelected = selected == format
                    Row(
                        Modifier
                            .fillMaxWidth()
                            .padding(vertical = 3.dp)
                            .clip(RoundedCornerShape(14.dp))
                            .background(if (isSelected) c.primary.copy(alpha = 0.12f) else Color.Transparent)
                            .border(
                                1.dp,
                                if (isSelected) c.primary.copy(alpha = 0.5f) else c.border,
                                RoundedCornerShape(14.dp),
                            )
                            .clickable { selected = format }
                            .padding(horizontal = 13.dp, vertical = 11.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Box(
                            Modifier
                                .size(34.dp)
                                .clip(RoundedCornerShape(9.dp))
                                .background(c.surfaceHigh),
                            contentAlignment = Alignment.Center,
                        ) {
                            Text(
                                ".${format.extension}",
                                style = MaterialTheme.typography.bodySmall.copy(fontSize = 9.5.sp, fontWeight = FontWeight.Bold),
                                color = if (isSelected) c.primary else c.textMuted,
                            )
                        }
                        Spacer(Modifier.width(11.dp))
                        Column(Modifier.weight(1f)) {
                            Text(format.label, style = MaterialTheme.typography.titleMedium, color = c.text)
                            Text(describeFormat(format), style = MaterialTheme.typography.bodySmall, color = c.textMuted)
                        }
                        if (isSelected) {
                            Box(
                                Modifier
                                    .size(20.dp)
                                    .clip(CircleShape)
                                    .background(c.primary),
                                contentAlignment = Alignment.Center,
                            ) {
                                Text("✓", color = c.primaryOn, style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp))
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(14.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(Modifier.weight(1f)) {
                    GhostButton(
                        "Copy",
                        { onAction(selected, ExportAction.COPY) },
                        icon = Icons.Rounded.ContentCopy,
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
                Box(Modifier.weight(1f)) {
                    GhostButton(
                        "Share",
                        { onAction(selected, ExportAction.SHARE) },
                        icon = Icons.Rounded.Share,
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            }
            Spacer(Modifier.height(8.dp))
            PrimaryButton(
                "Save to Downloads",
                { onAction(selected, ExportAction.SAVE) },
                icon = Icons.Rounded.Save,
                height = 50.dp,
            )
            Spacer(Modifier.height(8.dp))
            Row(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .clickable { onSetDefault(selected) }
                    .padding(vertical = 9.dp),
                horizontalArrangement = Arrangement.Center,
            ) {
                Icon(Icons.Rounded.Download, contentDescription = null, tint = c.textMuted, modifier = Modifier.size(13.dp))
                Spacer(Modifier.width(6.dp))
                Text(
                    "Use .${selected.extension} for the one-tap export button",
                    style = MaterialTheme.typography.bodySmall,
                    color = c.textMuted,
                )
            }
        }
    }
}

private fun describeFormat(format: TranscriptFormat.ExportFormat): String = when (format) {
    TranscriptFormat.ExportFormat.TXT -> "Clean prose for notes, docs and AI tools"
    TranscriptFormat.ExportFormat.TIMESTAMPED -> "One line per caption, timecode first"
    TranscriptFormat.ExportFormat.SRT -> "Universal subtitles for editors and players"
    TranscriptFormat.ExportFormat.VTT -> "Web subtitles, chapters and styling"
    TranscriptFormat.ExportFormat.JSON -> "Structured data for scripts and apps"
    TranscriptFormat.ExportFormat.CSV -> "Open in Sheets or Excel for analysis"
    TranscriptFormat.ExportFormat.MARKDOWN -> "Publish-ready article with headings"
}

/* -------------------------------------------------------------------- */
/* Language sheet                                                        */
/* -------------------------------------------------------------------- */

@Composable
private fun LanguageSheet(
    transcript: Transcript,
    video: VideoInfo?,
    onDismiss: () -> Unit,
    onPick: (String) -> Unit,
) {
    val c = CaptionTheme.colors
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val tracks = remember(video) {
        video?.tracks.orEmpty().sortedWith(compareBy({ it.isAutoGenerated }, { it.languageName }))
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = c.backgroundElevated,
        scrimColor = Color.Black.copy(alpha = 0.55f),
    ) {
        Column(Modifier.padding(horizontal = 20.dp).padding(bottom = 26.dp)) {
            MonoLabel("Caption track", color = c.primary)
            Spacer(Modifier.height(6.dp))
            Text("Read in another language", style = MaterialTheme.typography.headlineSmall, color = c.text)
            Spacer(Modifier.height(5.dp))
            Text(
                if (tracks.isEmpty())
                    "The track list isn't loaded. Go back and paste the link again to switch languages."
                else "Creator captions are the most accurate. Auto-generated tracks cover almost every upload.",
                style = MaterialTheme.typography.bodySmall,
                color = c.textMuted,
            )
            Spacer(Modifier.height(12.dp))
            LazyColumn(Modifier.height(380.dp)) {
                items(tracks) { track ->
                    TrackRow(
                        track = track,
                        selected = track.languageCode.equals(transcript.language, ignoreCase = true),
                        onClick = { onPick(track.languageCode) },
                    )
                }
            }
        }
    }
}

/* -------------------------------------------------------------------- */
/* Platform glue                                                         */
/* -------------------------------------------------------------------- */

@Composable
private fun KeepScreenOn(enabled: Boolean) {
    val view = LocalView.current
    DisposableEffect(enabled) {
        view.keepScreenOn = enabled
        onDispose { view.keepScreenOn = false }
    }
}

private fun currentVideo(vm: AppViewModel): VideoInfo? = when (val state = vm.extraction.value) {
    is Extraction.Ready -> state.video
    is Extraction.Working -> state.video
    is Extraction.Failed -> state.video
    else -> null
}
