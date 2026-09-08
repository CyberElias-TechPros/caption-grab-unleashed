/**
 * Pure transcript helpers — no Worker APIs, fully unit-testable.
 * Imported by the Worker entrypoint (`index.ts`).
 */

export interface TranscriptSegment {
  start: number;
  dur: number;
  text: string;
}

export interface ResolvedTrack {
  baseUrl: string;
  languageCode: string;
  name: string;
  kind: "manual" | "auto";
  translatable: boolean;
}

export function decodeEntities(input: string): string {
  return input
    .replace(/&#(\d+);/g, (_, n) => {
      try {
        return String.fromCodePoint(Number(n));
      } catch {
        return _;
      }
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => {
      try {
        return String.fromCodePoint(parseInt(n, 16));
      } catch {
        return _;
      }
    })
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

export function cleanText(input: string): string {
  return decodeEntities(input.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
}

interface Json3Event {
  tStartMs?: number;
  dDurationMs?: number;
  segs?: Array<{ utf8?: string }>;
}

export function parseJson3(payload: string): TranscriptSegment[] {
  const data = JSON.parse(payload) as { events?: Json3Event[] };
  const segments: TranscriptSegment[] = [];
  for (const ev of data.events || []) {
    if (!ev.segs || ev.segs.length === 0) continue;
    const text = cleanText(ev.segs.map((s) => s.utf8 || "").join(""));
    if (!text) continue;
    segments.push({
      start: (ev.tStartMs || 0) / 1000,
      dur: (ev.dDurationMs || 0) / 1000,
      text,
    });
  }
  return segments;
}

export function parseSrv3(xml: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const re = /<text[^>]*start="([\d.]+)"[^>]*dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const text = cleanText(m[3] || "");
    if (!text) continue;
    segments.push({ start: Number(m[1]), dur: Number(m[2]), text });
  }
  return segments;
}

const VTT_TS = /(\d+:)?(\d{1,2}):(\d{2})\.(\d{3})/;

function vttToSeconds(s: string): number {
  const m = VTT_TS.exec(s);
  if (!m) return 0;
  const h = m[1] ? parseInt(m[1], 10) : 0;
  return h * 3600 + parseInt(m[2], 10) * 60 + parseInt(m[3], 10) + parseInt(m[4], 10) / 1000;
}

export function parseVtt(vtt: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
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

export function selectTrack(
  tracks: ResolvedTrack[],
  requestedLang: string,
): { track: ResolvedTrack; servedLang: string; translated: boolean } {
  const base = requestedLang.split("-")[0].toLowerCase();
  const exact =
    tracks.find((t) => t.languageCode.toLowerCase() === requestedLang.toLowerCase()) ||
    tracks.find((t) => t.languageCode.toLowerCase().split(/[-_]/)[0] === base);

  if (exact) return { track: exact, servedLang: exact.languageCode, translated: false };

  const manual = tracks.filter((t) => t.kind === "manual");
  const fallback =
    manual.find((t) => t.languageCode.toLowerCase().startsWith("en")) ||
    manual[0] ||
    tracks.find((t) => t.languageCode.toLowerCase().startsWith("en")) ||
    tracks[0];

  if (!fallback) throw new Error("NO_TRACKS");
  return { track: fallback, servedLang: fallback.languageCode, translated: fallback.translatable };
}

export function withTranslation(baseUrl: string, targetLang: string): string {
  const joiner = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${joiner}tlang=${encodeURIComponent(targetLang.split("-")[0])}`;
}

export function assembleText(segments: TranscriptSegment[]): string {
  return segments.map((s) => s.text).join(" ").replace(/\s+/g, " ").trim();
}
