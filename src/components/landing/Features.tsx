import React from "react";
import {
  Captions,
  FileDown,
  Globe2,
  History,
  MonitorPlay,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const FEATURES = [
  {
    icon: ZapIcon,
    title: "One-link extraction",
    body: "Works with watch links, Shorts, live replays, embeds and bare video ids. Paste anything — we figure out the rest.",
  },
  {
    icon: Captions,
    title: "True timestamps",
    body: "Every line carries its exact timecode. Click any timestamp to jump the video straight to that moment.",
  },
  {
    icon: Search,
    title: "Search the video",
    body: "Find any quote or keyword instantly with highlighted in-transcript search — no more scrubbing timelines.",
  },
  {
    icon: FileDown,
    title: "Export anywhere",
    body: "Download as SRT, WebVTT, plain or timestamped text, or structured JSON for your own tools and pipelines.",
  },
  {
    icon: Globe2,
    title: "170+ languages",
    body: "Pick any available caption track, or let smart auto-translate bridge the gap when yours is missing.",
  },
  {
    icon: MonitorPlay,
    title: "Read & watch together",
    body: "A side-by-side player stays in sync with your reading, plus a distraction-free reading mode for long videos.",
  },
  {
    icon: History,
    title: "Private local history",
    body: "Reopen recent extractions offline. Everything stays in your browser — nothing is ever uploaded or tracked.",
  },
  {
    icon: ShieldCheck,
    title: "No sign-up, no keys",
    body: "No accounts, no YouTube API keys, no quotas to manage. Open the page and grab captions. That's the whole deal.",
  },
];

function ZapIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

const Features: React.FC = () => (
  <section id="features" className="container mt-24 scroll-mt-24" aria-label="Features">
    <div data-reveal className="mx-auto max-w-2xl text-center">
      <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
        <Sparkles className="h-3.5 w-3.5" /> Why CaptionGrab
      </p>
      <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        A transcript studio, <span className="text-gradient">not just a downloader</span>
      </h2>
      <p className="mt-3 text-muted-foreground">
        Everything you need to turn hours of video into minutes of reading.
      </p>
    </div>

    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {FEATURES.map((f, i) => (
        <article
          key={f.title}
          data-reveal
          style={{ ["--reveal-delay" as string]: `${(i % 4) * 80}ms` }}
          className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_20px_50px_-20px_rgba(99,91,255,0.55)]"
        >
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl transition-all duration-300 group-hover:bg-primary/25"
            aria-hidden="true"
          />
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary ring-1 ring-primary/25">
            <f.icon className="h-5 w-5" />
          </div>
          <h3 className="mt-4 font-display text-[1.02rem] font-bold">{f.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
        </article>
      ))}
    </div>
  </section>
);

export default Features;
