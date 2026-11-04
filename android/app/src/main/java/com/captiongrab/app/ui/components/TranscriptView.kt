package com.captiongrab.app.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.BoltOutlined
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.Headphones
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.captiongrab.app.data.Transcript
import com.captiongrab.app.data.TranscriptFormat
import com.captiongrab.app.data.TranscriptSegment
import com.captiongrab.app.data.TranscriptView
import com.captiongrab.app.ui.theme.CaptionTheme

/**
 * The reader.
 *
 * Design goals, in order:
 *  1. Readable: 16–17sp body, 1.6 line height, generous tap targets.
 *  2. Navigable: search with next/prev + match counter, tap a timecode to play.
 *  3. Quiet: controls collapse into one toolbar row so the words own the screen.
 */
@Composable
fun TranscriptReader(
    transcript: Transcript,
    view: TranscriptView,
    query: String,
    onQueryChange: (String) -> Unit,
    onSeek: (Double) -> Unit,
    modifier: Modifier = Modifier,
    listState: LazyListState = rememberLazyListState(),
    contentPadding: PaddingValues = PaddingValues(bottom = 120.dp),
    /** Timecode the user last jumped to; drives the follow-along highlight. */
    focusSecond: Double? = null,
    followAlong: Boolean = true,
) {
    val c = CaptionTheme.colors
    val focusManager = LocalFocusManager.current

    // --- match index ------------------------------------------------------
    val matches = remember(query, transcript.segments) {
        val q = query.trim().lowercase()
        if (q.isEmpty()) emptyList()
        else transcript.segments.mapIndexedNotNull { index, seg ->
            if (seg.text.lowercase().contains(q)) index else null
        }
    }
    var activeMatch by remember(query) { mutableIntStateOf(0) }

    val paragraphs = remember(transcript.segments) { TranscriptFormat.paragraphsWithStart(transcript.segments) }

    LaunchedEffect(matches) {
        activeMatch = 0
        if (matches.isNotEmpty()) listState.animateScrollToItem(matches.first())
    }

    Column(modifier) {
        SearchField(
            query = query,
            onQueryChange = onQueryChange,
            matchCount = matches.size,
            activeIndex = activeMatch,
            onNext = {
                if (matches.isEmpty()) return@SearchField
                activeMatch = (activeMatch + 1) % matches.size
                focusManager.clearFocus()
            },
            onPrevious = {
                if (matches.isEmpty()) return@SearchField
                activeMatch = (activeMatch - 1 + matches.size) % matches.size
                focusManager.clearFocus()
            },
            onClear = { onQueryChange("") },
        )

        LaunchedEffect(activeMatch) {
            matches.getOrNull(activeMatch)?.let { listState.animateScrollToItem(it) }
        }

        Spacer(Modifier.height(10.dp))

        when (view) {
            TranscriptView.SEGMENTS -> SegmentList(
                segments = transcript.segments,
                matches = matches.toSet(),
                activeMatchIndex = matches.getOrNull(activeMatch),
                query = query,
                listState = listState,
                contentPadding = contentPadding,
                focusSecond = if (followAlong) focusSecond else null,
                onSeek = onSeek,
            )

            TranscriptView.PARAGRAPHS -> ParagraphList(
                paragraphs = paragraphs,
                query = query,
                listState = listState,
                contentPadding = contentPadding,
                onSeek = onSeek,
            )
        }
    }
}

@Composable
private fun SearchField(
    query: String,
    onQueryChange: (String) -> Unit,
    matchCount: Int,
    activeIndex: Int,
    onNext: () -> Unit,
    onPrevious: () -> Unit,
    onClear: () -> Unit,
) {
    val c = CaptionTheme.colors
    OutlinedTextField(
        value = query,
        onValueChange = onQueryChange,
        modifier = Modifier.fillMaxWidth(),
        placeholder = { Text("Search inside the transcript", color = c.textFaint) },
        singleLine = true,
        shape = RoundedCornerShape(16.dp),
        textStyle = MaterialTheme.typography.bodyMedium,
        leadingIcon = {
            Icon(Icons.Rounded.Search, contentDescription = null, tint = c.textMuted, modifier = Modifier.size(19.dp))
        },
        trailingIcon = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (query.isNotBlank()) {
                    Tag(
                        text = if (matchCount == 0) "No hits" else "${activeIndex + 1}/$matchCount",
                        color = if (matchCount == 0) c.danger else c.primary,
                        filled = true,
                    )
                    if (matchCount > 0) {
                        IconButton(onClick = onPrevious, modifier = Modifier.size(38.dp)) {
                            Icon(
                                Icons.Rounded.PlayArrow,
                                contentDescription = "Previous match",
                                tint = c.textMuted,
                                modifier = Modifier.size(19.dp).rotate(-90f),
                            )
                        }
                        IconButton(onClick = onNext, modifier = Modifier.size(38.dp)) {
                            Icon(
                                Icons.Rounded.PlayArrow,
                                contentDescription = "Next match",
                                tint = c.textMuted,
                                modifier = Modifier.size(19.dp).rotate(90f),
                            )
                        }
                    }
                    IconButton(onClick = onClear, modifier = Modifier.size(38.dp)) {
                        Icon(Icons.Rounded.Close, contentDescription = "Clear search", tint = c.textMuted, modifier = Modifier.size(17.dp))
                    }
                }
            }
        },
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = c.primary.copy(alpha = 0.7f),
            unfocusedBorderColor = c.border,
            focusedContainerColor = c.surface.copy(alpha = 0.8f),
            unfocusedContainerColor = c.surface.copy(alpha = 0.6f),
            cursorColor = c.primary,
            focusedTextColor = c.text,
            unfocusedTextColor = c.text,
        ),
    )
}

@Composable
private fun SegmentList(
    segments: List<TranscriptSegment>,
    matches: Set<Int>,
    activeMatchIndex: Int?,
    query: String,
    listState: LazyListState,
    contentPadding: PaddingValues,
    focusSecond: Double?,
    onSeek: (Double) -> Unit,
) {
    val c = CaptionTheme.colors
    LazyColumn(
        state = listState,
        modifier = Modifier.fillMaxWidth(),
        contentPadding = contentPadding,
        verticalArrangement = Arrangement.spacedBy(2.dp),
    ) {
        itemsIndexed(segments, key = { index, seg -> "${seg.start}-$index" }) { index, segment ->
            val dimmed = query.isNotBlank() && index !in matches
            SegmentRow(
                segment = segment,
                query = query,
                dimmed = dimmed,
                isActiveMatch = index == activeMatchIndex,
                isFollowing = focusSecond != null && focusSecond >= segment.start && focusSecond < segment.end,
                onSeek = onSeek,
            )
        }
        item { ReaderFootnote() }
    }
}

@Composable
private fun SegmentRow(
    segment: TranscriptSegment,
    query: String,
    dimmed: Boolean,
    isActiveMatch: Boolean,
    isFollowing: Boolean,
    onSeek: (Double) -> Unit,
) {
    val c = CaptionTheme.colors
    val alpha by animateFloatAsState(if (dimmed) 0.28f else 1f, label = "dim")
    val background by animateColorAsState(
        when {
            isActiveMatch -> c.primary.copy(alpha = 0.14f)
            isFollowing -> c.primary.copy(alpha = 0.08f)
            else -> Color.Transparent
        },
        label = "rowBg",
    )
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(background)
            .padding(vertical = 7.dp, horizontal = 4.dp),
        verticalAlignment = Alignment.Top,
    ) {
        TimeChip(segment.start, enabled = alpha > 0.5f) { onSeek(segment.start) }
        Spacer(Modifier.width(11.dp))
        SelectionContainer {
            Text(
                text = highlight(segment.text, query),
                modifier = Modifier
                    .fillMaxWidth()
                    .alpha(alpha),
                style = MaterialTheme.typography.bodyLarge.copy(
                    fontSize = 16.5.sp,
                    lineHeight = 26.sp,
                    fontWeight = FontWeight.Normal,
                ),
                color = c.text.copy(alpha = 0.92f),
            )
        }
    }
}

@Composable
fun TimeChip(start: Double, enabled: Boolean = true, onSeek: (Double) -> Unit) {
    val c = CaptionTheme.colors
    Row(
        Modifier
            .clip(RoundedCornerShape(9.dp))
            .background(c.primary.copy(alpha = if (enabled) 0.14f else 0.06f))
            .clickable(enabled = enabled) { onSeek(start) }
            .padding(horizontal = 7.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            Icons.Rounded.PlayArrow,
            contentDescription = "Play from ${TranscriptFormat.clock(start)}",
            tint = c.primary,
            modifier = Modifier.size(12.dp),
        )
        Spacer(Modifier.width(3.dp))
        Text(
            text = TranscriptFormat.clock(start),
            color = c.primary,
            style = MaterialTheme.typography.bodySmall.copy(
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.SemiBold,
                fontSize = 11.5.sp,
            ),
        )
    }
}

@Composable
private fun ParagraphList(
    paragraphs: List<Pair<Double, String>>,
    query: String,
    listState: LazyListState,
    contentPadding: PaddingValues,
    onSeek: (Double) -> Unit,
) {
    val c = CaptionTheme.colors
    LazyColumn(
        state = listState,
        modifier = Modifier.fillMaxWidth(),
        contentPadding = contentPadding,
        verticalArrangement = Arrangement.spacedBy(20.dp),
    ) {
        items(paragraphs.size.coerceAtLeast(1)) { index ->
            if (paragraphs.isEmpty()) {
                Text("This transcript came back empty. Try another language track.", color = c.textMuted)
            } else {
                val (start, text) = paragraphs[index]
                Column {
                    TimeChip(start) { onSeek(start) }
                    Spacer(Modifier.height(7.dp))
                    SelectionContainer {
                        Text(
                            text = highlight(text, query),
                            style = MaterialTheme.typography.bodyLarge.copy(fontSize = 17.sp, lineHeight = 30.sp),
                            color = c.text.copy(alpha = 0.92f),
                        )
                    }
                }
            }
        }
        item { ReaderFootnote() }
    }
}

@Composable
private fun ReaderFootnote() {
    val c = CaptionTheme.colors
    Column(Modifier.fillMaxWidth().padding(top = 28.dp, bottom = 8.dp)) {
        GradientDivider()
        Spacer(Modifier.height(14.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Rounded.BoltOutlined, contentDescription = null, tint = c.textFaint, modifier = Modifier.size(14.dp))
            Spacer(Modifier.width(6.dp))
            Text(
                "Tap any timecode to jump straight to that moment in YouTube.",
                style = MaterialTheme.typography.bodySmall,
                color = c.textFaint,
            )
        }
    }
}

/* -------------------------------------------------------------------- */
/* Search highlighting                                                   */
/* -------------------------------------------------------------------- */

fun highlight(text: String, query: String): AnnotatedString {
    val q = query.trim()
    if (q.isEmpty()) return AnnotatedString(text)
    return buildAnnotatedString {
        var index = 0
        val lower = text.lowercase()
        val target = q.lowercase()
        while (index <= text.length) {
            val hit = lower.indexOf(target, index)
            if (hit < 0) {
                append(text.substring(index))
                break
            }
            if (hit > index) append(text.substring(index, hit))
            withStyle(
                SpanStyle(
                    background = Color(0x33FFD54F),
                    color = Color(0xFFFFE082),
                    fontWeight = FontWeight.SemiBold,
                ),
            ) {
                append(text.substring(hit, hit + target.length))
            }
            index = hit + target.length
        }
    }
}

/* -------------------------------------------------------------------- */
/* Mini player bar (the "read & watch" bridge)                            */
/* -------------------------------------------------------------------- */

/**
 * A compact, always-visible "jump back into the video" rail. Repeated
 * app-switching to YouTube mid-read is the single most common mobile friction,
 * so the current line stays one tap away.
 */
@Composable
fun PlayerRail(
    transcript: Transcript,
    lastSeek: Double?,
    onOpenAt: (Double) -> Unit,
    onOpenStart: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val c = CaptionTheme.colors
    Row(
        modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(Brush.linearGradient(listOf(c.primary.copy(alpha = 0.14f), c.magenta.copy(alpha = 0.10f))))
            .border(1.dp, c.border, RoundedCornerShape(18.dp))
            .clickable { onOpenAt(lastSeek ?: 0.0) }
            .padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            Modifier
                .size(38.dp)
                .clip(RoundedCornerShape(50))
                .background(c.primary.copy(alpha = 0.20f)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(Icons.Rounded.PlayArrow, contentDescription = null, tint = c.primary, modifier = Modifier.size(22.dp))
        }
        Spacer(Modifier.width(11.dp))
        Column(Modifier.weight(1f)) {
            Text(
                if (lastSeek != null) "Continue at ${TranscriptFormat.clock(lastSeek)}" else "Watch the video",
                style = MaterialTheme.typography.titleMedium,
                color = c.text,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                if (lastSeek != null) "Opens YouTube at that timecode" else "Opens in the YouTube app",
                style = MaterialTheme.typography.bodySmall,
                color = c.textMuted,
                maxLines = 1,
            )
        }
        Row {
            SmallAction(Icons.Rounded.Headphones, "Listen") { onOpenStart() }
        }
    }
}

@Composable
private fun SmallAction(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, onClick: () -> Unit) {
    val c = CaptionTheme.colors
    Row(
        Modifier
            .clip(RoundedCornerShape(50))
            .background(c.surface.copy(alpha = 0.7f))
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icon, contentDescription = null, tint = c.text, modifier = Modifier.size(14.dp))
        Spacer(Modifier.width(4.dp))
        Text(label, style = MaterialTheme.typography.bodySmall, color = c.text)
    }
}

/* -------------------------------------------------------------------- */
/* Small helpers                                                         */
/* -------------------------------------------------------------------- */

private fun Modifier.rotate(degrees: Float): Modifier =
    this.then(androidx.compose.ui.draw.rotate(degrees))
