import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackgroundFX from "@/components/BackgroundFX";
import { MaskLines, Reveal } from "@/components/motion/Reveal";

export interface LegalSection {
  title: string;
  body: string[];
}

/** Shared art-directed layout for the legal pages. */
const LegalPage: React.FC<{
  eyebrow: string;
  title: string;
  updated: string;
  intro?: string;
  sections: LegalSection[];
}> = ({ eyebrow, title, updated, intro, sections }) => (
  <div className="flex min-h-screen flex-col">
    <BackgroundFX />
    <Header />
    <main className="container max-w-3xl flex-1 py-16 sm:py-24">
      <Reveal y={12}>
        <p className="font-mono-label text-[0.62rem] uppercase tracking-ultra text-primary">
          {eyebrow}
        </p>
      </Reveal>

      <MaskLines className="mt-4 font-display text-display-sm" lines={[<>{title}</>]} />

      <Reveal delay={160} y={14}>
        <p className="num mt-3 text-xs text-muted-foreground">Last updated: {updated}</p>
      </Reveal>

      {intro && (
        <Reveal delay={220} y={16}>
          <p className="mt-6 border-l-2 border-primary/40 pl-5 text-[1.02rem] leading-relaxed text-foreground/85">
            {intro}
          </p>
        </Reveal>
      )}

      <div className="hairline mt-10" aria-hidden="true" />

      <div className="mt-10 space-y-12">
        {sections.map((s, i) => (
          <Reveal key={s.title} as="section" y={22} delay={i * 40}>
            <h2 className="flex items-baseline gap-3 font-display text-[1.35rem] font-bold tracking-tight">
              <span className="num text-[0.68rem] font-medium text-primary/70">
                {String(i + 1).padStart(2, "0")}
              </span>
              {s.title}
            </h2>
            {s.body.map((p, j) => (
              <p key={j} className="mt-3 leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
          </Reveal>
        ))}
      </div>
    </main>
    <Footer />
  </div>
);

export default LegalPage;
