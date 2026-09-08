var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/transcript.ts
function decodeEntities(input) {
  return input.replace(/&#(\d+);/g, (_, n) => {
    try {
      return String.fromCodePoint(Number(n));
    } catch {
      return _;
    }
  }).replace(/&#x([0-9a-fA-F]+);/g, (_, n) => {
    try {
      return String.fromCodePoint(parseInt(n, 16));
    } catch {
      return _;
    }
  }).replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
__name(decodeEntities, "decodeEntities");
function cleanText(input) {
  return decodeEntities(input.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
}
__name(cleanText, "cleanText");
function parseJson3(payload) {
  const data = JSON.parse(payload);
  const segments = [];
  for (const ev of data.events || []) {
    if (!ev.segs || ev.segs.length === 0) continue;
    const text = cleanText(ev.segs.map((s) => s.utf8 || "").join(""));
    if (!text) continue;
    segments.push({
      start: (ev.tStartMs || 0) / 1e3,
      dur: (ev.dDurationMs || 0) / 1e3,
      text
    });
  }
  return segments;
}
__name(parseJson3, "parseJson3");
function parseSrv3(xml) {
  const segments = [];
  const re = /<text[^>]*start="([\d.]+)"[^>]*dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const text = cleanText(m[3] || "");
    if (!text) continue;
    segments.push({ start: Number(m[1]), dur: Number(m[2]), text });
  }
  return segments;
}
__name(parseSrv3, "parseSrv3");
var VTT_TS = /(\d+:)?(\d{1,2}):(\d{2})\.(\d{3})/;
function vttToSeconds(s) {
  const m = VTT_TS.exec(s);
  if (!m) return 0;
  const h = m[1] ? parseInt(m[1], 10) : 0;
  return h * 3600 + parseInt(m[2], 10) * 60 + parseInt(m[3], 10) + parseInt(m[4], 10) / 1e3;
}
__name(vttToSeconds, "vttToSeconds");
function parseVtt(vtt) {
  const segments = [];
  const blocks = vtt.replace(/\r/g, "").split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0 || lines[0].startsWith("WEBVTT")) continue;
    const timeLine = lines.find((l) => l.includes("-->"));
    if (!timeLine) continue;
    const [a, b] = timeLine.split("-->").map((s) => s.trim());
    const start = vttToSeconds(a);
    const end = vttToSeconds(b);
    const text = cleanText(lines.filter((l) => l !== timeLine && !/^\d+$/.test(l)).join(" "));
    if (!text) continue;
    segments.push({ start, dur: Math.max(0, end - start), text });
  }
  segments.sort((x, y) => x.start - y.start);
  return segments;
}
__name(parseVtt, "parseVtt");
function selectTrack(tracks, requestedLang) {
  const base = requestedLang.split("-")[0].toLowerCase();
  const exact = tracks.find((t) => t.languageCode.toLowerCase() === requestedLang.toLowerCase()) || tracks.find((t) => t.languageCode.toLowerCase().split(/[-_]/)[0] === base);
  if (exact) return { track: exact, servedLang: exact.languageCode, translated: false };
  const manual = tracks.filter((t) => t.kind === "manual");
  const fallback = manual.find((t) => t.languageCode.toLowerCase().startsWith("en")) || manual[0] || tracks.find((t) => t.languageCode.toLowerCase().startsWith("en")) || tracks[0];
  if (!fallback) throw new Error("NO_TRACKS");
  return { track: fallback, servedLang: fallback.languageCode, translated: fallback.translatable };
}
__name(selectTrack, "selectTrack");
function withTranslation(baseUrl, targetLang) {
  const joiner = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${joiner}tlang=${encodeURIComponent(targetLang.split("-")[0])}`;
}
__name(withTranslation, "withTranslation");
function assembleText(segments) {
  return segments.map((s) => s.text).join(" ").replace(/\s+/g, " ").trim();
}
__name(assembleText, "assembleText");

// src/index.ts
var INNERTUBE_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
var INNERTUBE_PLAYER_URL = `https://www.youtube.com/youtubei/v1/player?key=${INNERTUBE_KEY}`;
var VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
var LANG_RE = /^[a-zA-Z]{2,3}(?:[-_][a-zA-Z]{2,4})?$/;
var UPSTREAM_TIMEOUT_MS = 12e3;
function json(data, status = 200, cors, cacheSeconds = 0) {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    ...cors
  };
  if (cacheSeconds > 0) {
    headers["cache-control"] = `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`;
  } else {
    headers["cache-control"] = "no-store";
  }
  return new Response(JSON.stringify(data), { status, headers });
}
__name(json, "json");
function apiError(code, message, status, cors, details) {
  return json({ error: { code, message, ...details ? { details } : {} } }, status, cors);
}
__name(apiError, "apiError");
function corsHeaders(req, env) {
  const allowList = (env.ALLOWED_ORIGINS || "*").split(",").map((s) => s.trim()).filter(Boolean);
  const origin = req.headers.get("origin") || "";
  const allowOrigin = allowList.includes("*") || allowList.length === 0 ? "*" : allowList.includes(origin) ? origin : allowList[0];
  return {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400"
  };
}
__name(corsHeaders, "corsHeaders");
function normalizeLang(lang) {
  if (!lang) return "en";
  const trimmed = lang.trim().replace("_", "-");
  if (!LANG_RE.test(trimmed)) return "en";
  return trimmed.toLowerCase();
}
__name(normalizeLang, "normalizeLang");
async function fetchWithTimeout(url, init = {}, ms = UPSTREAM_TIMEOUT_MS) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort("timeout"), ms);
  try {
    return await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        "accept-language": "en-US,en;q=0.9",
        ...init.headers || {}
      }
    });
  } finally {
    clearTimeout(t);
  }
}
__name(fetchWithTimeout, "fetchWithTimeout");
var rateBuckets = /* @__PURE__ */ new Map();
function isRateLimited(clientIp2, limitPerMinute) {
  const now = Date.now();
  const bucket = rateBuckets.get(clientIp2);
  if (!bucket || now >= bucket.resetAt) {
    rateBuckets.set(clientIp2, { count: 1, resetAt: now + 6e4 });
    if (rateBuckets.size > 1e4) {
      for (const [k, v] of rateBuckets) {
        if (v.resetAt <= now) rateBuckets.delete(k);
      }
    }
    return { limited: false, retryAfter: 0 };
  }
  bucket.count += 1;
  if (bucket.count > limitPerMinute) {
    return { limited: true, retryAfter: Math.ceil((bucket.resetAt - now) / 1e3) };
  }
  return { limited: false, retryAfter: 0 };
}
__name(isRateLimited, "isRateLimited");
function clientIp(req) {
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
__name(clientIp, "clientIp");
function edgeCache() {
  try {
    const c = caches.default;
    return c ?? null;
  } catch {
    return null;
  }
}
__name(edgeCache, "edgeCache");
async function cacheMatch(key) {
  const cache = edgeCache();
  if (!cache) return void 0;
  return cache.match(key).catch(() => void 0);
}
__name(cacheMatch, "cacheMatch");
function cachePut(key, res) {
  const cache = edgeCache();
  if (!cache) return;
  cache.put(key, res.clone()).catch(() => void 0);
}
__name(cachePut, "cachePut");
function withCors(cached, cors) {
  const headers = new Headers(cached.headers);
  for (const [k, v] of Object.entries(cors)) headers.set(k, v);
  return new Response(cached.body, { status: cached.status, headers });
}
__name(withCors, "withCors");
function buildPlayerBody(videoId, clientName) {
  if (clientName === "ANDROID") {
    return JSON.stringify({
      context: {
        client: {
          clientName: "ANDROID",
          clientVersion: "20.10.38",
          androidSdkVersion: 30,
          hl: "en",
          gl: "US"
        }
      },
      videoId
    });
  }
  return JSON.stringify({
    context: {
      client: { clientName: "WEB", clientVersion: "2.20250101.00.00", hl: "en", gl: "US" }
    },
    videoId
  });
}
__name(buildPlayerBody, "buildPlayerBody");
function pickThumbnail(videoDetails, videoId) {
  const thumbs = videoDetails?.thumbnail?.thumbnails || [];
  const best = thumbs.filter((t) => t.url).sort((a, b) => (b.width || 0) - (a.width || 0))[0];
  return best?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
__name(pickThumbnail, "pickThumbnail");
function apiErrorShape(code, message, status) {
  const err = new Error(message);
  err.apiCode = code;
  err.apiStatus = status;
  return err;
}
__name(apiErrorShape, "apiErrorShape");
function isApiShape(e) {
  return typeof e === "object" && e !== null && "apiCode" in e && "apiStatus" in e;
}
__name(isApiShape, "isApiShape");
function parsePlayerResponse(videoId, data) {
  const status = data?.playabilityStatus?.status;
  const reason = data?.playabilityStatus?.reason || data?.playabilityStatus?.messages?.join(" ") || "";
  if (status === "LOGIN_REQUIRED") {
    throw apiErrorShape("PRIVATE_VIDEO", "This video is private or requires sign-in.", 403);
  }
  if (status === "ERROR" || status === void 0) {
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
      422
    );
  }
  const details = data.videoDetails || {};
  const rawTracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
  const tracks = rawTracks.filter((t) => t && t.baseUrl && t.languageCode).map((t) => ({
    baseUrl: String(t.baseUrl),
    languageCode: String(t.languageCode),
    name: (Array.isArray(t?.name?.runs) ? t.name.runs.map((r) => r?.text || "").join("") : "") || String(t.languageCode),
    kind: t.kind === "asr" ? "auto" : "manual",
    translatable: t.isTranslatable !== false
  }));
  return {
    title: String(details.title || "Untitled video"),
    author: String(details.author || details.channelId || "Unknown channel"),
    lengthSeconds: Number(details.lengthSeconds || 0),
    viewCount: details.viewCount != null ? Number(details.viewCount) : null,
    thumbnail: pickThumbnail(details, videoId),
    tracks
  };
}
__name(parsePlayerResponse, "parsePlayerResponse");
async function fetchPlayerData(videoId) {
  let lastError = null;
  for (const client of ["ANDROID", "WEB"]) {
    try {
      const res = await fetchWithTimeout(INNERTUBE_PLAYER_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: buildPlayerBody(videoId, client)
      });
      if (!res.ok) {
        lastError = new Error(`Innertube ${client} responded with ${res.status}`);
        continue;
      }
      const data = await res.json();
      const parsed = parsePlayerResponse(videoId, data);
      if (parsed.tracks.length > 0 || client === "WEB") return parsed;
      lastError = parsed;
      continue;
    } catch (e) {
      if (isApiShape(e)) throw e;
      lastError = e;
    }
  }
  if (isApiShape(lastError)) throw lastError;
  if (lastError && typeof lastError === "object" && "tracks" in lastError) {
    return lastError;
  }
  throw apiErrorShape(
    "UPSTREAM_ERROR",
    "YouTube did not respond. Please try again in a moment.",
    502
  );
}
__name(fetchPlayerData, "fetchPlayerData");
async function downloadTranscript(baseUrl) {
  const attempts = [
    { fmt: "json3", parse: parseJson3 },
    { fmt: "srv3", parse: parseSrv3 },
    { fmt: "vtt", parse: parseVtt }
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
      }
    } catch {
    }
  }
  throw apiErrorShape(
    "TRANSCRIPT_UNAVAILABLE",
    "Captions exist for this video but the transcript could not be downloaded. The owner may have disabled third-party access.",
    422
  );
}
__name(downloadTranscript, "downloadTranscript");
function publicTracksOf(player) {
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
      translatable: t.translatable
    }))
  };
}
__name(publicTracksOf, "publicTracksOf");
async function handleVideo(req, url, cors) {
  const videoId = (url.searchParams.get("id") || "").trim();
  if (!VIDEO_ID_RE.test(videoId)) {
    return apiError(
      "INVALID_VIDEO_ID",
      "Provide a valid 11-character YouTube video id (?id=...).",
      400,
      cors
    );
  }
  const cacheKey = new Request(`https://captiongrab/video?id=${videoId}`, { method: "GET" });
  const cached = await cacheMatch(cacheKey);
  if (cached) return withCors(cached, cors);
  const player = await fetchPlayerData(videoId);
  const info = { ...publicTracksOf(player), videoId };
  const res = json(info, 200, cors, 6 * 3600);
  cachePut(cacheKey, res);
  return res;
}
__name(handleVideo, "handleVideo");
async function handleTranscript(req, url, cors) {
  const videoId = (url.searchParams.get("id") || "").trim();
  const requestedLang = normalizeLang(url.searchParams.get("lang"));
  if (!VIDEO_ID_RE.test(videoId)) {
    return apiError(
      "INVALID_VIDEO_ID",
      "Provide a valid 11-character YouTube video id (?id=...).",
      400,
      cors
    );
  }
  const cacheKey = new Request(
    `https://captiongrab/transcript?id=${videoId}&lang=${encodeURIComponent(requestedLang)}`,
    { method: "GET" }
  );
  const cached = await cacheMatch(cacheKey);
  if (cached) return withCors(cached, cors);
  const player = await fetchPlayerData(videoId);
  if (player.tracks.length === 0) {
    return apiError(
      "NO_CAPTIONS",
      "This video has no caption tracks. Auto-generated captions may not exist yet \u2014 try again later.",
      404,
      cors
    );
  }
  let selection;
  try {
    selection = selectTrack(player.tracks, requestedLang);
  } catch {
    return apiError("NO_CAPTIONS", "No captions are available for this video.", 404, cors);
  }
  const { track, servedLang, translated } = selection;
  const sourceUrl = translated && servedLang.toLowerCase().split(/[-_]/)[0] !== requestedLang.split("-")[0] ? withTranslation(track.baseUrl, requestedLang) : track.baseUrl;
  const segments = await downloadTranscript(sourceUrl);
  const text = assembleText(segments);
  const payload = {
    videoId,
    title: player.title,
    author: player.author,
    requestedLanguage: requestedLang,
    language: translated ? requestedLang : servedLang,
    languageName: track.name,
    isAutoGenerated: track.kind === "auto",
    translated,
    segments,
    text
  };
  const res = json(payload, 200, cors, 6 * 3600);
  cachePut(cacheKey, res);
  return res;
}
__name(handleTranscript, "handleTranscript");
var src_default = {
  async fetch(req, env) {
    const cors = corsHeaders(req, env);
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (req.method !== "GET") {
      return apiError("BAD_REQUEST", "Only GET requests are supported.", 405, cors);
    }
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    if (path === "/api/health" || path === "/health") {
      return json(
        { ok: true, service: "captiongrab-api", time: (/* @__PURE__ */ new Date()).toISOString() },
        200,
        cors
      );
    }
    if (path === "/api/video" || path === "/api/transcript") {
      const limit = Math.max(1, Number(env.RATE_LIMIT_PER_MINUTE || 30));
      const { limited, retryAfter } = isRateLimited(`${clientIp(req)}:${path}`, limit);
      if (limited) {
        const res = apiError(
          "RATE_LIMITED",
          `Too many requests. Please wait ${retryAfter}s and try again.`,
          429,
          cors
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
        timedOut ? "YouTube took too long to respond. Please try again." : "Something went wrong while contacting YouTube. Please try again.",
        502,
        cors
      );
    }
  }
};

// ../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-r2pWYJ/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-r2pWYJ/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
