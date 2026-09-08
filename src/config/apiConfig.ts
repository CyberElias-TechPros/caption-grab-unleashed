/**
 * Central application configuration.
 *
 * Security note: this frontend ships NO API keys. Caption extraction runs
 * through the CaptionGrab Cloudflare Worker (`worker/`), which needs no
 * secrets. Never put private credentials in this file — it is bundled
 * into the public client.
 */

/** Base URL of the CaptionGrab API (Cloudflare Worker). */
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") || "";

/** Request timeout for API calls (ms). */
export const API_TIMEOUT_MS = 30_000;

/** Local storage keys (namespaced + versioned). */
export const LOCAL_STORAGE_KEYS = {
  HISTORY: "captiongrab:history:v1",
  SETTINGS: "captiongrab:settings:v1",
  THEME: "captiongrab:theme",
} as const;

/** Product limits. */
export const LIMITS = {
  /** Max history entries kept locally. */
  MAX_HISTORY_ENTRIES: 30,
  /** Max chars stored per history text preview. */
  HISTORY_PREVIEW_CHARS: 4000,
} as const;

/** Curated sample videos so users can try the product instantly. */
export const SAMPLE_VIDEOS: Array<{ label: string; url: string }> = [
  {
    label: "TED Talk",
    url: "https://www.youtube.com/watch?v=8jPQjjsBbIc",
  },
  {
    label: "Fireship in 100s",
    url: "https://www.youtube.com/watch?v=vu6Jp8RIZLU",
  },
  {
    label: "Kurzgesagt",
    url: "https://www.youtube.com/watch?v=sNhhvQGsMEc",
  },
];

/** Common languages offered for quick-pick (the API also auto-translates). */
export const QUICK_LANGUAGES: Array<{ code: string; label: string }> = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "hi", label: "हिन्दी" },
  { code: "ar", label: "العربية" },
  { code: "ja", label: "日本語" },
];
