/**
 * CaptionGrab API — Cloudflare Worker
 *
 * Server-side caption extraction for YouTube videos.
 *
 * Why a backend exists:
 *  - Browsers cannot call YouTube's timedtext / Innertube endpoints directly (CORS).
 *  - The YouTube Data API `captions.download` endpoint requires OAuth — an API key
 *    alone is not enough — so a pure-frontend app can never download captions.
 *  - This worker resolves caption tracks and downloads transcripts server-side,
 *    caching aggressively and rate-limiting per client IP.
 *
 * Routes:
 *  GET /api/health                        → liveness probe
 *  GET /api/video?id=VIDEO_ID             → metadata + available caption tracks
 *  GET /api/transcript?id=VIDEO_ID&lang=  → timed segments + plain text
 *
 * No secrets required. No database required. Stateless + edge-cacheable.
 */

import {
  assembleText,
  LanguageUnavailableError,
  parseJson3,
  parseSrv3,
  parseVtt,
  selectTrack,
  withTranslation,
  type ResolvedTrack,
  type TranscriptSegment,
} from "./transcript";

export interface Env {
  /** Comma-separated list of allowed CORS origins. Defaults to "*" (public API). */
  ALLOWED_ORIGINS?: string;
  /** Max transcript requests per IP per minute. Default 30. */
  RATE_LIMIT_PER_MINUTE?: string;
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface CaptionTrack {
  languageCode: string;
  languageName: string;
  kind: "manual" | "auto";
  translatable: boolean;
}

interface VideoInfo {
  videoId: string;
  title: string;
  author: string;
  lengthSeconds: number;
  viewCount: number | null;
  thumbnail: string;
  captionsAvailable: boolean;
  tracks: CaptionTrack[];
}

type ApiErrorCode =
  | "INVALID_VIDEO_ID"
  | "VIDEO_NOT_FOUND"
  | "PRIVATE_VIDEO"
  | "UNPLAYABLE_VIDEO"
  | "NO_CAPTIONS"
  | "LANGUAGE_UNAVAILABLE"
  | "TRANSCRIPT_UNAVAILABLE"
  | "RATE_LIMITED"
  | "UPSTREAM_ERROR"
  | "BAD_REQUEST"
  | "NOT_FOUND";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

/**
 * Public Innertube API key. This key is embedded in every YouTube web client
 * and is not a secret — it only identifies the client type to Innertube.
 */
const INNERTUBE_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
const INNERTUBE_PLAYER_URL = `https://www.youtube.com/youtubei/v1/player?key=${INNERTUBE_KEY}`;
const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
const LANG_RE = /^[a-zA-Z]{2,3}(?:[-_][a-zA-Z]{2,4})?$/;
const UPSTREAM_TIMEOUT_MS = 12_000;

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

function json(data: unknown, status = 200, cors: HeadersInit, cacheSeconds = 0): Response {
  const headers: Record<string, string> = {
    "content-type": "application/json; charset=utf-8",
    ...(cors as Record<string, string>),
  };
  if (cacheSeconds > 0) {
    headers["cache-control"] = `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`;
  } else {
    headers["cache-control"] = "no-store";
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  cors: HeadersInit,
  details?: unknown,
): Response {
  return json({ error: { code, message, ...(details ? { details } : {}) } }, status, cors);
}

function corsHeaders(req: Request, env: Env): Record<string, string> {
  const allowList = (env.ALLOWED_ORIGINS || "*")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const origin = req.headers.get("origin") || "";
  const allowOrigin =
    allowList.includes("*") || allowList.length === 0
      ? "*"
      : allowList.includes(origin)
        ? origin
        : allowList[0];

  return {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
  };
}

function normalizeLang(lang: string | null): string {
  if (!lang) return "en";
  const trimmed = lang.trim().replace("_", "-");
  if (!LANG_RE.test(trimmed)) return "en";
  return trimmed.toLowerCase();
}

/** Human name for a BCP-47 tag, with a graceful fallback. */
function languageDisplayName(tag: string, fallback: string): string {
  try {
    const name = new Intl.DisplayNames(["en"], { type: "language" }).of(tag);
    return name && name.length > 0 ? name : fallback;
  } catch {
    return fallback;
  }
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  ms = UPSTREAM_TIMEOUT_MS,
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort("timeout"), ms);
  try {
    return await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        "accept-language": "en-US,en;q=0.9",
        ...(init.headers || {}),
      },
    });
  } finally {
    clearTimeout(t);
  }
}

/* ------------------------------------------------------------------ */
/* In-memory per-isolate rate limiter                                  */
/* ------------------------------------------------------------------ */

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(
  clientIp: string,
  limitPerMinute: number,
): { limited: boolean; retryAfter: number } {
  const now = Date.now();
  const bucket = rateBuckets.get(clientIp);
  if (!bucket || now >= bucket.resetAt) {
    rateBuckets.set(clientIp, { count: 1, resetAt: now + 60_000 });
    // Opportunistic cleanup so the map cannot grow unboundedly.
    if (rateBuckets.size > 10_000) {
      for (const [k, v] of rateBuckets) {
        if (v.resetAt <= now) rateBuckets.delete(k);
      }
    }
    return { limited: false, retryAfter: 0 };
  }
  bucket.count += 1;
  if (bucket.count > limitPerMinute) {
    return { limited: true, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { limited: false, retryAfter: 0 };
}

function clientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/**
 * Edge cache handle. `caches.default` exists in the Workers runtime (and in
 * wrangler dev); the cast keeps this file type-safe with or without
 * `@cloudflare/workers-types` installed.
 */
function edgeCache(): Cache | null {
  try {
    const c = (caches as unknown as { default?: Cache }).default;
    return c ?? null;
  } catch {
    return null;
  }
}

async function cacheMatch(key: Request): Promise<Response | undefined> {
  const cache = edgeCache();
  if (!cache) return undefined;
  return cache.match(key).catch(() => undefined);
}

function cachePut(key: Request, res: Response): void {
  const cache = edgeCache();
  if (!cache) return;
  cache.put(key, res.clone()).catch(() => undefined);
}

function withCors(cached: Response, cors: HeadersInit): Response {
  const headers = new Headers(cached.headers);
  for (const [k, v] of Object.entries(cors)) headers.set(k, v);
  return new Response(cached.body, { status: cached.status, headers });
}

/* ------------------------------------------------------------------ */
/* Innertube client                                                    */
/* ------------------------------------------------------------------ */

interface PlayerData {
  title: string;
  author: string;
  lengthSeconds: number;
  viewCount: number | null;
  thumbnail: string;
  tracks: ResolvedTrack[];
}

function buildPlayerBody(videoId: string, clientName: "ANDROID" | "WEB"): string {
  if (clientName === "ANDROID") {
    return JSON.stringify({
      context: {
        client: {
          clientName: "ANDROID",
          clientVersion: "20.10.38",
          androidSdkVersion: 30,
          hl: "en",
          gl: "US",
        },
      },
      videoId,
    });
  }
  return JSON.stringify({
    context: {
      client: { clientName: "WEB", clientVersion: "2.20250101.00.00", hl: "en", gl: "US" },
    },
    videoId,
  });
}

function pickThumbnail(videoDetails: any, videoId: string): string {
  const thumbs: Array<{ url?: string; width?: number }> =
    videoDetails?.thumbnail?.thumbnails || [];
  const best = thumbs.filter((t) => t.url).sort((a, b) => (b.width || 0) - (a.width || 0))[0];
  return best?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/** Internal tagged error so handlers can map to API error responses. */
function apiErrorShape(
  code: ApiErrorCode,
  message: string,
  status: number,
): Error & { apiCode: ApiErrorCode; apiStatus: number } {
  const err = new Error(message) as Error & { apiCode: ApiErrorCode; apiStatus: number };
  err.apiCode = code;
  err.apiStatus = status;
  return err;
}

function isApiShape(e: unknown): e is { apiCode: ApiErrorCode; apiStatus: number; message: string } {
  return typeof e === "object" && e !== null && "apiCode" in e && "apiStatus" in e;
}

function parsePlayerResponse(videoId: string, data: any): PlayerData {
  const status: string | undefined = data?.playabilityStatus?.status;
  const reason: string =
    data?.playabilityStatus?.reason || data?.playabilityStatus?.messages?.join(" ") || "";

  if (status === "LOGIN_REQUIRED") {
    throw apiErrorShape("PRIVATE_VIDEO", "This video is private or requires sign-in.", 403);
  }
  if (status === "ERROR" || status === undefined) {
    const msg = reason.toLowerCase();
    if (msg.includes("not found") || !data?.videoDetails) {
      throw apiErrorShape("VIDEO_NOT_FOUND", "Video not found. Check the URL and try again.", 404);
    }
    throw apiErrorShape("UNPLAYABLE_VIDEO", reason || "This video cannot be played.", 422);
  }
  if (status !== "OK" && status !== "LIVE_STREAM_OFFLINE") {
    throw apiErrorShape(
      "UNPLAYABLE_VIDEO",
      reason || "This video cannot be played right now.",
      422,
    );
  }

  const details = data.videoDetails || {};
  const rawTracks: any[] = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];

  const tracks: ResolvedTrack[] = rawTracks
    .filter((t) => t && t.baseUrl && t.languageCode)
    .map((t) => ({
      baseUrl: String(t.baseUrl),
      languageCode: String(t.languageCode),
      name:
        (Array.isArray(t?.name?.runs) ? t.name.runs.map((r: any) => r?.text || "").join("") : "") ||
        String(t.languageCode),
      kind: t.kind === "asr" ? ("auto" as const) : ("manual" as const),
      translatable: t.isTranslatable !== false,
    }));

  return {
    title: String(details.title || "Untitled video"),
    author: String(details.author || details.channelId || "Unknown channel"),
    lengthSeconds: Number(details.lengthSeconds || 0),
    viewCount: details.viewCount != null ? Number(details.viewCount) : null,
    thumbnail: pickThumbnail(details, videoId),
    tracks,
  };
}

async function fetchPlayerData(videoId: string): Promise<PlayerData> {
  let lastError: unknown = null;
  // ANDROID reliably returns caption tracks without sign-in; WEB is a fallback.
  for (const client of ["ANDROID", "WEB"] as const) {
    try {
      const res = await fetchWithTimeout(INNERTUBE_PLAYER_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: buildPlayerBody(videoId, client),
      });
      if (!res.ok) {
        lastError = new Error(`Innertube ${client} responded with ${res.status}`);
        continue;
      }
      const data: any = await res.json();
      const parsed = parsePlayerResponse(videoId, data);
      // Prefer a response that actually includes caption tracks.
      if (parsed.tracks.length > 0 || client === "WEB") return parsed;
      // ANDROID had no tracks — remember it and try WEB before giving up.
      lastError = parsed;
      continue;
    } catch (e) {
      if (isApiShape(e)) throw e;
      lastError = e;
    }
  }
  if (isApiShape(lastError)) throw lastError;
  // ANDROID-without-tracks case: return it so the caller can report NO_CAPTIONS.
  if (lastError && typeof lastError === "object" && "tracks" in (lastError as object)) {
    return lastError as PlayerData;
  }
  throw apiErrorShape(
    "UPSTREAM_ERROR",
    "YouTube did not respond. Please try again in a moment.",
    502,
  );
}

/* ------------------------------------------------------------------ */
/* Transcript download (json3 → srv3 → vtt fallback chain)             */
/* ------------------------------------------------------------------ */

async function downloadTranscript(baseUrl: string): Promise<TranscriptSegment[]> {
  const attempts: Array<{ fmt: string; parse: (s: string) => TranscriptSegment[] }> = [
    { fmt: "json3", parse: parseJson3 },
    { fmt: "srv3", parse: parseSrv3 },
    { fmt: "vtt", parse: parseVtt },
  ];
  const joiner = baseUrl.includes("?") ? "&" : "?";

  for (const { fmt, parse } of attempts) {
    try {
      const res = await fetchWithTimeout(`${baseUrl}${joiner}fmt=${fmt}`);
      if (!res.ok) continue;
      const body = await res.text();
      if (!body || body.length < 20) continue;
      try {
        const segments = parse(body);
        if (segments.length > 0) return segments;
      } catch {
        // Try the next format.
      }
    } catch {
      // Try the next format.
    }
  }
  throw apiErrorShape(
    "TRANSCRIPT_UNAVAILABLE",
    "Captions exist for this video but the transcript could not be downloaded. The owner may have disabled third-party access.",
    422,
  );
}

/* ------------------------------------------------------------------ */
/* Route handlers                                                      */
/* ------------------------------------------------------------------ */

function publicTracksOf(player: PlayerData): VideoInfo {
  return {
    videoId: "",
    title: player.title,
    author: player.author,
    lengthSeconds: player.lengthSeconds,
    viewCount: player.viewCount,
    thumbnail: player.thumbnail,
    captionsAvailable: player.tracks.length > 0,
    tracks: player.tracks.map((t) => ({
      languageCode: t.languageCode,
      languageName: t.name,
      kind: t.kind,
      translatable: t.translatable,
    })),
  };
}

async function handleVideo(req: Request, url: URL, cors: HeadersInit): Promise<Response> {
  const videoId = (url.searchParams.get("id") || "").trim();
  if (!VIDEO_ID_RE.test(videoId)) {
    return apiError(
      "INVALID_VIDEO_ID",
      "Provide a valid 11-character YouTube video id (?id=...).",
      400,
      cors,
    );
  }

  // Edge cache: metadata is effectively immutable for hours.
  const cacheKey = new Request(`https://captiongrab/video?id=${videoId}`, { method: "GET" });
  const cached = await cacheMatch(cacheKey);
  if (cached) return withCors(cached, cors);

  const player = await fetchPlayerData(videoId);
  const info = { ...publicTracksOf(player), videoId };
  const res = json(info, 200, cors, 6 * 3600);
  cachePut(cacheKey, res);
  return res;
}

async function handleTranscript(req: Request, url: URL, cors: HeadersInit): Promise<Response> {
  const videoId = (url.searchParams.get("id") || "").trim();
  const requestedLang = normalizeLang(url.searchParams.get("lang"));
  /** `translate=0` makes a missing language a hard error instead of a fallback. */
  const allowTranslate = url.searchParams.get("translate") !== "0";

  if (!VIDEO_ID_RE.test(videoId)) {
    return apiError(
      "INVALID_VIDEO_ID",
      "Provide a valid 11-character YouTube video id (?id=...).",
      400,
      cors,
    );
  }

  const cacheKey = new Request(
    `https://captiongrab/transcript?id=${videoId}&lang=${encodeURIComponent(requestedLang)}&tr=${allowTranslate ? 1 : 0}`,
    { method: "GET" },
  );
  const cached = await cacheMatch(cacheKey);
  if (cached) return withCors(cached, cors);

  const player = await fetchPlayerData(videoId);
  if (player.tracks.length === 0) {
    return apiError(
      "NO_CAPTIONS",
      "This video has no caption tracks. Auto-generated captions may not exist yet — try again later.",
      404,
      cors,
    );
  }

  let selection: ReturnType<typeof selectTrack>;
  try {
    selection = selectTrack(player.tracks, requestedLang, { allowTranslate });
  } catch (e) {
    if (e instanceof LanguageUnavailableError) {
      return apiError(
        "LANGUAGE_UNAVAILABLE",
        `${e.message} Available: ${e.available.join(", ") || "none"}. Turn on smart auto-translate or pick another language.`,
        404,
        cors,
        { availableLanguages: e.available },
      );
    }
    return apiError("NO_CAPTIONS", "No captions are available for this video.", 404, cors);
  }
  const { track, servedLang, translated } = selection;
  const sourceUrl =
    translated && servedLang.toLowerCase().split(/[-_]/)[0] !== requestedLang.split("-")[0]
      ? withTranslation(track.baseUrl, requestedLang)
      : track.baseUrl;

  const segments = await downloadTranscript(sourceUrl);
  const text = assembleText(segments);

  const payload = {
    videoId,
    title: player.title,
    author: player.author,
    requestedLanguage: requestedLang,
    language: translated ? requestedLang : servedLang,
    // When we machine-translated, the transcript is in the *requested* language,
    // so report that language's name — not the source track's.
    languageName: translated ? languageDisplayName(requestedLang, track.name) : track.name,
    sourceLanguage: translated ? servedLang : servedLang,
    sourceLanguageName: track.name,
    isAutoGenerated: track.kind === "auto",
    translated,
    segments,
    text,
  };

  const res = json(payload, 200, cors, 6 * 3600);
  cachePut(cacheKey, res);
  return res;
}

/* ------------------------------------------------------------------ */
/* Worker entrypoint                                                   */
/* ------------------------------------------------------------------ */

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(req, env);

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors as HeadersInit });
    }
    if (req.method !== "GET") {
      return apiError("BAD_REQUEST", "Only GET requests are supported.", 405, cors);
    }

    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (path === "/api/health" || path === "/health") {
      return json(
        { ok: true, service: "captiongrab-api", time: new Date().toISOString() },
        200,
        cors,
      );
    }

    // Rate limit the expensive routes.
    if (path === "/api/video" || path === "/api/transcript") {
      const limit = Math.max(1, Number(env.RATE_LIMIT_PER_MINUTE || 30));
      const { limited, retryAfter } = isRateLimited(`${clientIp(req)}:${path}`, limit);
      if (limited) {
        const res = apiError(
          "RATE_LIMITED",
          `Too many requests. Please wait ${retryAfter}s and try again.`,
          429,
          cors,
        );
        res.headers.set("retry-after", String(retryAfter));
        return res;
      }
    }

    try {
      if (path === "/api/video") return await handleVideo(req, url, cors);
      if (path === "/api/transcript") return await handleTranscript(req, url, cors);
      return apiError("NOT_FOUND", `Unknown endpoint: ${path}`, 404, cors);
    } catch (e) {
      if (isApiShape(e)) {
        return apiError(e.apiCode, e.message, e.apiStatus, cors);
      }
      const message = e instanceof Error ? e.message : String(e);
      const timedOut = /abort|timeout/i.test(message);
      return apiError(
        "UPSTREAM_ERROR",
        timedOut
          ? "YouTube took too long to respond. Please try again."
          : "Something went wrong while contacting YouTube. Please try again.",
        502,
        cors,
      );
    }
  },
};
