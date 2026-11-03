package com.captiongrab.app.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import java.io.IOException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map

private val Context.settingsDataStore: DataStore<Preferences> by preferencesDataStore(name = "captiongrab_settings")

enum class ThemeMode { SYSTEM, DARK, LIGHT;
    companion object {
        fun fromName(name: String?) = ThemeMode.entries.firstOrNull { it.name == name } ?: DARK
    }
}

enum class TranscriptView { SEGMENTS, PARAGRAPHS;
    companion object {
        fun fromName(name: String?) = TranscriptView.entries.firstOrNull { it.name == name } ?: SEGMENTS
    }
}

enum class TextSize(val label: String, val scale: Float) {
    COMPACT("Compact", 0.90f),
    DEFAULT("Default", 1.0f),
    LARGE("Large", 1.18f),
    HUGE("Huge", 1.36f),
    ;

    companion object {
        fun fromName(name: String?) = TextSize.entries.firstOrNull { it.name == name } ?: DEFAULT
    }
}

enum class AppLanguage(val tag: String, val label: String) {
    ENGLISH("en", "English"),
    SPANISH("es", "Español"),
    FRENCH("fr", "Français"),
    GERMAN("de", "Deutsch"),
    PORTUGUESE("pt", "Português"),
    ITALIAN("it", "Italiano"),
    HINDI("hi", "हिन्दी"),
    ARABIC("ar", "العربية"),
    JAPANESE("ja", "日本語"),
    KOREAN("ko", "한국어"),
    CHINESE("zh", "中文"),
    RUSSIAN("ru", "Русский"),
    INDONESIAN("id", "Bahasa Indonesia"),
    TURKISH("tr", "Türkçe"),
    NIGERIAN_PIDGIN("pcm", "Naijá (Pidgin)"),
    SWAHILI("sw", "Kiswahili"),
    YORUBA("yo", "Yorùbá"),
    HAUSA("ha", "Hausa"),
    IGBO("ig", "Igbo"),
    VIETNAMESE("vi", "Tiếng Việt"),
    THAI("th", "ไทย"),
    POLISH("pl", "Polski"),
    DUTCH("nl", "Nederlands"),
    UKRAINIAN("uk", "Українська"),
    FILIPINO("fil", "Filipino"),
    BENGALI("bn", "বাংলা"),
    TAMIL("ta", "தமிழ்"),
    URDU("ur", "اردو"),
    ;

    companion object {
        fun fromTag(tag: String?): AppLanguage =
            AppLanguage.entries.firstOrNull { it.tag == tag } ?: ENGLISH
    }
}

data class AppSettings(
    /** Caption language requested from the API. */
    val defaultLanguage: String = "en",
    /** Layout used when a transcript opens. */
    val transcriptView: TranscriptView = TranscriptView.SEGMENTS,
    /** One-tap export format. */
    val exportFormat: TranscriptFormat.ExportFormat = TranscriptFormat.ExportFormat.TXT,
    /** Keep an on-device library of captures. */
    val historyEnabled: Boolean = true,
    /** Machine-translate when the exact track is missing. */
    val autoTranslate: Boolean = true,
    /** Wake-lock + keep-screen-on while reading. */
    val keepScreenOn: Boolean = false,
    /** Haptic tick when tapping a timecode. */
    val hapticsEnabled: Boolean = true,
    /** Append fair-use attribution when sharing/exporting. */
    val includeAttribution: Boolean = true,
    val themeMode: ThemeMode = ThemeMode.DARK,
    val textSize: TextSize = TextSize.DEFAULT,
    /** Open timecodes in the YouTube app (true) or the browser (false). */
    val preferYouTubeApp: Boolean = true,
    /** Max local history entries. */
    val historyLimit: Int = 60,
    /** Show the word-level follow-along highlight. */
    val wordHighlight: Boolean = true,
)

/**
 * Preferences live on-device only: no accounts, no analytics, no server sync.
 */
class SettingsRepository(private val context: Context) {

    private object Keys {
        val LANGUAGE = stringPreferencesKey("default_language")
        val VIEW = stringPreferencesKey("transcript_view")
        val EXPORT = stringPreferencesKey("export_format")
        val HISTORY_ENABLED = booleanPreferencesKey("history_enabled")
        val AUTO_TRANSLATE = booleanPreferencesKey("auto_translate")
        val KEEP_SCREEN_ON = booleanPreferencesKey("keep_screen_on")
        val HAPTICS = booleanPreferencesKey("haptics")
        val ATTRIBUTION = booleanPreferencesKey("attribution")
        val THEME = stringPreferencesKey("theme_mode")
        val TEXT_SIZE = stringPreferencesKey("text_size")
        val PREFER_APP = booleanPreferencesKey("prefer_youtube_app")
        val HISTORY_LIMIT = stringPreferencesKey("history_limit")
        val WORD_HIGHLIGHT = booleanPreferencesKey("word_highlight")
    }

    val settings: Flow<AppSettings> = context.settingsDataStore.data
        .catch { e -> if (e is IOException) emit(emptyPreferences()) else throw e }
        .map { prefs -> prefs.toAppSettings() }

    /** Single mapping point so adding a preference means editing one place. */
    private fun Preferences.toAppSettings(): AppSettings {
        val defaults = AppSettings()
        return AppSettings(
            defaultLanguage = this[Keys.LANGUAGE] ?: defaults.defaultLanguage,
            transcriptView = TranscriptView.fromName(this[Keys.VIEW]),
            exportFormat = TranscriptFormat.ExportFormat.fromName(this[Keys.EXPORT]),
            historyEnabled = this[Keys.HISTORY_ENABLED] ?: defaults.historyEnabled,
            autoTranslate = this[Keys.AUTO_TRANSLATE] ?: defaults.autoTranslate,
            keepScreenOn = this[Keys.KEEP_SCREEN_ON] ?: defaults.keepScreenOn,
            hapticsEnabled = this[Keys.HAPTICS] ?: defaults.hapticsEnabled,
            includeAttribution = this[Keys.ATTRIBUTION] ?: defaults.includeAttribution,
            themeMode = ThemeMode.fromName(this[Keys.THEME]),
            textSize = TextSize.fromName(this[Keys.TEXT_SIZE]),
            preferYouTubeApp = this[Keys.PREFER_APP] ?: defaults.preferYouTubeApp,
            historyLimit = this[Keys.HISTORY_LIMIT]?.toIntOrNull() ?: defaults.historyLimit,
            wordHighlight = this[Keys.WORD_HIGHLIGHT] ?: defaults.wordHighlight,
        )
    }

    suspend fun update(patch: (AppSettings) -> AppSettings) {
        context.settingsDataStore.edit { prefs ->
            val next = patch(prefs.toAppSettings())
            prefs[Keys.LANGUAGE] = next.defaultLanguage
            prefs[Keys.VIEW] = next.transcriptView.name
            prefs[Keys.EXPORT] = next.exportFormat.name
            prefs[Keys.HISTORY_ENABLED] = next.historyEnabled
            prefs[Keys.AUTO_TRANSLATE] = next.autoTranslate
            prefs[Keys.KEEP_SCREEN_ON] = next.keepScreenOn
            prefs[Keys.HAPTICS] = next.hapticsEnabled
            prefs[Keys.ATTRIBUTION] = next.includeAttribution
            prefs[Keys.THEME] = next.themeMode.name
            prefs[Keys.TEXT_SIZE] = next.textSize.name
            prefs[Keys.PREFER_APP] = next.preferYouTubeApp
            prefs[Keys.HISTORY_LIMIT] = next.historyLimit.toString()
            prefs[Keys.WORD_HIGHLIGHT] = next.wordHighlight
        }
    }

    suspend fun reset() {
        context.settingsDataStore.edit { it.clear() }
    }
}
