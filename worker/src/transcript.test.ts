import { describe, expect, it } from "vitest";
import {
  assembleText,
  LanguageUnavailableError,
  cleanText,
  decodeEntities,
  parseJson3,
  parseSrv3,
  parseVtt,
  selectTrack,
  withTranslation,
  type ResolvedTrack,
} from "./transcript";

const track = (over: Partial<ResolvedTrack> = {}): ResolvedTrack => ({
  baseUrl: "https://www.youtube.com/api/timedtext?v=x&lang=en",
  languageCode: "en",
  name: "English",
  kind: "manual",
  translatable: true,
  ...over,
});

describe("decodeEntities / cleanText", () => {
  it("decodes html entities and strips tags", () => {
    expect(decodeEntities("fish &amp; chips &quot;yum&quot; &#39;ok&#39;")).toBe(
      'fish & chips "yum" \'ok\'',
    );
    expect(decodeEntities("&#65;&#x42;")).toBe("AB");
    expect(cleanText('<font color="#fff">Hello   <b>world</b></font>')).toBe("Hello world");
  });
});

describe("parseJson3", () => {
  it("parses timedtext json3 events", () => {
    const payload = JSON.stringify({
      events: [
        { tStartMs: 0, dDurationMs: 2500, segs: [{ utf8: "Hello " }, { utf8: "world" }] },
        { tStartMs: 3000, dDurationMs: 2000, segs: [{ utf8: "second &amp; line" }] },
        { tStartMs: 5000, dDurationMs: 1000 }, // no segs → skipped
        { tStartMs: 6000, dDurationMs: 1000, segs: [{ utf8: "   " }] }, // blank → skipped
      ],
    });
    expect(parseJson3(payload)).toEqual([
      { start: 0, dur: 2.5, text: "Hello world" },
      { start: 3, dur: 2, text: "second & line" },
    ]);
  });
  it("throws on invalid json", () => {
    expect(() => parseJson3("not json")).toThrow();
  });
});

describe("parseSrv3", () => {
  it("parses srv3 xml", () => {
    const xml =
      '<?xml version="1.0"?><timedtext><body>' +
      '<text start="0" dur="2.5">Hello world</text>' +
      '<text start="3.1" dur="2">Fish &amp; chips</text>' +
      "</body></timedtext>";
    expect(parseSrv3(xml)).toEqual([
      { start: 0, dur: 2.5, text: "Hello world" },
      { start: 3.1, dur: 2, text: "Fish & chips" },
    ]);
  });
  it("returns empty for garbage", () => {
    expect(parseSrv3("<html>nope</html>")).toEqual([]);
  });
});

describe("parseVtt", () => {
  it("parses webvtt cues", () => {
    const vtt =
      "WEBVTT\n\n" +
      "00:00.000 --> 00:02.500\nHello world\n\n" +
      "00:03.000 --> 00:05.000\nsecond line\n";
    expect(parseVtt(vtt)).toEqual([
      { start: 0, dur: 2.5, text: "Hello world" },
      { start: 3, dur: 2, text: "second line" },
    ]);
  });
  it("handles hour timestamps and cue ids, sorted", () => {
    const vtt =
      "WEBVTT\n\n" +
      "2\n01:02:03.250 --> 01:02:05.000\nlater\n\n" +
      "1\n00:01.000 --> 00:02.000\nfirst\n";
    const segs = parseVtt(vtt);
    expect(segs[0].text).toBe("first");
    expect(segs[1].start).toBeCloseTo(3723.25);
    expect(segs[1].dur).toBeCloseTo(1.75);
  });
});

describe("selectTrack", () => {
  const tracks = [
    track({ languageCode: "en", name: "English", kind: "manual" }),
    track({ languageCode: "es", name: "Spanish", kind: "auto" }),
  ];
  it("prefers exact match", () => {
    const sel = selectTrack(tracks, "es");
    expect(sel.track.languageCode).toBe("es");
    expect(sel.translated).toBe(false);
  });
  it("matches base language (en-US → en)", () => {
    const sel = selectTrack(tracks, "en-US");
    expect(sel.track.languageCode).toBe("en");
    expect(sel.translated).toBe(false);
  });
  it("falls back to english manual + translate when missing", () => {
    const sel = selectTrack(tracks, "fr");
    expect(sel.track.languageCode).toBe("en");
    expect(sel.translated).toBe(true);
  });
  it("throws when no tracks exist", () => {
    expect(() => selectTrack([], "en")).toThrow();
  });
});

describe("withTranslation / assembleText", () => {
  it("appends tlang param", () => {
    expect(withTranslation("https://x.test/a?b=c", "fr-CA")).toBe("https://x.test/a?b=c&tlang=fr");
    expect(withTranslation("https://x.test/a", "es")).toBe("https://x.test/a?tlang=es");
  });
  it("joins segments into clean text", () => {
    expect(
      assembleText([
        { start: 0, dur: 1, text: "Hello" },
        { start: 1, dur: 1, text: "world" },
      ]),
    ).toBe("Hello world");
  });
});

describe("selectTrack — allowTranslate", () => {
  const tracks: ResolvedTrack[] = [
    { baseUrl: "u1", languageCode: "en", name: "English", kind: "manual", translatable: true },
    { baseUrl: "u2", languageCode: "es", name: "Spanish", kind: "manual", translatable: true },
    { baseUrl: "u3", languageCode: "fr", name: "French", kind: "auto", translatable: true },
  ];

  it("serves an exact match without translating, even when allowTranslate is false", () => {
    const sel = selectTrack(tracks, "es", { allowTranslate: false });
    expect(sel.servedLang).toBe("es");
    expect(sel.translated).toBe(false);
  });

  it("falls back to English + translate by default when the language is missing", () => {
    const sel = selectTrack(tracks, "de");
    expect(sel.servedLang).toBe("en");
    expect(sel.translated).toBe(true);
  });

  it("throws LanguageUnavailableError when translate is off and the language is missing", () => {
    expect(() => selectTrack(tracks, "de", { allowTranslate: false })).toThrow(
      LanguageUnavailableError,
    );
    try {
      selectTrack(tracks, "de", { allowTranslate: false });
    } catch (e) {
      const err = e as LanguageUnavailableError;
      expect(err.available).toEqual(["en", "es", "fr"]);
      expect(err.message).toContain("de");
    }
  });

  it("still throws a plain error when there are no tracks at all", () => {
    expect(() => selectTrack([], "en", { allowTranslate: false })).toThrow();
    expect(() => selectTrack([], "en", { allowTranslate: true })).toThrow();
  });
});
