import { describe, expect, it } from "vitest";
import {
  detectPlatform,
  extractYoutubeVideoId,
  getPlatformSupport,
  isValidYoutubeId,
  youtubeEmbedUrl,
} from "./youtube";

describe("isValidYoutubeId", () => {
  it("accepts 11-char ids", () => {
    expect(isValidYoutubeId("dQw4w9WgXcQ")).toBe(true);
    expect(isValidYoutubeId("8jPQjjsBbIc")).toBe(true);
  });
  it("rejects malformed ids", () => {
    expect(isValidYoutubeId("")).toBe(false);
    expect(isValidYoutubeId("too-short")).toBe(false);
    expect(isValidYoutubeId("way-too-long-for-youtube")).toBe(false);
    expect(isValidYoutubeId("dQw4w9WgXcQ!")).toBe(false);
  });
});

describe("detectPlatform", () => {
  it("detects youtube hosts and bare ids", () => {
    expect(detectPlatform("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("youtube");
    expect(detectPlatform("https://youtu.be/dQw4w9WgXcQ")).toBe("youtube");
    expect(detectPlatform("https://m.youtube.com/shorts/dQw4w9WgXcQ")).toBe("youtube");
    expect(detectPlatform("https://music.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("youtube");
    expect(detectPlatform("dQw4w9WgXcQ")).toBe("youtube");
  });
  it("detects other platforms", () => {
    expect(detectPlatform("https://www.facebook.com/watch/?v=123")).toBe("facebook");
    expect(detectPlatform("https://fb.watch/abc/")).toBe("facebook");
    expect(detectPlatform("https://x.com/user/status/123")).toBe("twitter");
    expect(detectPlatform("https://twitter.com/user/status/123")).toBe("twitter");
    expect(detectPlatform("https://www.linkedin.com/posts/x")).toBe("linkedin");
    expect(detectPlatform("https://www.tiktok.com/@u/video/123")).toBe("tiktok");
    expect(detectPlatform("https://www.instagram.com/reel/abc")).toBe("instagram");
  });
  it("rejects garbage", () => {
    expect(detectPlatform("")).toBe("unsupported");
    expect(detectPlatform("not a url at all!!")).toBe("unsupported");
    expect(detectPlatform("https://example.com/video")).toBe("unsupported");
  });
});

describe("extractYoutubeVideoId", () => {
  const ID = "dQw4w9WgXcQ";
  const cases: Array<[string, string | null]> = [
    [`https://www.youtube.com/watch?v=${ID}`, ID],
    [`https://www.youtube.com/watch?v=${ID}&t=42s&list=PLx`, ID],
    [`https://www.youtube.com/watch?list=PLx&v=${ID}&index=3`, ID],
    [`https://youtu.be/${ID}`, ID],
    [`https://youtu.be/${ID}?t=30`, ID],
    [`https://youtu.be/${ID}?si=abcdef`, ID],
    [`https://www.youtube.com/shorts/${ID}`, ID],
    [`https://www.youtube.com/live/${ID}?feature=share`, ID],
    [`https://www.youtube.com/embed/${ID}`, ID],
    [`https://www.youtube.com/v/${ID}`, ID],
    [`https://music.youtube.com/watch?v=${ID}`, ID],
    [`https://www.youtube-nocookie.com/embed/${ID}`, ID],
    [`https://www.youtube.com/attribution_link?a=xyz&u=/watch?v=${ID}&feature=share`, ID],
    [ID, ID],
    ["https://www.youtube.com/watch?v=short", null],
    ["https://www.youtube.com/", null],
    ["https://example.com/watch?v=dQw4w9WgXcQ", null],
    ["", null],
    ["just some words", null],
  ];
  it.each(cases)("parses %s", (input, expected) => {
    expect(extractYoutubeVideoId(input)).toBe(expected);
  });
});

describe("getPlatformSupport", () => {
  it("supports youtube only", () => {
    expect(getPlatformSupport("youtube").supported).toBe(true);
    for (const p of ["facebook", "twitter", "linkedin", "tiktok", "instagram", "unsupported"] as const) {
      const s = getPlatformSupport(p);
      expect(s.supported).toBe(false);
      expect(s.message.length).toBeGreaterThan(10);
    }
  });
});

describe("youtubeEmbedUrl", () => {
  it("builds privacy-enhanced embeds with optional seek", () => {
    expect(youtubeEmbedUrl("dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0");
    expect(youtubeEmbedUrl("dQw4w9WgXcQ", 61.7)).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&start=61",
    );
  });
});
