/** YouTube URL parsing, platform detection and ID validation. */

export type Platform = "youtube" | "facebook" | "twitter" | "linkedin" | "tiktok" | "instagram" | "unsupported";

export const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

export function isValidYoutubeId(value: string): boolean {
  return YOUTUBE_ID_RE.test(value.trim());
}

/**
 * Detect the platform from a raw user input (URL or bare video id).
 * A bare 11-char YouTube id is treated as YouTube.
 */
export function detectPlatform(input: string): Platform {
  const value = input.trim();
  if (!value) return "unsupported";
  if (YOUTUBE_ID_RE.test(value)) return "youtube";

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return "unsupported";
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");

  if (
    host === "youtube.com" ||
    host.endsWith(".youtube.com") ||
    host === "youtu.be" ||
    host === "youtube-nocookie.com" ||
    host.endsWith(".youtube-nocookie.com")
  ) {
    return "youtube";
  }
  if (host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.watch" || host === "fb.com") {
    return "facebook";
  }
  if (
    host === "twitter.com" ||
    host.endsWith(".twitter.com") ||
    host === "x.com" ||
    host.endsWith(".x.com") ||
    host === "t.co"
  ) {
    return "twitter";
  }
  if (host === "linkedin.com" || host.endsWith(".linkedin.com") || host === "lnkd.in") {
    return "linkedin";
  }
  if (host === "tiktok.com" || host.endsWith(".tiktok.com") || host === "vm.tiktok.com") {
    return "tiktok";
  }
  if (host === "instagram.com" || host.endsWith(".instagram.com")) {
    return "instagram";
  }
  return "unsupported";
}

/**
 * Extract a YouTube video id from every common URL shape:
 *  watch?v=, youtu.be/, /shorts/, /live/, /embed/, /v/, music.youtube.com,
 *  attribution links (?u=/watch?v=), hash fragments, and bare ids.
 */
export function extractYoutubeVideoId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (YOUTUBE_ID_RE.test(value)) return value;

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  const isYoutubeHost =
    host === "youtu.be" ||
    host.endsWith("youtube.com") ||
    host.endsWith("youtube-nocookie.com");
  if (!isYoutubeHost) return null;

  // 1. Standard watch URL (?v= or ?vi=)
  const vParam = url.searchParams.get("v") || url.searchParams.get("vi");
  if (vParam && YOUTUBE_ID_RE.test(vParam)) return vParam;

  // 2. Attribution / redirect links (?u=/watch?v=XXXX)
  const nestedU = url.searchParams.get("u");
  if (nestedU) {
    const nested = extractYoutubeVideoId(
      nestedU.startsWith("/") ? `https://www.youtube.com${nestedU}` : nestedU,
    );
    if (nested) return nested;
  }

  // 3. Short youtu.be links (id is first path segment; may carry ?t= etc.)
  if (host === "youtu.be") {
    const seg = url.pathname.split("/").filter(Boolean)[0] || "";
    if (YOUTUBE_ID_RE.test(seg)) return seg;
  }

  // 4. Path-based: /shorts/ID, /live/ID, /embed/ID, /v/ID, /e/ID
  const pathMatch = url.pathname.match(
    /\/(?:shorts|live|embed|v|e|reel)\/([a-zA-Z0-9_-]{11})(?:[/?#]|$)/,
  );
  if (pathMatch) return pathMatch[1];

  // 5. Trailing bare id anywhere in the path.
  const trailing = url.pathname.match(/([a-zA-Z0-9_-]{11})(?:[/?#]|$)/);
  if (trailing && YOUTUBE_ID_RE.test(trailing[1])) return trailing[1];

  // 6. Hash-based players (#/watch?v=ID).
  const hashMatch = url.hash.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (hashMatch) return hashMatch[1];

  return null;
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function youtubeThumbnail(videoId: string, quality: "default" | "hq" | "max" = "hq"): string {
  const file = quality === "max" ? "maxresdefault.jpg" : quality === "hq" ? "hqdefault.jpg" : "default.jpg";
  return `https://i.ytimg.com/vi/${videoId}/${file}`;
}

/** Privacy-enhanced embed URL with an optional seek position. */
export function youtubeEmbedUrl(videoId: string, startSeconds = 0): string {
  const base = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
  return startSeconds > 0 ? `${base}&start=${Math.floor(startSeconds)}` : base;
}

export interface PlatformSupport {
  supported: boolean;
  message: string;
}

export function getPlatformSupport(platform: Platform): PlatformSupport {
  switch (platform) {
    case "youtube":
      return { supported: true, message: "YouTube videos are fully supported — paste any link to begin." };
    case "facebook":
      return {
        supported: false,
        message:
          "Facebook doesn't offer caption access to third-party tools. Open the video on Facebook and tap the CC button to view captions.",
      };
    case "twitter":
      return {
        supported: false,
        message:
          "X (Twitter) doesn't expose captions via any public API. If the author enabled them, use the CC button on the video player.",
      };
    case "linkedin":
      return {
        supported: false,
        message:
          "LinkedIn doesn't expose captions to third-party tools. Use the CC button on the LinkedIn player when available.",
      };
    case "tiktok":
      return {
        supported: false,
        message:
          "TikTok doesn't expose captions via a public API. Enable auto-captions inside the TikTok app to read along.",
      };
    case "instagram":
      return {
        supported: false,
        message:
          "Instagram doesn't expose captions to third-party tools. Turn on captions in the Instagram app's accessibility settings.",
      };
    default:
      return {
        supported: false,
        message: "That doesn't look like a video link. Paste a YouTube URL or an 11-character video id.",
      };
  }
}
