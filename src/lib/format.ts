/** Transcript formatting: timestamps, SRT/VTT export, stats. */

import type { TranscriptSegment } from "./api";

export function formatClock(totalSeconds: number, opts: { hours?: boolean; millis?: boolean } = {}): string {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 1000);
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  const base = opts.hours || h > 0 ? `${String(h).padStart(2, "0")}:${mm}:${ss}` : `${mm}:${ss}`;
  if (!opts.millis) return base;
  return `${base},${String(ms).padStart(3, "0")}`;
}

export function formatSrtTimestamp(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

export function formatVttTimestamp(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 1000);
  const head = h > 0 ? `${String(h).padStart(2, "0")}:` : "";
  return `${head}${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

export function toSrt(segments: TranscriptSegment[]): string {
  return (
    segments
      .map((s, i) => {
        const end = s.start + (s.dur > 0 ? s.dur : 2);
        return `${i + 1}\n${formatSrtTimestamp(s.start)} --> ${formatSrtTimestamp(end)}\n${s.text}`;
      })
      .join("\n\n") + "\n"
  );
}

export function toVtt(segments: TranscriptSegment[]): string {
  return (
    "WEBVTT\n\n" +
    segments
      .map((s) => {
        const end = s.start + (s.dur > 0 ? s.dur : 2);
        return `${formatVttTimestamp(s.start)} --> ${formatVttTimestamp(end)}\n${s.text}`;
      })
      .join("\n\n") +
    "\n"
  );
}

export function toPlainText(segments: TranscriptSegment[]): string {
  return segments.map((s) => s.text).join(" ").replace(/\s+/g, " ").trim();
}

export function toTimestampedText(segments: TranscriptSegment[]): string {
  return segments.map((s) => `[${formatClock(s.start)}] ${s.text}`).join("\n");
}

export function toJson(segments: TranscriptSegment[]): string {
  return JSON.stringify(segments, null, 2);
}

/** Group segments into readable paragraphs by pause length / size. */
export function toParagraphs(segments: TranscriptSegment[], maxChars = 480): string[] {
  const paragraphs: string[] = [];
  let current = "";
  let prevEnd = 0;
  for (const seg of segments) {
    const gap = seg.start - prevEnd;
    if (current && (gap > 2.5 || current.length + seg.text.length + 1 > maxChars)) {
      paragraphs.push(current.trim());
      current = "";
    }
    current += (current ? " " : "") + seg.text;
    prevEnd = seg.start + seg.dur;
  }
  if (current.trim()) paragraphs.push(current.trim());
  return paragraphs;
}

export function countWords(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return text.trim() ? words.length : 0;
}

export function readingTime(text: string, wpm = 200): string {
  const minutes = Math.max(1, Math.round(countWords(text) / wpm));
  return minutes === 1 ? "1 min read" : `${minutes} min read`;
}

export function formatCount(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return "—";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Download helper with proper cleanup. Clipboard helper with legacy fallback. */
export function downloadFile(content: string, filename: string, mime = "text/plain;charset=utf-8"): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts / older browsers.
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

export function slugifyFilename(input: string, fallback = "captions"): string {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || fallback;
}
