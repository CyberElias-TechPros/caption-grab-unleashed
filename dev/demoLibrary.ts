/**
 * Offline demo library — DEV ONLY.
 *
 * The real API path is: browser → Cloudflare Worker → YouTube. That chain needs
 * network access to YouTube. When it is unavailable (local dev without the
 * Worker running, sandboxed CI, offline demos) `vite/devApi.ts` falls back to
 * this library so that every path in the UI is still a working, honest path.
 *
 * Nothing here is impersonated: responses are flagged with `demo: true` and the
 * UI labels them "Demo data". The transcript text below is original placeholder
 * copy written for this repo — no real video transcript is reproduced.
 *
 * The payloads are emitted as real YouTube `json3` timedtext documents and are
 * parsed by the *production* parser (`worker/src/transcript.ts#parseJson3`), so
 * the code path exercised in demo mode is the same one that runs in production.
 */

export interface DemoTrack {
  languageCode: string;
  name: string;
  kind: "manual" | "auto";
  translatable: boolean;
}

export interface DemoVideo {
  videoId: string;
  title: string;
  author: string;
  lengthSeconds: number;
  viewCount: number;
  caption: string;
  tracks: DemoTrack[];
  lines: string[];
}

/** Roughly 2.6 words per second — close enough to natural speech for demos. */
const WORDS_PER_SECOND = 2.6;

function secondsFor(line: string): number {
  const words = line.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1.4, Math.round((words / WORDS_PER_SECOND) * 10) / 10);
}

/** Turn a script into a real YouTube json3 timedtext document. */
export function toJson3(video: DemoVideo): string {
  let cursor = 0.4;
  const events = video.lines.map((line) => {
    const dur = secondsFor(line);
    const event = {
      tStartMs: Math.round(cursor * 1000),
      dDurationMs: Math.round(dur * 1000),
      segs: [{ utf8: `${line}\n` }],
    };
    cursor += dur + 0.18;
    return event;
  });
  return JSON.stringify({ events });
}

export function demoLengthSeconds(video: DemoVideo): number {
  return Math.round(video.lines.reduce((acc, l) => acc + secondsFor(l) + 0.18, 0.4));
}

const TRACKS: DemoTrack[] = [
  { languageCode: "en", name: "English", kind: "manual", translatable: true },
  { languageCode: "es", name: "Spanish", kind: "manual", translatable: true },
  { languageCode: "fr", name: "French", kind: "auto", translatable: true },
  { languageCode: "de", name: "German", kind: "auto", translatable: true },
  { languageCode: "pt", name: "Portuguese", kind: "auto", translatable: true },
  { languageCode: "ja", name: "Japanese", kind: "auto", translatable: true },
];

/**
 * Original placeholder scripts. Each one is a different shape of video so the
 * UI (long/short, dense/sparse) is exercised.
 */
const LIBRARY: DemoVideo[] = [
  {
    videoId: "8jPQjjsBbIc",
    title: "Demo reel — The quiet power of subtitles",
    author: "CaptionGrab Demo Library",
    lengthSeconds: 0,
    viewCount: 128400,
    caption: "A long-form talk about how captions changed the way we watch.",
    tracks: TRACKS,
    lines: [
      "For most of the twentieth century, captions were an afterthought.",
      "They were designed for people who could not hear the soundtrack at all.",
      "And then something strange happened when video moved online.",
      "People who could hear perfectly well started turning captions on.",
      "On a noisy train, captions are the difference between watching and giving up.",
      "In a shared office, they let you follow a lecture without headphones.",
      "In a second language, they turn listening practice into reading practice.",
      "Researchers found that a large share of viewers now watch with text on by default.",
      "Captions stopped being an accessibility feature and became an interface.",
      "But there is a problem hiding in plain sight.",
      "The words are locked inside the video player.",
      "You cannot search them, quote them, or take them with you.",
      "To find one sentence in an hour of footage, you scrub the timeline.",
      "You listen, you rewind, you listen again, you write it down by hand.",
      "That is a terrible way to work with language.",
      "So we built a small tool that does one job properly.",
      "Give it a link, and it returns every word with its exact timecode.",
      "You can search the whole thing, jump the player to any line, and export it.",
      "Plain text for notes, subtitles for editors, JSON for your own pipeline.",
      "The transcript still belongs to the person who made the video.",
      "We just make it possible to read it the way you read everything else.",
      "That is the whole idea, and it is genuinely that simple.",
    ],
  },
  {
    videoId: "vu6Jp8RIZLU",
    title: "Demo reel — Timed text in one hundred seconds",
    author: "CaptionGrab Demo Library",
    lengthSeconds: 0,
    viewCount: 54210,
    caption: "A fast, dense short about how timed text formats work.",
    tracks: TRACKS.slice(0, 3),
    lines: [
      "Timed text is just a list of sentences with a start and a stop.",
      "SubRip numbers them, then gives two timestamps separated by an arrow.",
      "WebVTT does the same but uses a dot for milliseconds and a header line.",
      "YouTube serves its own format internally, then converts on the way out.",
      "We read the internal format because it is the most precise one available.",
      "Then we hand you whichever shape your tools already understand.",
      "That is it. One hundred seconds. Now go read something.",
    ],
  },
  {
    videoId: "sNhhvQGsMEc",
    title: "Demo reel — Where words go when nobody writes them down",
    author: "CaptionGrab Demo Library",
    lengthSeconds: 0,
    viewCount: 903750,
    caption: "A narrated explainer about spoken language and archives.",
    tracks: TRACKS,
    lines: [
      "Every hour, thousands of hours of video are uploaded to the internet.",
      "Almost all of it is speech, and almost none of it is written down.",
      "A lecture given once to two hundred people reaches two million.",
      "But without text, none of that knowledge can be searched.",
      "An archive you cannot search is not really an archive at all.",
      "It is a warehouse with the lights turned off.",
      "Automatic captioning changed that almost by accident.",
      "It was built so deaf viewers could follow along.",
      "What it actually produced was a searchable index of spoken culture.",
      "Machine transcription is imperfect, and that is worth being honest about.",
      "Names get mangled, technical terms drift, punctuation is invented.",
      "But an imperfect transcript beats no transcript for almost every task.",
      "You can correct a draft. You cannot correct a silence.",
      "So take the words, check the parts that matter, and credit the speaker.",
    ],
  },
];

const GENERIC: Omit<DemoVideo, "videoId"> = {
  title: "Demo reel — Sample transcript",
  author: "CaptionGrab Demo Library",
  lengthSeconds: 0,
  viewCount: 1024,
  caption: "A short sample transcript used when the live API is unreachable.",
  tracks: TRACKS.slice(0, 4),
  lines: LIBRARY[2].lines,
};

export function findDemoVideo(videoId: string): DemoVideo {
  const found = LIBRARY.find((v) => v.videoId === videoId);
  if (found) return { ...found, lengthSeconds: demoLengthSeconds(found) };
  return { ...GENERIC, videoId, lengthSeconds: demoLengthSeconds({ ...GENERIC, videoId }) };
}

export const DEMO_VIDEO_IDS = LIBRARY.map((v) => v.videoId);
