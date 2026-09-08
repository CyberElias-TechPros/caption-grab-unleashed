import { describe, expect, it } from "vitest";
import {
  countWords,
  formatClock,
  formatCount,
  formatDuration,
  formatSrtTimestamp,
  formatVttTimestamp,
  readingTime,
  slugifyFilename,
  toParagraphs,
  toPlainText,
  toSrt,
  toTimestampedText,
  toVtt,
} from "./format";
import type { TranscriptSegment } from "./api";

const SEGS: TranscriptSegment[] = [
  { start: 0, dur: 2.5, text: "Hello world" },
  { start: 3, dur: 2, text: "this is a test" },
  { start: 65.5, dur: 1.2, text: "one minute in" },
];

describe("timestamps", () => {
  it("formats clock times", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(61)).toBe("01:01");
    expect(formatClock(3661)).toBe("01:01:01");
    expect(formatClock(61.5, { millis: true })).toBe("01:01,500");
  });
  it("formats srt timestamps", () => {
    expect(formatSrtTimestamp(0)).toBe("00:00:00,000");
    expect(formatSrtTimestamp(65.5)).toBe("00:01:05,500");
    expect(formatSrtTimestamp(3723.25)).toBe("01:02:03,250");
  });
  it("formats vtt timestamps", () => {
    expect(formatVttTimestamp(0)).toBe("00:00.000");
    expect(formatVttTimestamp(65.5)).toBe("01:05.500");
    expect(formatVttTimestamp(3723.25)).toBe("01:02:03.250");
  });
});

describe("exporters", () => {
  it("builds valid SRT", () => {
    const srt = toSrt(SEGS);
    expect(srt).toContain("1\n00:00:00,000 --> 00:00:02,500\nHello world");
    expect(srt).toContain("3\n00:01:05,500 --> 00:01:06,700\none minute in");
    expect(srt.endsWith("\n")).toBe(true);
  });
  it("builds valid VTT", () => {
    const vtt = toVtt(SEGS);
    expect(vtt.startsWith("WEBVTT\n\n")).toBe(true);
    expect(vtt).toContain("00:00.000 --> 00:02.500\nHello world");
  });
  it("builds plain and timestamped text", () => {
    expect(toPlainText(SEGS)).toBe("Hello world this is a test one minute in");
    expect(toTimestampedText(SEGS).split("\n")).toHaveLength(3);
    expect(toTimestampedText(SEGS)).toContain("[01:05] one minute in");
  });
});

describe("paragraphs", () => {
  it("splits on long pauses", () => {
    const paras = toParagraphs([
      { start: 0, dur: 1, text: "one" },
      { start: 1, dur: 1, text: "two" },
      { start: 10, dur: 1, text: "three" },
    ]);
    expect(paras).toEqual(["one two", "three"]);
  });
});

describe("stats", () => {
  it("counts words and reading time", () => {
    expect(countWords("  hello   world ")).toBe(2);
    expect(countWords("")).toBe(0);
    expect(readingTime("word ".repeat(200))).toBe("1 min read");
    expect(readingTime("word ".repeat(450))).toBe("2 min read");
  });
  it("formats counts and durations", () => {
    expect(formatCount(999)).toBe("999");
    expect(formatCount(1500)).toBe("1.5K");
    expect(formatCount(2_300_000)).toBe("2.3M");
    expect(formatCount(null)).toBe("—");
    expect(formatDuration(61)).toBe("1:01");
    expect(formatDuration(3661)).toBe("1:01:01");
    expect(formatDuration(0)).toBe("—");
  });
  it("slugifies filenames", () => {
    expect(slugifyFilename("Hello, World! (2024)")).toBe("hello-world-2024");
    expect(slugifyFilename("!!!")).toBe("captions");
  });
});
