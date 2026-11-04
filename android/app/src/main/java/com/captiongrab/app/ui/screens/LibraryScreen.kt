package com.captiongrab.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Bookmark
import androidx.compose.material.icons.rounded.BookmarkBorder
import androidx.compose.material.icons.rounded.CloudOff
import androidx.compose.material.icons.rounded.ContentPaste
import androidx.compose.material.icons.rounded.Delete
import androidx.compose.material.icons.rounded.DeleteSweep
import androidx.compose.material.icons.rounded.FolderOpen
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.captiongrab.app.data.HistoryEntry
import com.captiongrab.app.data.TranscriptFormat
import com.captiongrab.app.data.YouTubeUrl
import com.captiongrab.app.ui.AppViewModel
import com.captiongrab.app.ui.components.EmptyState
import com.captiongrab.app.ui.components.IconPill
import com.captiongrab.app.ui.components.MonoLabel
import com.captiongrab.app.ui.components.Tag
import com.captiongrab.app.ui.theme.CaptionTheme
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Screen 3 — the on-device library.
 *
 * This is where the app earns repeat use: every capture is searchable offline,
 * star-able, and reopens in one tap with no network at all.
 */
@Composable
fun LibraryScreen(
    vm: AppViewModel,
    onOpenEntry: (HistoryEntry) -> Unit,
    onBrowse: () -> Unit,
) {
    val c = CaptionTheme.colors
    val entries by vm.entries.collectAsStateWithLifecycle()
    val settings by vm.settings.collectAsStateWithLifecycle()
    var query by rememberSaveable { mutableStateOf("") }
    var confirmClear by remember { mutableStateOf(false) }

    val filtered = remember(query, entries) { vm.library.search(query) }

    Column(Modifier.fillMaxSize()) {
        Row(
            Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .padding(top = 18.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(Modifier.weight(1f)) {
                MonoLabel("On this device", color = c.primary)
                Spacer(Modifier.height(5.dp))
                Text("Your library", style = MaterialTheme.typography.displaySmall, color = c.text)
            }
            if (entries.isNotEmpty()) {
                IconPill(
                    Icons.Rounded.DeleteSweep,
                    "Clear library",
                    { confirmClear = true },
                    background = c.surfaceHigh.copy(alpha = 0.7f),
                    tint = c.textMuted,
                )
            }
        }

        Spacer(Modifier.height(14.dp))

        if (entries.isNotEmpty()) {
            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                placeholder = { Text("Search titles and transcript text", color = c.textFaint) },
                singleLine = true,
                shape = RoundedCornerShape(15.dp),
                textStyle = MaterialTheme.typography.bodyMedium,
                leadingIcon = {
                    Icon(Icons.Rounded.Search, contentDescription = null, tint = c.textMuted, modifier = Modifier.size(18.dp))
                },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = c.primary.copy(alpha = 0.6f),
                    unfocusedBorderColor = c.border,
                    focusedContainerColor = c.surface.copy(alpha = 0.7f),
                    unfocusedContainerColor = c.surface.copy(alpha = 0.5f),
                    cursorColor = c.primary,
                    focusedTextColor = c.text,
                    unfocusedTextColor = c.text,
                ),
            )
            Spacer(Modifier.height(10.dp))
            Row(Modifier.padding(horizontal = 20.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(
                    "${filtered.size} of ${entries.size} captures · ${entries.sumOf { it.wordCount }} words saved",
                    style = MaterialTheme.typography.bodySmall,
                    color = c.textMuted,
                )
            }
        }

        Spacer(Modifier.height(8.dp))

        if (entries.isEmpty()) {
            if (settings.historyEnabled) {
                EmptyState(
                    icon = Icons.Rounded.FolderOpen,
                    title = "Nothing saved yet",
                    body = "Grab a transcript and it lands here automatically — readable offline, " +
                        "searchable, and exportable whenever you need it.",
                    action = {
                        Row(
                            Modifier
                                .clip(RoundedCornerShape(50))
                                .background(c.primary.copy(alpha = 0.14f))
                                .clickable(onClick = onBrowse)
                                .padding(horizontal = 18.dp, vertical = 11.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Icon(Icons.Rounded.ContentPaste, contentDescription = null, tint = c.primary, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(7.dp))
                            Text("Grab your first transcript", color = c.primary, style = MaterialTheme.typography.labelLarge)
                        }
                    },
                )
            } else {
                EmptyState(
                    icon = Icons.Rounded.CloudOff,
                    title = "Saving is turned off",
                    body = "New grabs work exactly as before, they just aren't kept on this device. " +
                        "Turn saving back on in Settings → Library to build your offline collection.",
                    action = {
                        Row(
                            Modifier
                                .clip(RoundedCornerShape(50))
                                .background(c.primary.copy(alpha = 0.14f))
                                .clickable { vm.updateSettings { it.copy(historyEnabled = true) } }
                                .padding(horizontal = 18.dp, vertical = 11.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Icon(Icons.Rounded.FolderOpen, contentDescription = null, tint = c.primary, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(7.dp))
                            Text("Turn saving on", color = c.primary, style = MaterialTheme.typography.labelLarge)
                        }
                    },
                )
            }
        } else {
            LazyColumn(
                Modifier.fillMaxSize(),
                contentPadding = PaddingValues(
                    start = 20.dp, end = 20.dp, top = 4.dp, bottom = 120.dp,
                ),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                items(filtered, key = { it.id }) { entry ->
                    LibraryRow(
                        entry = entry,
                        query = query,
                        onOpen = { onOpenEntry(entry) },
                        onPin = { vm.togglePinned(entry) },
                        onDelete = { vm.deleteEntry(entry) },
                    )
                }
            }
        }
    }

    if (confirmClear) {
        ConfirmClearDialog(
            hasStarred = entries.any { it.pinned },
            onDismiss = { confirmClear = false },
            onConfirm = { keepStarred ->
                vm.clearLibrary(keepStarred)
                confirmClear = false
            },
        )
    }
}

@Composable
private fun LibraryRow(
    entry: HistoryEntry,
    query: String,
    onOpen: () -> Unit,
    onPin: () -> Unit,
    onDelete: () -> Unit,
) {
    val c = CaptionTheme.colors
    val snippet = remember(entry.id, query) {
        if (query.isBlank()) entry.segments.firstOrNull()?.text?.take(120)
        else entry.segments.firstOrNull { it.text.contains(query, ignoreCase = true) }?.text
            ?.let { text ->
                val index = text.indexOf(query, ignoreCase = true).coerceAtLeast(0)
                text.substring((index - 40).coerceAtLeast(0)).take(140)
            }
    }

    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(c.surface.copy(alpha = 0.72f))
            .border(1.dp, if (entry.pinned) c.amber.copy(alpha = 0.4f) else c.border, RoundedCornerShape(18.dp))
            .clickable(onClick = onOpen)
            .padding(12.dp),
    ) {
        Row {
            Box(
                Modifier
                    .size(width = 96.dp, height = 56.dp)
                    .clip(RoundedCornerShape(11.dp))
                    .background(c.surfaceHigh),
            ) {
                AsyncImage(
                    model = entry.thumbnail.ifBlank { YouTubeUrl.thumbnailUrl(entry.videoId) },
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize(),
                )
                Box(
                    Modifier
                        .align(Alignment.BottomEnd)
                        .background(c.background.copy(alpha = 0.78f), RoundedCornerShape(topStart = 7.dp))
                        .padding(horizontal = 5.dp, vertical = 2.dp),
                ) {
                    Text(
                        entry.language.uppercase(),
                        style = MaterialTheme.typography.bodySmall.copy(fontSize = 9.sp, fontWeight = FontWeight.Bold),
                        color = c.primary,
                    )
                }
            }
            Spacer(Modifier.width(11.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    entry.title.ifBlank { entry.videoId },
                    style = MaterialTheme.typography.titleMedium,
                    color = c.text,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                Spacer(Modifier.height(2.dp))
                Text(
                    "${entry.author.ifBlank { "YouTube" }} · ${relativeTime(entry.createdAt)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = c.textMuted,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Spacer(Modifier.height(6.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                    Tag("${entry.wordCount} words", color = c.textMuted)
                    Tag("${entry.segmentCount} lines", color = c.textMuted)
                    if (entry.translated) Tag("translated", color = c.cyan)
                }
            }
        }

        if (!snippet.isNullOrBlank()) {
            Spacer(Modifier.height(9.dp))
            SelectionContainer {
                Text(
                    snippet,
                    style = MaterialTheme.typography.bodySmall,
                    color = c.textFaint,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }

        Spacer(Modifier.height(6.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Row(
                Modifier
                    .clip(RoundedCornerShape(50))
                    .clickable(onClick = onPin)
                    .padding(horizontal = 8.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(
                    if (entry.pinned) Icons.Rounded.Bookmark else Icons.Rounded.BookmarkBorder,
                    contentDescription = if (entry.pinned) "Unstar" else "Star",
                    tint = if (entry.pinned) c.amber else c.textMuted,
                    modifier = Modifier.size(15.dp),
                )
                Spacer(Modifier.width(4.dp))
                Text(
                    if (entry.pinned) "Starred" else "Star",
                    style = MaterialTheme.typography.bodySmall,
                    color = if (entry.pinned) c.amber else c.textMuted,
                )
            }
            Spacer(Modifier.weight(1f))
            Row(
                Modifier
                    .clip(RoundedCornerShape(50))
                    .clickable(onClick = onDelete)
                    .padding(horizontal = 8.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Rounded.Delete, contentDescription = "Delete", tint = c.textFaint, modifier = Modifier.size(15.dp))
            }
        }
    }
}

@Composable
private fun ConfirmClearDialog(
    hasStarred: Boolean,
    onDismiss: () -> Unit,
    onConfirm: (keepStarred: Boolean) -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = CaptionTheme.colors.surfaceHigh,
        title = { Text("Clear your library?", color = CaptionTheme.colors.text) },
        text = {
            Text(
                if (hasStarred) "Starred captures stay. Everything else is removed from this device."
                else "Every saved capture is removed from this device. This can't be undone.",
                color = CaptionTheme.colors.textMuted,
            )
        },
        confirmButton = {
            androidx.compose.material3.TextButton(onClick = { onConfirm(hasStarred) }) {
                Text("Clear", color = CaptionTheme.colors.danger)
            }
        },
        dismissButton = {
            androidx.compose.material3.TextButton(onClick = onDismiss) {
                Text("Keep", color = CaptionTheme.colors.textMuted)
            }
        },
    )
}

/** "3 min ago", "Yesterday", "12 Mar" — compact, locale-aware, no dependency. */
fun relativeTime(timestamp: Long, now: Long = System.currentTimeMillis()): String {
    val diff = (now - timestamp).coerceAtLeast(0)
    val minutes = diff / 60_000
    val hours = minutes / 60
    val days = hours / 24
    return when {
        minutes < 1 -> "Just now"
        minutes < 60 -> "$minutes min ago"
        hours < 24 -> if (hours == 1L) "1 hour ago" else "$hours hours ago"
        days == 1L -> "Yesterday"
        days < 7 -> "$days days ago"
        else -> SimpleDateFormat("d MMM", Locale.getDefault()).format(Date(timestamp))
    }
}

