import React from "react";
import { ClipboardPaste, Languages, Rocket } from "lucide-react";

const STEPS = [
  {
    icon: ClipboardPaste,
    step: "Step 1",
    title: "Paste a YouTube link",
    body: "Any public video works — long-form, Shorts, podcasts, lectures. We validate the link instantly and fetch its details.",
  },
  {
    icon: Languages,
    step: "Step 2",
    title: "Pick your language",
    body: "See every caption track on the video at a glance — manual or auto-generated — and choose the one you want.",
  },
  {
    icon: Rocket,
    step: "Step 3",
    title: "Read, search & export",
    body: "Get a clean timestamped transcript. Search it, jump the video to any line, then copy or export in one click.",
  },
];

const HowItWorks: React.FC = () => (
  <section id="how-it-works" className="container mt-24 scroll-mt-24" aria-label="How it works">
    <div data-reveal className="mx-auto max-w-2xl text-center">
      <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
        How it works
      </p>
      <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        From link to transcript in <span className="text-gradient">three steps</span>
      </h2>
    </div>

    <ol className="relative mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-3">
      <div
        className="absolute left-[16%] right-[16%] top-12 hidden h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent md:block"
        aria-hidden="true"
      />
      {STEPS.map((s, i) => (
        <li
          key={s.title}
          data-reveal
          style={{ ["--reveal-delay" as string]: `${i * 120}ms` }}
          className="relative rounded-3xl border border-border/60 bg-card/60 p-6 text-center backdrop-blur-sm"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-[0_12px_30px_-10px_rgba(99,91,255,0.8)]">
            <s.icon className="h-6 w-6" />
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-primary">{s.step}</p>
          <h3 className="mt-1.5 font-display text-lg font-bold">{s.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          <span
            className="pointer-events-none absolute right-4 top-3 font-display text-5xl font-bold text-foreground/[0.05]"
            aria-hidden="true"
          >
            {i + 1}
          </span>
        </li>
      ))}
    </ol>
  </section>
);

export default HowItWorks;
