package com.captiongrab.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.remember
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.sp
import com.captiongrab.app.data.TextSize
import com.captiongrab.app.data.ThemeMode

/**
 * CaptionGrab design tokens — "late-night screening room".
 *
 * Near-black indigo base, anamorphic light leaks, high-contrast editorial type.
 * Ported 1:1 from the web design system (src/index.css) so the native app is
 * unmistakably the same product.
 */
@Immutable
data class CaptionColors(
    val background: Color,
    val backgroundElevated: Color,
    val surface: Color,
    val surfaceHigh: Color,
    val border: Color,
    val borderStrong: Color,
    val text: Color,
    val textMuted: Color,
    val textFaint: Color,
    val primary: Color,
    val primaryOn: Color,
    val violet: Color,
    val magenta: Color,
    val cyan: Color,
    val amber: Color,
    val green: Color,
    val danger: Color,
    val isDark: Boolean,
) {
    val brandRamp: List<Color> get() = listOf(primary, violet, magenta)
    val heroGlow: Brush
        get() = Brush.radialGradient(
            colors = listOf(primary.copy(alpha = if (isDark) 0.34f else 0.20f), Color.Transparent),
        )
    val accentGlow: Brush
        get() = Brush.radialGradient(
            colors = listOf(magenta.copy(alpha = if (isDark) 0.26f else 0.16f), Color.Transparent),
        )
}

private val Dark = CaptionColors(
    background = Color(0xFF07070F),
    backgroundElevated = Color(0xFF0B0B16),
    surface = Color(0xFF11111C),
    surfaceHigh = Color(0xFF171724),
    border = Color(0xFF232331),
    borderStrong = Color(0xFF32324A),
    text = Color(0xFFF1F1F8),
    textMuted = Color(0xFF9C9CB4),
    textFaint = Color(0xFF6B6B84),
    primary = Color(0xFF8B7BFF),
    primaryOn = Color(0xFF0B0B16),
    violet = Color(0xFFC08BFF),
    magenta = Color(0xFFFA6FB0),
    cyan = Color(0xFF3BD6F5),
    amber = Color(0xFFF5B84D),
    green = Color(0xFF4ADE80),
    danger = Color(0xFFF0566B),
    isDark = true,
)

private val Light = CaptionColors(
    background = Color(0xFFF7F7FC),
    backgroundElevated = Color(0xFFFFFFFF),
    surface = Color(0xFFFFFFFF),
    surfaceHigh = Color(0xFFF1F1F8),
    border = Color(0xFFE1E1EC),
    borderStrong = Color(0xFFC8C8DA),
    text = Color(0xFF10101C),
    textMuted = Color(0xFF5A5A70),
    textFaint = Color(0xFF8A8AA0),
    primary = Color(0xFF5B49E8),
    primaryOn = Color(0xFFFFFFFF),
    violet = Color(0xFF8B5CF6),
    magenta = Color(0xFFDB2777),
    cyan = Color(0xFF0891B2),
    amber = Color(0xFFB45309),
    green = Color(0xFF15803D),
    danger = Color(0xFFDC2626),
    isDark = false,
)

val LocalCaptionColors = staticCompositionLocalOf { Dark }

object CaptionTheme {
    val colors: CaptionColors
        @Composable get() = LocalCaptionColors.current
}

private val BaseTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Black,
        fontSize = 44.sp,
        lineHeight = 44.sp,
        letterSpacing = (-1.6).sp,
    ),
    displayMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Black,
        fontSize = 34.sp,
        lineHeight = 36.sp,
        letterSpacing = (-1.1).sp,
    ),
    displaySmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 27.sp,
        lineHeight = 31.sp,
        letterSpacing = (-0.7).sp,
    ),
    headlineMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 22.sp,
        lineHeight = 27.sp,
        letterSpacing = (-0.4).sp,
    ),
    headlineSmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 18.sp,
        lineHeight = 23.sp,
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 17.sp,
        lineHeight = 22.sp,
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 15.sp,
        lineHeight = 20.sp,
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 25.sp,
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 21.sp,
    ),
    bodySmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 12.5.sp,
        lineHeight = 18.sp,
    ),
    labelLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 14.sp,
        lineHeight = 18.sp,
        letterSpacing = 0.1.sp,
    ),
    labelSmall = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.Medium,
        fontSize = 10.5.sp,
        lineHeight = 14.sp,
        letterSpacing = 1.8.sp,
    ),
)

@Composable
fun CaptionGrabTheme(
    themeMode: ThemeMode = ThemeMode.DARK,
    textSize: TextSize = TextSize.DEFAULT,
    content: @Composable () -> Unit,
) {
    val dark = when (themeMode) {
        ThemeMode.DARK -> true
        ThemeMode.LIGHT -> false
        ThemeMode.SYSTEM -> isSystemInDarkTheme()
    }
    val colors = if (dark) Dark else Light

    val scheme = if (dark) {
        darkColorScheme(
            primary = colors.primary,
            onPrimary = colors.primaryOn,
            secondary = colors.violet,
            background = colors.background,
            onBackground = colors.text,
            surface = colors.surface,
            onSurface = colors.text,
            surfaceVariant = colors.surfaceHigh,
            onSurfaceVariant = colors.textMuted,
            outline = colors.border,
            error = colors.danger,
        )
    } else {
        lightColorScheme(
            primary = colors.primary,
            onPrimary = colors.primaryOn,
            secondary = colors.violet,
            background = colors.background,
            onBackground = colors.text,
            surface = colors.surface,
            onSurface = colors.text,
            surfaceVariant = colors.surfaceHigh,
            onSurfaceVariant = colors.textMuted,
            outline = colors.border,
            error = colors.danger,
        )
    }

    // Reader scaling: only the font scale changes — density (and therefore every
    // dp layout measurement) stays untouched, so nothing reflows or clips.
    val density = LocalDensity.current
    val scaledDensity = remember(density, textSize) {
        Density(density = density.density, fontScale = density.fontScale * textSize.scale)
    }

    CompositionLocalProvider(
        LocalCaptionColors provides colors,
        LocalDensity provides scaledDensity,
    ) {
        MaterialTheme(
            colorScheme = scheme,
            typography = BaseTypography,
            content = content,
        )
    }
}
