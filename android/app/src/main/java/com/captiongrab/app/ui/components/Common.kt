package com.captiongrab.app.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.captiongrab.app.ui.theme.CaptionTheme
import kotlin.math.cos
import kotlin.math.sin

/**
 * Shared visual language: cards, pills, buttons, labels, the aurora backdrop.
 * Kept in one file so every screen inherits the same material and motion.
 */

/* -------------------------------------------------------------------- */
/* Backdrop                                                              */
/* -------------------------------------------------------------------- */

/**
 * "Late-night screening room" backdrop: two slow light leaks over near-black,
 * plus a fixed vignette. Drawn on a Canvas so it costs one draw pass and never
 * allocates during scroll.
 */
@Composable
fun AuroraBackdrop(modifier: Modifier = Modifier) {
    val c = CaptionTheme.colors
    val transition = rememberInfiniteTransition(label = "aurora")
    val drift by transition.animateFloat(
        initialValue = 0f,
        targetValue = (2 * Math.PI).toFloat(),
        animationSpec = infiniteRepeatable(tween(26_000), RepeatMode.Restart),
        label = "drift",
    )
    Canvas(modifier = modifier.fillMaxSize()) {
        drawRect(c.background)
        val w = size.width
        val h = size.height
        val one = Offset(w * (0.22f + 0.06f * sin(drift)), h * (0.14f + 0.05f * cos(drift)))
        val two = Offset(w * (0.86f + 0.05f * cos(drift * 0.8f)), h * (0.34f + 0.06f * sin(drift * 0.7f)))
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(c.primary.copy(alpha = if (c.isDark) 0.30f else 0.16f), Color.Transparent),
                center = one,
                radius = w * 0.95f,
            ),
            radius = w * 0.95f,
            center = one,
        )
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(c.magenta.copy(alpha = if (c.isDark) 0.22f else 0.12f), Color.Transparent),
                center = two,
                radius = w * 0.75f,
            ),
            radius = w * 0.75f,
            center = two,
        )
        if (c.isDark) {
            drawRect(
                brush = Brush.verticalGradient(
                    colors = listOf(Color.Transparent, c.background.copy(alpha = 0.55f), c.background),
                ),
            )
        }
    }
}

/* -------------------------------------------------------------------- */
/* Surfaces                                                              */
/* -------------------------------------------------------------------- */

@Composable
fun CaptionCard(
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(22.dp),
    highlighted: Boolean = false,
    onClick: (() -> Unit)? = null,
    content: @Composable () -> Unit,
) {
    val c = CaptionTheme.colors
    val borderColor by animateColorAsState(
        if (highlighted) c.primary.copy(alpha = 0.55f) else c.border,
        label = "cardBorder",
    )
    val base = modifier
        .clip(shape)
        .background(if (c.isDark) c.surface.copy(alpha = 0.86f) else c.surface)
        .border(1.dp, borderColor, shape)
    val clickable = if (onClick != null) {
        base.clickable(onClick = onClick, role = Role.Button)
    } else base
    Box(clickable) { content() }
}

@Composable
fun MonoLabel(
    text: String,
    modifier: Modifier = Modifier,
    color: Color = CaptionTheme.colors.textMuted,
    size: Float = 10.5f,
    letterSpacing: Float = 1.8f,
) {
    Text(
        text = text.uppercase(),
        modifier = modifier,
        color = color,
        style = TextStyle(
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.Medium,
            fontSize = size.sp,
            letterSpacing = letterSpacing.sp,
            lineHeight = (size + 4).sp,
        ),
    )
}

@Composable
fun GradientText(
    text: String,
    modifier: Modifier = Modifier,
    style: TextStyle = MaterialTheme.typography.displayMedium,
) {
    val c = CaptionTheme.colors
    Text(
        text = text,
        modifier = modifier,
        style = style.copy(
            brush = Brush.linearGradient(c.brandRamp + listOf(c.cyan)),
        ),
    )
}

@Composable
fun SectionHeading(
    eyebrow: String,
    title: String,
    modifier: Modifier = Modifier,
    trailing: (@Composable () -> Unit)? = null,
) {
    Row(
        modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Bottom,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Column {
            MonoLabel(eyebrow, color = CaptionTheme.colors.primary)
            Spacer(Modifier.height(6.dp))
            Text(title, style = MaterialTheme.typography.headlineMedium, color = CaptionTheme.colors.text)
        }
        trailing?.invoke()
    }
}

/* -------------------------------------------------------------------- */
/* Buttons                                                               */
/* -------------------------------------------------------------------- */

@Composable
fun PrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
    enabled: Boolean = true,
    loading: Boolean = false,
    height: Dp = 54.dp,
) {
    val c = CaptionTheme.colors
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val scale by animateFloatAsState(if (pressed) 0.975f else 1f, label = "press")
    val alpha by animateFloatAsState(if (enabled) 1f else 0.45f, label = "enabled")
    // NOTE: the caller's own modifier (padding/width) is applied *outside* this
    // box, so the press-scale animation always matches the button's real size.
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(height)
            .alpha(alpha)
            .scale(scale)
            .clip(RoundedCornerShape(18.dp))
            .background(Brush.linearGradient(listOf(c.primary, c.violet, c.magenta)))
            .clickable(
                interactionSource = interaction,
                indication = null,
                enabled = enabled && !loading,
                role = Role.Button,
                onClick = onClick,
            ),
        contentAlignment = Alignment.Center,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            if (loading) {
                Equaliser(tint = c.primaryOn)
                Spacer(Modifier.width(10.dp))
            } else if (icon != null) {
                Icon(icon, contentDescription = null, tint = c.primaryOn, modifier = Modifier.size(20.dp))
                Spacer(Modifier.width(10.dp))
            }
            Text(
                text = text,
                color = c.primaryOn,
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
            )
        }
    }
}

@Composable
fun GhostButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
    enabled: Boolean = true,
    height: Dp = 48.dp,
) {
    val c = CaptionTheme.colors
    Box(
        modifier = Modifier
            .height(height)
            .clip(RoundedCornerShape(16.dp))
            .background(c.surfaceHigh.copy(alpha = if (c.isDark) 0.85f else 1f))
            .border(1.dp, c.border, RoundedCornerShape(16.dp))
            .clickable(enabled = enabled, role = Role.Button, onClick = onClick)
            .then(modifier)
            .padding(horizontal = 16.dp),
        contentAlignment = Alignment.Center,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            if (icon != null) {
                Icon(icon, contentDescription = null, tint = c.text, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
            }
            Text(text, color = c.text, style = MaterialTheme.typography.labelLarge)
        }
    }
}

@Composable
fun IconPill(
    icon: ImageVector,
    contentDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    tint: Color = CaptionTheme.colors.text,
    background: Color = CaptionTheme.colors.surfaceHigh,
    size: Dp = 44.dp,
) {
    Box(
        modifier = Modifier
            .size(size)
            .clip(CircleShape)
            .background(background)
            .clickable(role = Role.Button, onClick = onClick)
            .then(modifier),
        contentAlignment = Alignment.Center,
    ) {
        Icon(icon, contentDescription = contentDescription, tint = tint, modifier = Modifier.size(size * 0.44f))
    }
}

@Composable
fun Tag(
    text: String,
    modifier: Modifier = Modifier,
    color: Color = CaptionTheme.colors.textMuted,
    icon: ImageVector? = null,
    filled: Boolean = false,
) {
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(50))
            .background(if (filled) color.copy(alpha = 0.16f) else Color.Transparent)
            .border(1.dp, color.copy(alpha = 0.4f), RoundedCornerShape(50))
            .padding(horizontal = 10.dp, vertical = 5.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (icon != null) {
            Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(13.dp))
            Spacer(Modifier.width(5.dp))
        }
        Text(
            text = text,
            color = color,
            style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold, fontSize = 11.5.sp),
        )
    }
}

/* -------------------------------------------------------------------- */
/* Indicators                                                            */
/* -------------------------------------------------------------------- */

@Composable
fun StatusDot(reachable: Boolean, checking: Boolean, label: String? = null) {
    val c = CaptionTheme.colors
    val transition = rememberInfiniteTransition(label = "pulse")
    val pulse by transition.animateFloat(
        initialValue = 0.4f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(1100), RepeatMode.Reverse),
        label = "pulseAlpha",
    )
    val color = when {
        checking -> c.amber
        reachable -> c.green
        else -> c.danger
    }
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            Modifier
                .size(8.dp)
                .alpha(if (checking) pulse else 1f)
                .clip(CircleShape)
                .background(color),
        )
        if (label != null) {
            Spacer(Modifier.width(7.dp))
            Text(label, style = MaterialTheme.typography.bodySmall, color = c.textMuted)
        }
    }
}

/** The brand's five-bar equaliser: signals "work in flight" without a spinner. */
@Composable
fun Equaliser(
    tint: Color = CaptionTheme.colors.primary,
    barWidth: Dp = 3.dp,
    height: Dp = 16.dp,
) {
    val transition = rememberInfiniteTransition(label = "eq")
    Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(3.dp)) {
        repeat(5) { index ->
            val h by transition.animateFloat(
                initialValue = 0.25f,
                targetValue = 1f,
                animationSpec = infiniteRepeatable(
                    tween(520 + index * 90, delayMillis = index * 110),
                    RepeatMode.Reverse,
                ),
                label = "bar$index",
            )
            Box(
                Modifier
                    .width(barWidth)
                    .height(height * h)
                    .clip(RoundedCornerShape(50))
                    .background(
                        Brush.verticalGradient(
                            listOf(tint, tint.copy(alpha = 0.55f)),
                        ),
                    ),
            )
        }
    }
}

/** Thin progress track used under the header while a request is running. */
@Composable
fun EmptyState(
    icon: ImageVector,
    title: String,
    body: String,
    modifier: Modifier = Modifier,
    action: (@Composable () -> Unit)? = null,
) {
    val c = CaptionTheme.colors
    Column(
        modifier.fillMaxWidth().padding(horizontal = 28.dp, vertical = 56.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Box(
            Modifier
                .size(74.dp)
                .clip(RoundedCornerShape(24.dp))
                .background(Brush.linearGradient(listOf(c.primary.copy(alpha = 0.22f), c.magenta.copy(alpha = 0.16f))))
                .border(1.dp, c.border, RoundedCornerShape(24.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(icon, contentDescription = null, tint = c.text, modifier = Modifier.size(32.dp))
        }
        Spacer(Modifier.height(20.dp))
        Text(title, style = MaterialTheme.typography.headlineSmall, color = c.text, textAlign = TextAlign.Center)
        Spacer(Modifier.height(8.dp))
        Text(
            body,
            style = MaterialTheme.typography.bodyMedium,
            color = c.textMuted,
            textAlign = TextAlign.Center,
        )
        if (action != null) {
            Spacer(Modifier.height(22.dp))
            action()
        }
    }
}

/* -------------------------------------------------------------------- */
/* Internals                                                             */
/* -------------------------------------------------------------------- */

/** Small helper so cards can advertise "new" without a separate badge component. */
@Composable
fun NewBadge(text: String = "New") {
    val c = CaptionTheme.colors
    Row(
        Modifier
            .clip(RoundedCornerShape(50))
            .background(Brush.linearGradient(listOf(c.primary, c.magenta)))
            .padding(horizontal = 9.dp, vertical = 3.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(Icons.Rounded.AutoAwesome, contentDescription = null, tint = c.primaryOn, modifier = Modifier.size(11.dp))
        Spacer(Modifier.width(4.dp))
        Text(text.uppercase(), color = c.primaryOn, style = MaterialTheme.typography.labelSmall, fontSize = 9.sp)
    }
}

/** Divider with the product's subtle gradient instead of a flat line. */
@Composable
fun GradientDivider(modifier: Modifier = Modifier, alpha: Float = 0.5f) {
    val c = CaptionTheme.colors
    Box(
        modifier
            .fillMaxWidth()
            .height(1.dp)
            .drawBehind {
                drawRect(
                    brush = Brush.horizontalGradient(
                        listOf(Color.Transparent, c.borderStrong.copy(alpha = alpha), Color.Transparent),
                    ),
                )
            },
    )
}
