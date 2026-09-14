import React from "react";
import {
  Captions,
  FileDown,
  Globe2,
  History,
  MonitorPlay,
  Search,
  ShieldCheck,
} from "lucide-react";
import SpotlightCard from "@/components/motion/Spotlight";
import { Reveal, SectionHeading } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

const URL_SHAPES = [
  "youtube.com/watch?v=…",
  "youtu.be/…",
  "/shorts/…",
  "/live/…",
  "/embed/…",
  "music.youtube.com/…",
  "bare 11-char id",
];

const FORMATS = [
  { ext: "srt", label: "SubRip" },
  { ext: "vtt", label: "WebVTT" },
  { ext: "txt", label: "Plain" },
  { ext: "json", label: "Structured" },
];

interface Feature {
  icon: React.ElementType;
  title: string;
  body: string;
  span: string;
  accent?: boolean;
  extra?: React.ReactNode;
}

const FEATURES: Feature[] = [
  {
    icon: Captions,
    title: "One link, any shape",
    body: "Watch URLs, Shorts, live replays, embeds, music links and bare ids. Paste anything — the parser figures out the rest before you hit return.",
    span: "lg:col-span-6 lg:row-span-2",
    accent: true,
    extra: (
      <div className="mt-6 flex flex-wrap gap-1.5">
        {URL_SHAPES.map((shape) => (
          <span
            key={shape}
            className="num rounded-lg border border-border/60 bg-background/60 px-2.5 py-1.5 text-[0.68rem] text-muted-foreground transition-colors duration-300 hover:border-primary/50 hover:text-foreground"
          >
            {shape}
          </span>
        ))}
      </div>
    ),
  },
  {
    icon: MonitorPlay,
    title: "True timestamps",
    body: "Every line carries its exact timecode. Click one and the player jumps to that moment.",
    span: "lg:col-span-3",
  },
  {
    icon: Search,
    title: "Search inside the video",
    body: "Find any quote instantly with highlighted matches — no more scrubbing the timeline.",
    span: "lg:col-span-3",
  },
  {
    icon: FileDown,
    title: "Export anywhere",
    body: "Take it with you in the shape your tools already understand.",
    span: "lg:col-span-3",
    extra: (
      <div className="mt-4 flex flex-wrap gap-1.5">
        {FORMATS.map((f) => (
          <span
            key={f.ext}
            className="num inline-flex items-baseline gap-1 rounded-lg bg-primary/10 px-2 py-1 text-[0.68rem] font-semibold text-primary"
          >
            .{f.ext}
            <span className="font-sans text-[0.6rem] font-normal text-muted-foreground">
              {f.label}
            </span>
          </span>
        ))}
      </div>
    ),
  },
  {
    icon: Globe2,
    title: "170+ languages",
    body: "Every track on the video, with smart auto-translate when yours is missing.",
    span: "lg:col-span-3",
  },
  {
    icon: History,
    title: "Private local history",
    body: "Reopen past extractions offline. Everything stays in your browser — nothing is uploaded, ever.",
    span: "lg:col-span-4",
  },
  {
    icon: ShieldCheck,
    title: "No sign-up, no keys",
    body: "No accounts, no YouTube API keys, no quotas to babysit. Open the page and grab captions.",
    span: "lg:col-span-4",
  },
  {
    icon: MonitorPlay,
    title: "Read & watch together",
    body: "A sticky player sits beside the transcript, plus a distraction-free reading mode for long videos.",
    span: "lg:col-span-4",
  },
];

const FeatureCard: React.FC<{ feature: Feature; index: number }> = ({ feature, index }) => {
  const { icon: Icon, title, body, span, accent, extra } = feature;

  return (
    <Reveal delay={(index % 3) * 90} y={26} className={cn("h-full", span)}>
      <SpotlightCard
        tilt={accent ? 2.5 : 3.5}
        className={cn(
          "panel group h-full p-6 transition-transform duration-500 ease-cinematic hover:-translate-y-1",
          accent && "lg:p-8",
        )}
      >
        <div
          className={cn(
            "relative mb-5 flex items-center justify-center rounded-xl text-white ring-1 ring-white/15",
            accent ? "h-12 w-12" : "h-10 w-10",
          )}
          style={{
            backgroundImage:
              "linear-gradient(135deg, hsl(var(--brand-1)), hsl(var(--brand-2)) 55%, hsl(var(--brand-3)))",
            boxShadow: "0 10px 28px -12px hsl(var(--brand-2) / 0.9)",
          }}
        >
          <Icon className={accent ? "h-6 w-6" : "h-5 w-5"} aria-hidden="true" />
        </div>

        <h3
          className={cn(
            "font-display font-bold tracking-tight",
            accent ? "text-display-xs" : "text-[1.05rem]",
          )}
        >
          {title}
        </h3>
        <p
          className={cn(
            "mt-2 leading-relaxed text-muted-foreground",
            accent ? "max-w-md text-[0.98rem]" : "text-sm",
          )}
        >
          {body}
        </p>

        {extra}

        <span
          className="pointer-events-none absolute -bottom-24 -right-16 h-52 w-52 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100"
          style={{
            background: "radial-gradient(closest-side, hsl(var(--brand-2) / 0.28), transparent)",
          }}
          aria-hidden="true"
        />
      </SpotlightCard>
    </Reveal>
  );
};

const Features: React.FC = () => (
  <section id="features" className="container mt-32 scroll-mt-24" aria-label="Features">
    <SectionHeading
      index="01"
      eyebrow="Capabilities"
      title={
        <>
          A transcript studio, <span className="font-editorial italic text-gradient">not a downloader</span>
        </>
      }
      lede="Everything you need to turn hours of video into minutes of reading — and to keep the result."
    />

    <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
      {FEATURES.map((f, i) => (
        <FeatureCard key={f.title} feature={f} index={i} />
      ))}
    </div>
  </section>
);

export default Features;
