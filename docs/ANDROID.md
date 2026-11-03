# CaptionGrab for Android — a native app

The Android app lives in [`android/`](../android). It is **native Kotlin + Jetpack
Compose with Material 3 design** — there is no WebView, no React, no Capacitor, no
Cordova, no embedded browser anywhere in the binary.

```
android/
├── app/src/main/java/com/captiongrab/app/
│   ├── MainActivity.kt          # single activity, share-sheet + deep-link intake
│   ├── CaptionGrabApp.kt        # application, Coil image loader
│   ├── data/                    # pure Kotlin domain (unit-tested, no Android deps)
│   │   ├── Models.kt            # @Serializable wire + storage models
│   │   ├── YouTubeUrl.kt        # URL/id parsing, platform detection, timestamps
│   │   ├── TranscriptFormat.kt  # SRT/VTT/TXT/JSON/CSV/Markdown exporters, stats
│   │   ├── CaptionApi.kt        # typed OkHttp client for the Worker API
│   │   ├── ApiError.kt          # typed failures with human recovery copy
│   │   ├── SettingsRepository.kt# DataStore preferences
│   │   └── HistoryRepository.kt # file-per-capture on-device library
│   ├── platform/                # the Android-specific edges
│   │   ├── AndroidServices.kt   # clipboard, share sheet, YouTube handoff, haptics, network
│   │   └── ExportSaver.kt       # MediaStore Downloads save + SAF fallback
│   └── ui/
│       ├── AppRoot.kt           # shell, bottom bar, export + language sheets
│       ├── AppViewModel.kt      # state machine, orchestration
│       ├── theme/Theme.kt       # design tokens, type scale, dynamic reader size
│       ├── components/          # Common.kt (material), TranscriptView.kt (reader)
│       └── screens/             # GrabScreen, TranscriptScreen, LibraryScreen, SettingsScreen
├── app/src/test/java/…          # 60+ JVM unit tests (parsing, export, API, library)
└── gradle/libs.versions.toml    # version catalog
```

## 1. Why the app still talks to the Worker

A phone cannot fetch YouTube captions by itself, and that is a YouTube
constraint, not laziness:

* `youtubei/v1/player` needs a browser-ish POST and returns a `baseUrl` for the
  caption track; fetching that `timedtext` URL from a device is blocked.
* The one officially supported route, Data API v3 `captions.download`, **requires
  OAuth for the video owner** — an API key can never download captions.

So extraction stays server-side in the existing, secret-free Cloudflare Worker
(`worker/`), and the app is a first-class native client for it. Everything else —
history, search, reading, export, share, playback handoff — happens on the device.

The Worker needed exactly one change for native clients: requests without an
`Origin` header (an app is not a browser origin) are no longer answered with an
allow-list origin. See `corsHeaders()` in [`worker/src/index.ts`](../worker/src/index.ts).

## 2. What the app does

| Capability | How it works natively |
|---|---|
| **Paste a link** | Text field with clipboard peek ("YouTube link on your clipboard — tap to use it"), URL keyboard, IME *Go* action |
| **Share from YouTube** | `ACTION_SEND` (`text/plain`) intent filter — share sheet entry "CaptionGrab" |
| **"Open with CaptionGrab"** | `ACTION_VIEW` filters for `youtube.com/watch`, `youtu.be`, `/shorts`, `/live`, `music.youtube.com` |
| **Every URL shape** | `YouTubeUrl.extractVideoId` handles watch/shorts/live/embed/v/clip/attribution/music, bare ids, `si=` params, and free-form share text |
| **Track picker** | Creator captions and auto-generated tracks grouped, translatability marked |
| **Reader** | LazyColumn, 16.5sp body, selectable text, search with match count + prev/next, tap-to-seek timecodes, optional reading paragraphs |
| **Watch alongside** | Timecode tap opens the **YouTube app** at that second (`vnd.youtube:<id>?t=<s>`), browser fallback; no embedded player or WebView |
| **Export** | TXT · timestamped TXT · SRT · VTT · JSON · CSV · Markdown via a bottom sheet: **Save to Downloads** (MediaStore `Downloads/CaptionGrab/`), **Share file** (FileProvider), or **Copy** |
| **Library** | One file per capture in app-private storage; offline open, full-text search, star to keep, retention limit, de-dupe by video+language, cached thumbnails |
| **Settings** | DataStore: preferred caption language (29 quick picks), smart auto-translate, text size (Compact→Huge), theme (System/Dark/Light), default export, haptics, keep-screen-awake, attribution, YouTube-app vs browser |
| **Status** | Live Worker health chip with recheck; offline banners that make clear saved captures still open |
| **Accessibility** | Content descriptions on every icon action, 44–48dp targets, system font-scale respected and *multiplied* (never overridden), RTL-safe layouts |

## 3. Design intent — meet the user where they are

The web app is a marketing page with a tool inside. The Android app inverts that:
**the tool is the app**, and the reassurance lives in small lines of copy instead of
a landing page.

Three phone-specific decisions drove most of the UI:

1. **The share sheet is the front door.** Most people meet a video in the YouTube
   app, not in a URL bar. Share → CaptionGrab → transcript in under five seconds,
   with the link pre-filled and the request already in flight.
2. **Reading beats browsing.** The reader is full-screen, thumb-reachable, with a
   docked action bar. Every timecode is a 44dp target that jumps the video, so
   "read → check the moment → read on" costs one tap, not an app-switch cycle.
3. **Data is local and honest.** Nothing leaves the device except the video id.
   The library survives offline, the API status is visible, and every error says
   what happened *and* what to do next.

## 4. Build

Requirements: **JDK 17**, Android SDK **34** (build-tools 34.0.0), and Gradle 8.9
(the wrapper downloads it). Either use Android Studio (Ladybug or newer, which can
provision the SDK for you) or the command line:

```bash
cd android

# Debug APK → android/app/build/outputs/apk/debug/app-debug.apk
./gradlew :app:assembleDebug

# Unit tests (pure JVM, no device needed)
./gradlew :app:testDebugUnitTest

# Lint
./gradlew :app:lintDebug

# Release (needs signing config, see §7)
./gradlew :app:bundleRelease
```

Install on a connected device:

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

`minSdk 24` (Android 7.0) · `targetSdk 34` · `compileSdk 34` · Kotlin 2.0.21 ·
AGP 8.5.2 · Compose BOM 2024.09.03 · Java/Kotlin target 17.

## 5. Point the app at your own API

The production Worker is compiled in as the default:

```kotlin
// android/app/build.gradle.kts
CAPTIONGRAB_API_URL ?: "https://captiongrab-api.cyber-e54.workers.dev"
```

Override it without touching source, in priority order:

1. `android/local.properties` → `api.base.url=https://your-worker.workers.dev`
2. Environment variable → `CAPTIONGRAB_API_URL=https://your-worker.workers.dev ./gradlew :app:assembleDebug`

The value is exposed as `BuildConfig.API_BASE_URL` and shown in Settings → About,
so a misconfigured build is diagnosable from inside the app.

## 6. Testing

```bash
cd android && ./gradlew :app:testDebugUnitTest
```

| Suite | Covers |
|---|---|
| `YouTubeUrlTest` | Every URL shape, share-sheet text, platform messages, `t=`/`1h2m3s` offsets |
| `TranscriptFormatTest` | Clock/SRT/VTT timestamps, all 7 exporters, paragraphs, stats, slugs, chunking |
| `ApiParsingTest` | The Worker JSON contract, every error code → title/suggestion, 429 retry window, language-unavailable details, malformed JSON, offline health |
| `HistoryRepositoryTest` | Save/reload round trip, de-dupe, retention, starred survival, corrupt-index recovery, search, thumbnails |

The domain layer has **zero Android imports**, which is what makes that possible.

## 7. Release checklist (Play Store)

1. **Signing** — create an upload key and add it outside version control:

   ```bash
   keytool -genkeypair -v -keystore ~/captiongrab-upload.jks \
     -alias captiongrab -keyalg RSA -keysize 4096 -validity 10000
   ```

   then in `android/app/build.gradle.kts` add a `signingConfigs.release` block that
   reads a **git-ignored** `android/keystore.properties`. Never commit the keystore.
2. **Version** — bump `versionCode`/`versionName` in `defaultConfig`.
3. **Bundle** — `./gradlew :app:bundleRelease` → `app-release.aab`.
4. **Store listing** — this app reads captions from videos the user has access to.
   Declare the transcript/fair-use stance from the README, link a privacy policy
   (*no data collected; the only network call is the video id to our own API*),
   and use the Data safety form accordingly: **no data collected, no data shared**.
5. **Screenshots** — Grab (with the clipboard hint), Reader (search active),
   Export sheet, Library (a few captures), Settings.
6. **Permissions review** — the app requests only `INTERNET` and
   `ACCESS_NETWORK_STATE`; `WRITE_EXTERNAL_STORAGE` is capped at `maxSdkVersion=28`
   and only used by the legacy save path.

## 8. Performance notes

* One `OkHttpClient` (connection pooling, 15s connect / 35s read / 45s call).
* The library index holds metadata only; bodies live in per-capture files, so list
  scrolling and star/delete never rewrite megabytes.
* Thumbnails go through a dedicated Coil loader (12% memory cache, 64 MB disk),
  plus a copy of the bytes in app storage so the library renders offline.
* The aurora backdrop is a single `Canvas` draw pass with no per-frame allocation;
  the reader is a `LazyColumn` keyed by segment identity.
* Aggressive R8 (`isMinifyEnabled` + `isShrinkResources`) with serialization and
  OkHttp keep rules in `proguard-rules.pro`.

## 9. Known constraints (and why)

| Constraint | Reason | Mitigation in app |
|---|---|---|
| YouTube only | Other platforms expose no captions API | Explicit, per-platform explanations instead of a generic error |
| No embedded player | `WebView` is deliberately excluded; the official player cannot be embedded in a third-party app | One-tap handoff to the YouTube app at the exact second |
| Needs the Worker | The device cannot download YouTube captions | Health chip, honest offline messaging, offline library |
| Machine translation | Translated tracks are YouTube's machine translation of the chosen track | Labelled "Translated from …", never passed off as creator captions |

## 10. Roadmap for the native app

* Home-screen widget + Quick Settings tile: "Grab from clipboard".
* Share-sheet target that returns the transcript via `ACTION_SEND` directly.
* Optional on-device translation for the reader view (ML Kit).
* `.srt`/`.vtt` import so users can open subtitle files they already own.
* Foldable/tablet two-pane layout (reader + library) — the reader is already a
  separate composable, so this is layout work, not a rewrite.
