package com.captiongrab.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ArrowBack
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.DarkMode
import androidx.compose.material.icons.rounded.Download
import androidx.compose.material.icons.rounded.History
import androidx.compose.material.icons.rounded.Language
import androidx.compose.material.icons.rounded.LightMode
import androidx.compose.material.icons.rounded.OpenInNew
import androidx.compose.material.icons.rounded.Palette
import androidx.compose.material.icons.rounded.PhoneAndroid
import androidx.compose.material.icons.rounded.RestartAlt
import androidx.compose.material.icons.rounded.ScreenLockPortrait
import androidx.compose.material.icons.rounded.TextFields
import androidx.compose.material.icons.rounded.Translate
import androidx.compose.material.icons.rounded.Vibration
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.captiongrab.app.BuildConfig
import com.captiongrab.app.data.AppLanguage
import com.captiongrab.app.data.TextSize
import com.captiongrab.app.data.ThemeMode
import com.captiongrab.app.data.TranscriptFormat
import com.captiongrab.app.data.TranscriptView
import com.captiongrab.app.ui.AppViewModel
import com.captiongrab.app.ui.components.CaptionCard
import com.captiongrab.app.ui.components.GhostButton
import com.captiongrab.app.ui.components.IconPill
import com.captiongrab.app.ui.components.MonoLabel
import com.captiongrab.app.ui.components.StatusDot
import com.captiongrab.app.ui.components.Tag
import com.captiongrab.app.ui.theme.CaptionTheme

/**
 * Screen 4 — Settings. Every switch here changes something the user can feel:
 * reading size, theme, haptics, translation behaviour, export format, storage.
 */
@Composable
fun SettingsScreen(vm: AppViewModel, onBack: () -> Unit) {
    val c = CaptionTheme.colors
    val settings by vm.settings.collectAsStateWithLifecycle()
    val status by vm.status.collectAsStateWithLifecycle()
    val entries by vm.entries.collectAsStateWithLifecycle()

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState()),
    ) {
        Row(
            Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .padding(top = 18.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconPill(Icons.Rounded.ArrowBack, "Back", onBack, background = c.surfaceHigh.copy(alpha = 0.7f))
            Spacer(Modifier.width(12.dp))
            Column {
                MonoLabel("Preferences", color = c.primary)
                Text("Settings", style = MaterialTheme.typography.displaySmall, color = c.text)
            }
        }

        Spacer(Modifier.height(20.dp))

        Group(title = "Reading", icon = Icons.Rounded.TextFields) {
            PreferenceRow(
                title = "Text size",
                subtitle = "Applies to transcripts and article text",
            ) {
                SegmentedRow(
                    options = TextSize.entries.map { it.name to it.label },
                    selected = settings.textSize.name,
                    onSelect = { name ->
                        vm.updateSettings { it.copy(textSize = TextSize.fromName(name)) }
                    },
                )
            }
            SectionDivider()
            PreferenceRow(
                title = "Default layout",
                subtitle = "How a freshly grabbed transcript opens",
            ) {
                SegmentedRow(
                    options = listOf(
                        TranscriptView.SEGMENTS.name to "Timed lines",
                        TranscriptView.PARAGRAPHS.name to "Reading",
                    ),
                    selected = settings.transcriptView.name,
                    onSelect = { name ->
                        vm.updateSettings { it.copy(transcriptView = TranscriptView.fromName(name)) }
                    },
                )
            }
            SectionDivider()
            SwitchRow(
                title = "Keep the screen awake",
                subtitle = "While a transcript is open",
                icon = Icons.Rounded.ScreenLockPortrait,
                checked = settings.keepScreenOn,
                onChange = { value -> vm.updateSettings { it.copy(keepScreenOn = value) } },
            )
            SectionDivider()
            SwitchRow(
                title = "Follow-along highlight",
                subtitle = "Marks the line you last jumped to",
                icon = Icons.Rounded.AutoAwesome,
                checked = settings.wordHighlight,
                onChange = { value -> vm.updateSettings { it.copy(wordHighlight = value) } },
            )
            SectionDivider()
            SwitchRow(
                title = "Haptic feedback",
                subtitle = "A tick when you tap a timecode",
                icon = Icons.Rounded.Vibration,
                checked = settings.hapticsEnabled,
                onChange = { value -> vm.updateSettings { it.copy(hapticsEnabled = value) } },
            )
        }

        Spacer(Modifier.height(14.dp))

        Group(title = "Captions", icon = Icons.Rounded.Translate) {
            PreferenceRow(title = "Preferred language", subtitle = "Used when a video has several tracks") {
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(7.dp),
                    verticalArrangement = Arrangement.spacedBy(7.dp),
                    maxItemsInEachRow = 3,
                ) {
                    AppLanguage.entries.forEach { language ->
                        ChoiceChip(
                            label = language.label,
                            selected = settings.defaultLanguage.equals(language.tag, ignoreCase = true),
                            onClick = { vm.updateSettings { it.copy(defaultLanguage = language.tag) } },
                        )
                    }
                }
            }
            SectionDivider()
            SwitchRow(
                title = "Smart auto-translate",
                subtitle = "If your track is missing, translate the closest one instead of failing",
                icon = Icons.Rounded.AutoAwesome,
                checked = settings.autoTranslate,
                onChange = { value -> vm.updateSettings { it.copy(autoTranslate = value) } },
            )
        }

        Spacer(Modifier.height(14.dp))

        Group(title = "Export & sharing", icon = Icons.Rounded.Download) {
            PreferenceRow(title = "One-tap format", subtitle = "Used by the quick export button") {
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(7.dp),
                    verticalArrangement = Arrangement.spacedBy(7.dp),
                ) {
                    TranscriptFormat.ExportFormat.entries.forEach { format ->
                        ChoiceChip(
                            label = ".${format.extension} · ${format.label.substringBefore(" ")}",
                            selected = settings.exportFormat == format,
                            onClick = { vm.updateSettings { it.copy(exportFormat = format) } },
                        )
                    }
                }
            }
            SectionDivider()
            SwitchRow(
                title = "Attach attribution",
                subtitle = "Adds the video title, channel and link to shared text",
                icon = Icons.Rounded.OpenInNew,
                checked = settings.includeAttribution,
                onChange = { value -> vm.updateSettings { it.copy(includeAttribution = value) } },
            )
            SectionDivider()
            SwitchRow(
                title = "Open timecodes in the YouTube app",
                subtitle = "Off uses your browser instead",
                icon = Icons.Rounded.PhoneAndroid,
                checked = settings.preferYouTubeApp,
                onChange = { value -> vm.updateSettings { it.copy(preferYouTubeApp = value) } },
            )
        }

        Spacer(Modifier.height(14.dp))

        Group(title = "Appearance", icon = Icons.Rounded.Palette) {
            PreferenceRow(title = "Theme", subtitle = "The screening room stays dark by default") {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    ThemeChoice("System", Icons.Rounded.PhoneAndroid, settings.themeMode == ThemeMode.SYSTEM) {
                        vm.updateSettings { it.copy(themeMode = ThemeMode.SYSTEM) }
                    }
                    ThemeChoice("Dark", Icons.Rounded.DarkMode, settings.themeMode == ThemeMode.DARK) {
                        vm.updateSettings { it.copy(themeMode = ThemeMode.DARK) }
                    }
                    ThemeChoice("Light", Icons.Rounded.LightMode, settings.themeMode == ThemeMode.LIGHT) {
                        vm.updateSettings { it.copy(themeMode = ThemeMode.LIGHT) }
                    }
                }
            }
        }

        Spacer(Modifier.height(14.dp))

        Group(title = "Library", icon = Icons.Rounded.History) {
            SwitchRow(
                title = "Save captures on this device",
                subtitle = "${entries.size} saved · ${entries.sumOf { it.wordCount }} words · opens offline",
                icon = Icons.Rounded.History,
                checked = settings.historyEnabled,
                onChange = { value -> vm.updateSettings { it.copy(historyEnabled = value) } },
            )
            SectionDivider()
            PreferenceRow(
                title = "Keep at most",
                subtitle = "Older captures are dropped first; starred ones are kept",
            ) {
                SegmentedRow(
                    options = listOf("25" to "25", "60" to "60", "150" to "150"),
                    selected = settings.historyLimit.toString(),
                    onSelect = { limit -> vm.updateSettings { it.copy(historyLimit = limit.toIntOrNull() ?: 60) } },
                )
            }
            if (entries.isNotEmpty()) {
                SectionDivider()
                Row(
                    Modifier
                        .fillMaxWidth()
                        .clickable { vm.clearLibrary(keepStarred = true) }
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(Icons.Rounded.History, contentDescription = null, tint = c.danger, modifier = Modifier.size(17.dp))
                    Spacer(Modifier.width(10.dp))
                    Text("Clear unstarred captures", style = MaterialTheme.typography.bodyMedium, color = c.danger)
                }
            }
        }

        Spacer(Modifier.height(14.dp))

        Group(title = "About & status", icon = Icons.Rounded.Language) {
            Row(
                Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(Modifier.weight(1f)) {
                    Text("Transcript service", style = MaterialTheme.typography.titleMedium, color = c.text)
                    Spacer(Modifier.height(3.dp))
                    StatusDot(
                        reachable = status.reachable,
                        checking = status.checking,
                        label = when {
                            status.checking -> "Checking…"
                            status.reachable && status.degraded -> "Reachable (degraded)"
                            status.reachable -> "Reachable"
                            else -> "Unreachable — saved captures still work"
                        },
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(BuildConfig.API_BASE_URL, style = MaterialTheme.typography.bodySmall, color = c.textFaint, maxLines = 1)
                }
                GhostButton("Recheck", { vm.recheckApi() }, height = 40.dp)
            }
            SectionDivider()
            Row(
                Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(Modifier.weight(1f)) {
                    Text("CaptionGrab ${BuildConfig.VERSION_NAME}", style = MaterialTheme.typography.titleMedium, color = c.text)
                    Text(
                        "Native Android · Kotlin + Compose · no WebView, no ads, no tracking",
                        style = MaterialTheme.typography.bodySmall,
                        color = c.textMuted,
                    )
                    Spacer(Modifier.height(6.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Tag("MIT licensed", color = c.textMuted)
                        Tag("No API keys", color = c.green)
                    }
                }
            }
            SectionDivider()
            Row(
                Modifier
                    .fillMaxWidth()
                    .clickable { vm.services.shareApp() }
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Rounded.OpenInNew, contentDescription = null, tint = c.primary, modifier = Modifier.size(17.dp))
                Spacer(Modifier.width(10.dp))
                Text("Share CaptionGrab with a friend", style = MaterialTheme.typography.bodyMedium, color = c.text)
            }
            SectionDivider()
            Row(
                Modifier
                    .fillMaxWidth()
                    .clickable { vm.resetSettings() }
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Rounded.RestartAlt, contentDescription = null, tint = c.textMuted, modifier = Modifier.size(17.dp))
                Spacer(Modifier.width(10.dp))
                Text("Reset all settings", style = MaterialTheme.typography.bodyMedium, color = c.textMuted)
            }
        }

        Spacer(Modifier.height(18.dp))
        Text(
            "Transcripts belong to the video's creator. Credit the original when you quote.",
            style = MaterialTheme.typography.bodySmall,
            color = c.textFaint,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 32.dp),
        )
        Spacer(Modifier.height(120.dp))
    }
}

/* -------------------------------------------------------------------- */

@Composable
private fun Group(title: String, icon: ImageVector, content: @Composable () -> Unit) {
    val c = CaptionTheme.colors
    Column(Modifier.padding(horizontal = 20.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, contentDescription = null, tint = c.primary, modifier = Modifier.size(14.dp))
            Spacer(Modifier.width(7.dp))
            MonoLabel(title, color = c.textMuted)
        }
        Spacer(Modifier.height(8.dp))
        CaptionCard(Modifier.fillMaxWidth()) { Column { content() } }
    }
}

@Composable
private fun PreferenceRow(
    title: String,
    subtitle: String,
    content: @Composable () -> Unit,
) {
    val c = CaptionTheme.colors
    Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 14.dp)) {
        Text(title, style = MaterialTheme.typography.titleMedium, color = c.text)
        Text(subtitle, style = MaterialTheme.typography.bodySmall, color = c.textMuted)
        Spacer(Modifier.height(11.dp))
        content()
    }
}

@Composable
private fun SwitchRow(
    title: String,
    subtitle: String,
    icon: ImageVector,
    checked: Boolean,
    onChange: (Boolean) -> Unit,
) {
    val c = CaptionTheme.colors
    Row(
        Modifier
            .fillMaxWidth()
            .clickable { onChange(!checked) }
            .padding(horizontal = 16.dp, vertical = 13.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icon, contentDescription = null, tint = if (checked) c.primary else c.textMuted, modifier = Modifier.size(17.dp))
        Spacer(Modifier.width(11.dp))
        Column(Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.titleMedium, color = c.text)
            Text(subtitle, style = MaterialTheme.typography.bodySmall, color = c.textMuted)
        }
        Spacer(Modifier.width(10.dp))
        Switch(
            checked = checked,
            onCheckedChange = onChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = c.primaryOn,
                checkedTrackColor = c.primary,
                uncheckedThumbColor = c.textMuted,
                uncheckedTrackColor = c.surfaceHigh,
                uncheckedBorderColor = c.border,
            ),
        )
    }
}

@Composable
private fun SectionDivider() {
    val c = CaptionTheme.colors
    Box(
        Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .height(1.dp)
            .background(c.border.copy(alpha = 0.6f)),
    )
}

@Composable
private fun ChoiceChip(label: String, selected: Boolean, onClick: () -> Unit) {
    val c = CaptionTheme.colors
    Row(
        Modifier
            .clip(RoundedCornerShape(11.dp))
            .background(if (selected) c.primary.copy(alpha = 0.18f) else c.surfaceHigh.copy(alpha = 0.6f))
            .border(1.dp, if (selected) c.primary.copy(alpha = 0.6f) else c.border, RoundedCornerShape(11.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 11.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            label,
            style = MaterialTheme.typography.bodySmall.copy(fontSize = 12.sp, fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal),
            color = if (selected) c.text else c.textMuted,
        )
    }
}

@Composable
private fun SegmentedRow(
    options: List<Pair<String, String>>,
    selected: String,
    onSelect: (String) -> Unit,
) {
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(CaptionTheme.colors.surfaceHigh.copy(alpha = 0.55f))
            .padding(3.dp),
        horizontalArrangement = Arrangement.spacedBy(3.dp),
    ) {
        options.forEach { (value, label) ->
            ChoiceChip(
                label = label,
                selected = selected == value,
                onClick = { onSelect(value) },
            )
        }
    }
}

@Composable
private fun ThemeChoice(label: String, icon: ImageVector, selected: Boolean, onClick: () -> Unit) {
    val c = CaptionTheme.colors
    Column(
        Modifier
            .clip(RoundedCornerShape(13.dp))
            .background(if (selected) c.primary.copy(alpha = 0.14f) else Color.Transparent)
            .border(1.dp, if (selected) c.primary.copy(alpha = 0.5f) else c.border, RoundedCornerShape(13.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 11.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Icon(icon, contentDescription = null, tint = if (selected) c.primary else c.textMuted, modifier = Modifier.size(18.dp))
        Spacer(Modifier.height(5.dp))
        Text(label, style = MaterialTheme.typography.bodySmall, color = if (selected) c.text else c.textMuted)
    }
}
