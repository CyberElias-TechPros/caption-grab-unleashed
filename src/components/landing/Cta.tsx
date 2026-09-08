import React from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const Cta: React.FC = () => (
  <section className="container mt-24" aria-label="Get started">
    <div
      data-reveal
      className="relative overflow-hidden rounded-[2rem] border border-primary/25 bg-gradient-to-br from-primary/15 via-accent/10 to-pink-500/10 p-8 text-center sm:p-14"
    >
      <div
        className="animate-gradient-pan pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(600px 200px at 20% 0%, rgba(99,91,255,0.35), transparent), radial-gradient(600px 200px at 80% 100%, rgba(225,61,160,0.3), transparent)",
        }}
        aria-hidden="true"
      />
      <div className="relative">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-background/60 px-3 py-1 text-xs font-semibold text-primary backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" /> Free forever · No sign-up
        </p>
        <h2 className="mx-auto mt-4 max-w-xl font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Stop scrubbing timelines. <span className="text-gradient">Start reading videos.</span>
        </h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Your next transcript is one paste away. Try it now — it takes about ten seconds.
        </p>
        <Button
          size="lg"
          className="caption-button btn-shine mt-6 h-12 rounded-2xl px-8 text-base"
          onClick={() => document.getElementById("extractor")?.scrollIntoView({ behavior: "smooth" })}
        >
          <ArrowUp className="h-4 w-4" /> Grab a transcript
        </Button>
      </div>
    </div>
  </section>
);

export default Cta;
