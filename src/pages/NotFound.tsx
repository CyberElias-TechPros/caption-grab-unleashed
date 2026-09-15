import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Home, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackgroundFX from "@/components/BackgroundFX";
import Magnetic from "@/components/motion/Magnetic";
import { MaskLines, Reveal } from "@/components/motion/Reveal";

const SUGGESTIONS = [
  { label: "Open the extractor", href: "/#extractor" },
  { label: "Read the features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "About this project", href: "/about" },
];

const NotFound: React.FC = () => (
  <div className="flex min-h-screen flex-col">
    <BackgroundFX />
    <Header />
    <main className="container flex flex-1 flex-col items-center justify-center py-24 text-center">
      <Reveal y={14}>
        <p className="font-mono-label inline-flex items-center gap-2 text-[0.62rem] uppercase tracking-ultra text-muted-foreground">
          <SearchX className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          Route not found
        </p>
      </Reveal>

      {/* Giant 404 with a light pass across it */}
      <div className="relative mt-6">
        <p className="font-display text-[clamp(6rem,22vw,14rem)] font-bold leading-none tracking-tighter text-foreground/[0.06]">
          404
        </p>
        <p
          className="absolute inset-0 font-display text-[clamp(6rem,22vw,14rem)] font-bold leading-none tracking-tighter text-gradient-pan"
          aria-hidden="true"
          style={{
            WebkitMaskImage:
              "linear-gradient(100deg, transparent 38%, black 50%, transparent 62%)",
            maskImage: "linear-gradient(100deg, transparent 38%, black 50%, transparent 62%)",
            backgroundSize: "250% 250%",
          }}
        >
          404
        </p>
      </div>

      <MaskLines
        className="mt-4 font-display text-display-xs"
        lines={[
          <>This page went</>,
          <>
            <span className="font-editorial italic text-gradient">off-script.</span>
          </>,
        ]}
      />

      <Reveal delay={260} y={16}>
        <p className="mx-auto mt-5 max-w-sm text-muted-foreground">
          The link you followed doesn't exist or has moved. Let's get you back to extracting
          transcripts.
        </p>
      </Reveal>

      <Reveal delay={340} y={14}>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Magnetic strength={10}>
            <Button asChild size="lg" className="caption-button btn-shine rounded-2xl">
              <Link to="/">
                <Home className="h-4 w-4" aria-hidden="true" /> Back to home
              </Link>
            </Button>
          </Magnetic>
          <Magnetic strength={8}>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-2xl border-border/70 bg-card/40 backdrop-blur-md"
            >
              <Link to="/#extractor">Open the extractor</Link>
            </Button>
          </Magnetic>
        </div>
      </Reveal>

      <Reveal delay={420} y={12}>
        <ul className="mt-12 flex flex-wrap items-center justify-center gap-2">
          {SUGGESTIONS.map((s) => (
            <li key={s.label}>
              <Link
                to={s.href}
                className="group inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/40 px-3.5 py-1.5 text-xs text-muted-foreground backdrop-blur-sm transition-all duration-300 hover:-translate-y-px hover:border-primary/50 hover:text-foreground"
              >
                {s.label}
                <ArrowRight
                  className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>
    </main>
    <Footer />
  </div>
);

export default NotFound;
