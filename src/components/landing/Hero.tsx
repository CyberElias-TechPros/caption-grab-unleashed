import React from "react";
import { ArrowDown, ArrowRight, Captions, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Extractor from "@/components/Extractor";
import TranscriptTicker from "@/components/landing/TranscriptTicker";
import Magnetic from "@/components/motion/Magnetic";
import { MaskLines, Reveal } from "@/components/motion/Reveal";
import { scrollToId } from "@/lib/motion";

const TRUST_POINTS = ["No sign-up", "No API key", "No watermarks", "Free forever"];

const Hero: React.FC = () => (
  <section className="relative overflow-hidden pt-10 sm:pt-16" aria-label="Introduction">
    <div className="container grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
      {/* ── Copy ─────────────────────────────────────────────────────── */}
      <div>
        <Reveal y={12} blur={4}>
          <a
            href="#how-it-works"
            className="group inline-flex items-center gap-2.5 rounded-full border border-border/70 bg-card/50 py-1.5 pl-1.5 pr-4 backdrop-blur-md transition-colors duration-300 hover:border-primary/50"
          >
            <span className="caption-button !rounded-full !px-2.5 !py-1 !text-[0.6rem] !tracking-ultra uppercase">
              New
            </span>
            <span className="text-xs font-medium text-foreground/80">
              No API key required — extraction just works
            </span>
            <ArrowRight
              className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </a>
        </Reveal>

        <MaskLines
          className="mt-7 font-display text-display-md"
          stagger={115}
          lines={[
            <>Every word,</>,
            <>
              <span className="font-editorial italic text-gradient-pan">timestamped.</span>
            </>,
          ]}
        />

        <Reveal delay={420} y={20}>
          <p className="mt-6 max-w-lg text-[1.02rem] leading-relaxed text-muted-foreground sm:text-[1.1rem]">
            Paste a YouTube link and get a clean, searchable transcript with real timecodes —
            read it, jump the video to any line, and export it as{" "}
            <span className="font-mono-label text-[0.85em] text-foreground/90">SRT</span>,{" "}
            <span className="font-mono-label text-[0.85em] text-foreground/90">VTT</span>,{" "}
            <span className="font-mono-label text-[0.85em] text-foreground/90">TXT</span> or{" "}
            <span className="font-mono-label text-[0.85em] text-foreground/90">JSON</span>.
          </p>
        </Reveal>

        <Reveal delay={520} y={16}>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Magnetic strength={10}>
              <Button
                size="lg"
                className="caption-button btn-shine h-12 rounded-2xl px-7 text-[0.95rem]"
                onClick={() => scrollToId("extractor")}
              >
                <Sparkles className="h-4 w-4" /> Grab a transcript
              </Button>
            </Magnetic>
            <Magnetic strength={8}>
              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-2xl border-border/70 bg-card/40 px-6 text-[0.95rem] backdrop-blur-md transition-all duration-300 hover:border-primary/50 hover:bg-card/70"
                onClick={() => scrollToId("features")}
              >
                <Captions className="h-4 w-4" /> See how it works
              </Button>
            </Magnetic>
          </div>
        </Reveal>

        <Reveal delay={620} y={12}>
          <ul className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
            {TRUST_POINTS.map((point) => (
              <li
                key={point}
                className="font-mono-label inline-flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground"
              >
                <span
                  className="h-1 w-1 rounded-full bg-gradient-to-r from-primary to-brand-3"
                  aria-hidden="true"
                />
                {point}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      {/* ── Live transcript demo ─────────────────────────────────────── */}
      <Reveal delay={260} y={34} blur={6} className="relative">
        <div
          className="pointer-events-none absolute -inset-10 -z-10 rounded-[3rem] opacity-70 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, hsl(var(--brand-1) / 0.32), hsl(var(--brand-3) / 0.14) 60%, transparent)",
          }}
          aria-hidden="true"
        />
        <div className="perspective-1200">
          <div
            className="animate-float-slow"
            style={{ transform: "rotateX(3deg) rotateY(-5deg) rotateZ(-0.6deg)" }}
          >
            <TranscriptTicker />
          </div>
        </div>

        {/* Floating export chip */}
        <div
          className="animate-float absolute -bottom-6 -left-4 hidden rounded-2xl border border-border/70 bg-card/85 px-4 py-3 backdrop-blur-xl sm:block"
          style={{ animationDelay: "-2s", boxShadow: "var(--shadow-glow)" }}
        >
          <p className="font-mono-label text-[0.6rem] uppercase tracking-ultra text-muted-foreground">
            downloaded
          </p>
          <p className="num mt-1 text-sm font-semibold text-foreground">
            transcript-en<span className="text-primary">.srt</span>
          </p>
        </div>
      </Reveal>
    </div>

    {/* ── The extractor stage ────────────────────────────────────────── */}
    <div id="extractor" className="container relative mt-24 max-w-4xl scroll-mt-24">
      <Reveal y={30} blur={6}>
        <div className="mb-5 flex items-center justify-center gap-3">
          <span className="hairline w-16" aria-hidden="true" />
          <span className="font-mono-label text-[0.62rem] uppercase tracking-ultra text-muted-foreground">
            The extractor
          </span>
          <span className="hairline w-16" aria-hidden="true" />
        </div>

        <div className="relative">
          <div
            className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] opacity-60 blur-3xl"
            style={{
              background:
                "radial-gradient(60% 60% at 50% 40%, hsl(var(--brand-2) / 0.3), hsl(var(--brand-3) / 0.12) 55%, transparent 78%)",
            }}
            aria-hidden="true"
          />
          <Extractor />
        </div>
      </Reveal>

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={() => scrollToId("features")}
          className="group inline-flex items-center gap-2.5 rounded-full border border-border/60 bg-card/40 px-4 py-2 backdrop-blur-md transition-colors duration-300 hover:border-primary/50"
        >
          <span className="font-mono-label text-[0.62rem] uppercase tracking-ultra text-muted-foreground transition-colors group-hover:text-foreground">
            Scroll to explore
          </span>
          <ArrowDown
            className="h-3.5 w-3.5 text-primary transition-transform duration-300 group-hover:translate-y-0.5"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  </section>
);

export default Hero;
