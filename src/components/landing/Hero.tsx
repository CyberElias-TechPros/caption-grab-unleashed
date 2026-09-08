import React from "react";
import { ArrowDown, BadgeCheck, Captions, FileDown, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Extractor from "@/components/Extractor";

const TRUST_POINTS = [
  { icon: Zap, label: "Results in seconds" },
  { icon: BadgeCheck, label: "Free forever" },
  { icon: Search, label: "Searchable text" },
  { icon: FileDown, label: "SRT · VTT · TXT" },
];

const Hero: React.FC = () => (
  <section className="relative pt-14 sm:pt-20" aria-label="Introduction">
    <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
      <div data-reveal className="is-visible">
        <a
          href="#how-it-works"
          className="group inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 py-1.5 pl-2 pr-3.5 text-xs font-semibold text-primary transition-colors hover:border-primary/60"
        >
          <span className="rounded-full bg-primary px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-white">
            New
          </span>
          No API key needed anymore — extraction just works
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </a>
      </div>

      <h1
        data-reveal
        style={{ ["--reveal-delay" as string]: "80ms" }}
        className="is-visible mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-6xl"
      >
        Every word of any YouTube video, <span className="text-gradient">grabbed in seconds.</span>
      </h1>

      <p
        data-reveal
        style={{ ["--reveal-delay" as string]: "160ms" }}
        className="is-visible mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
      >
        Paste a link and get a clean, timestamped transcript you can search, copy and export.
        Perfect for students, creators, researchers and the simply curious.
      </p>

      <div
        data-reveal
        style={{ ["--reveal-delay" as string]: "240ms" }}
        className="is-visible mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
      >
        {TRUST_POINTS.map((t) => (
          <span key={t.label} className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80">
            <t.icon className="h-4 w-4 text-primary" /> {t.label}
          </span>
        ))}
      </div>
    </div>

    {/* Extractor */}
    <div id="extractor" className="container mt-10 max-w-4xl scroll-mt-24">
      <div
        data-reveal
        style={{ ["--reveal-delay" as string]: "320ms" }}
        className="is-visible relative"
      >
        <div
          className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-gradient-to-r from-primary/25 via-accent/20 to-pink-500/25 opacity-60 blur-2xl"
          aria-hidden="true"
        />
        <div className="relative">
          <Extractor />
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 rounded-full text-xs text-muted-foreground"
          onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
        >
          <Captions className="h-4 w-4" /> See what else it can do
          <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
        </Button>
      </div>
    </div>
  </section>
);

export default Hero;
