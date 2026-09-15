import React from "react";
import { ArrowUp, Github, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Magnetic from "@/components/motion/Magnetic";
import { MaskLines, Reveal } from "@/components/motion/Reveal";
import { scrollToId } from "@/lib/motion";

const Cta: React.FC = () => (
  <section className="container mt-32" aria-label="Get started">
    <Reveal y={30} blur={6}>
      <div className="panel-raised relative overflow-hidden px-6 py-16 text-center sm:px-14 sm:py-24">
        {/* Layered light */}
        <div
          className="animate-gradient-pan pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(50% 60% at 18% 0%, hsl(var(--brand-1) / 0.4), transparent 70%)," +
              "radial-gradient(46% 55% at 84% 100%, hsl(var(--brand-3) / 0.34), transparent 70%)," +
              "radial-gradient(60% 50% at 50% 50%, hsl(var(--brand-2) / 0.16), transparent 75%)",
            backgroundSize: "180% 180%",
          }}
          aria-hidden="true"
        />
        {/* Slow orbit ring */}
        <div
          className="animate-spin-slow pointer-events-none absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10"
          aria-hidden="true"
        >
          <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-brand-3 shadow-[0_0_18px_hsl(var(--brand-3))]" />
        </div>

        <div className="relative">
          <Reveal y={12}>
            <p className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3.5 py-1.5 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span className="font-mono-label text-[0.62rem] uppercase tracking-ultra text-muted-foreground">
                Free forever · No sign-up
              </span>
            </p>
          </Reveal>

          <MaskLines
            className="mx-auto mt-7 max-w-2xl font-display text-display-sm"
            delay={80}
            lines={[
              <>Stop scrubbing timelines.</>,
              <>
                <span className="font-editorial italic text-gradient-pan">Start reading video.</span>
              </>,
            ]}
          />

          <Reveal delay={360} y={16}>
            <p className="mx-auto mt-5 max-w-md text-muted-foreground">
              Your next transcript is one paste away. It usually takes about ten seconds.
            </p>
          </Reveal>

          <Reveal delay={440} y={14}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Magnetic strength={12}>
                <Button
                  size="lg"
                  className="caption-button btn-shine h-13 rounded-2xl px-8 text-base"
                  onClick={() => scrollToId("extractor")}
                >
                  <ArrowUp className="h-4 w-4" /> Grab a transcript
                </Button>
              </Magnetic>
              <Magnetic strength={8}>
                <Button asChild size="lg" variant="outline" className="h-13 rounded-2xl border-border/70 bg-background/50 px-6 backdrop-blur">
                  <a
                    href="https://github.com/CyberElias-TechPros/caption-grab-unleashed"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="h-4 w-4" /> Read the source
                  </a>
                </Button>
              </Magnetic>
            </div>
          </Reveal>
        </div>
      </div>
    </Reveal>
  </section>
);

export default Cta;
