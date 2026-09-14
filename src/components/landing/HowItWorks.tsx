import React, { useEffect, useRef, useState } from "react";
import { ClipboardPaste, Download, Languages } from "lucide-react";
import { Reveal, SectionHeading } from "@/components/motion/Reveal";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: ClipboardPaste,
    title: "Paste the link",
    body: "Any public video works — long-form, Shorts, podcasts, lectures, live replays. The parser validates the id the moment you stop typing and pulls the video's metadata.",
    meta: ["watch · shorts · live · embed", "id validated as you type", "metadata in ~400 ms"],
  },
  {
    icon: Languages,
    title: "Choose the track",
    body: "Every caption track on the video is listed with its language and whether it was written by the creator or generated automatically. Pick one, or let auto-translate bridge the gap.",
    meta: ["manual vs auto-labelled", "one click to switch", "smart translate fallback"],
  },
  {
    icon: Download,
    title: "Read, search, export",
    body: "You get clean, timestamped segments. Search them, jump the player to any line, then copy or download in whichever format your tools already speak.",
    meta: ["in-transcript search", "click a timecode to seek", "srt · vtt · txt · json"],
  },
];

/* ── Step visuals ──────────────────────────────────────────────────────── */

const StepVisual: React.FC<{ index: number }> = ({ index }) => {
  if (index === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-3.5 py-3">
          <ClipboardPaste className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="num truncate text-sm text-foreground/90">
            https://www.youtube.com/watch?v=8jPQjjsBbIc
          </span>
          <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.62rem] font-semibold text-emerald-400">
            valid id
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[72, 92, 58].map((w, i) => (
            <span
              key={i}
              className="animate-shimmer h-2 rounded-full bg-foreground/10"
              style={{ width: `${w}%`, backgroundSize: "200% 100%" }}
            />
          ))}
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 p-3">
          <span className="aspect-video w-24 shrink-0 rounded-lg bg-gradient-to-br from-brand-1/40 via-brand-2/30 to-brand-3/40" />
          <span className="min-w-0">
            <span className="block h-2.5 w-4/5 rounded-full bg-foreground/15" />
            <span className="mt-2 block h-2 w-2/5 rounded-full bg-foreground/10" />
            <span className="num mt-2 block text-[0.62rem] text-muted-foreground">
              128,400 views · 1:42
            </span>
          </span>
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="flex flex-wrap gap-2">
        {[
          { l: "English", k: "Manual", on: true },
          { l: "Spanish", k: "Manual" },
          { l: "French", k: "Auto" },
          { l: "German", k: "Auto" },
          { l: "Japanese", k: "Auto" },
          { l: "Portuguese", k: "Auto" },
        ].map((t) => (
          <span
            key={t.l}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
              t.on
                ? "border-primary/70 bg-primary/12 text-foreground shadow-[0_0_0_1px_hsl(var(--primary)/0.4)]"
                : "border-border/60 bg-background/50 text-muted-foreground",
            )}
          >
            {t.l}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[0.58rem] font-semibold",
                t.k === "Auto"
                  ? "bg-amber-500/15 text-amber-400"
                  : "bg-emerald-500/15 text-emerald-400",
              )}
            >
              {t.k}
            </span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {[
        ["00:00", "For most of the twentieth century, captions were an afterthought."],
        ["00:04", "They were designed for people who could not hear at all."],
        ["00:09", "And then something strange happened online."],
      ].map(([t, text], i) => (
        <div key={t} className={cn("segment-row", i === 1 && "bg-primary/10")}>
          <span className="num mt-[3px] rounded-md bg-primary/10 px-2 py-1 text-[0.66rem] font-semibold text-primary">
            {t}
          </span>
          <p className="text-[0.85rem] leading-relaxed text-foreground/85">
            {text.split(" ").map((w, j) =>
              w.replace(/[.,]/g, "") === "strange" ? (
                <mark key={j}>{w} </mark>
              ) : (
                <React.Fragment key={j}>{w} </React.Fragment>
              ),
            )}
          </p>
        </div>
      ))}
      <div className="mt-3 flex flex-wrap gap-2">
        {["srt", "vtt", "txt", "json"].map((f) => (
          <span
            key={f}
            className="num rounded-lg bg-primary/10 px-2.5 py-1.5 text-[0.68rem] font-semibold text-primary"
          >
            .{f}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ── Section ───────────────────────────────────────────────────────────── */

const HowItWorks: React.FC = () => {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<Array<HTMLLIElement | null>>([]);

  useEffect(() => {
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const i = Number((entry.target as HTMLElement).dataset.step);
            if (!Number.isNaN(i)) setActive(i);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    stepRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section id="how-it-works" className="container mt-32 scroll-mt-24" aria-label="How it works">
      <SectionHeading
        index="02"
        eyebrow="The flow"
        title={
          <>
            Link to transcript in{" "}
            <span className="font-editorial italic text-gradient">three moves</span>
          </>
        }
      />

      <div className="mt-16 grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
        {/* Sticky visual */}
        <div className="hidden lg:block">
          <div className="sticky top-1/2 -translate-y-1/2">
            <div className="panel-raised relative h-[26rem] overflow-hidden p-7">
              <div
                className="pointer-events-none absolute inset-0 opacity-60"
                style={{
                  background:
                    "radial-gradient(70% 60% at 50% 0%, hsl(var(--brand-1) / 0.16), transparent 70%)",
                }}
                aria-hidden="true"
              />
              <div className="relative flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <span className="num text-[4.5rem] font-bold leading-none text-foreground/[0.07]">
                    0{active + 1}
                  </span>
                  <span className="font-mono-label text-[0.62rem] uppercase tracking-ultra text-muted-foreground">
                    step {active + 1} / {STEPS.length}
                  </span>
                </div>

                <div className="relative mt-auto flex-1">
                  {STEPS.map((_, i) => (
                    <div
                      key={i}
                      aria-hidden={i !== active}
                      className={cn(
                        "absolute inset-x-0 bottom-0 transition-all duration-700 ease-cinematic",
                        i === active
                          ? "translate-y-0 opacity-100 blur-0"
                          : i < active
                            ? "-translate-y-4 opacity-0 blur-[3px]"
                            : "translate-y-4 opacity-0 blur-[3px]",
                      )}
                    >
                      <StepVisual index={i} />
                    </div>
                  ))}
                </div>

                {/* Progress rail */}
                <div className="mt-6 flex gap-1.5" aria-hidden="true">
                  {STEPS.map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-0.5 flex-1 rounded-full transition-all duration-500",
                        i <= active ? "bg-gradient-to-r from-primary to-brand-3" : "bg-foreground/10",
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrolling steps */}
        <ol className="space-y-6 lg:space-y-0">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = active === i;
            return (
              <li
                key={step.title}
                data-step={i}
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
                className="lg:flex lg:min-h-[70vh] lg:items-center"
              >
                <Reveal y={28} className="w-full">
                  <div
                    className={cn(
                      "panel p-7 transition-all duration-700 ease-cinematic lg:p-9",
                      isActive
                        ? "border-primary/40 shadow-[0_30px_90px_-40px_hsl(var(--brand-1)/0.6)]"
                        : "opacity-70",
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white transition-transform duration-500",
                          isActive && "scale-110",
                        )}
                        style={{
                          backgroundImage:
                            "linear-gradient(135deg, hsl(var(--brand-1)), hsl(var(--brand-3)))",
                          boxShadow: "0 12px 32px -14px hsl(var(--brand-2) / 0.95)",
                        }}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="font-mono-label text-[0.62rem] uppercase tracking-ultra text-muted-foreground">
                        Step 0{i + 1}
                      </span>
                    </div>

                    <h3 className="mt-5 font-display text-display-xs">{step.title}</h3>
                    <p className="mt-3 max-w-lg leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>

                    <ul className="mt-5 flex flex-wrap gap-2">
                      {step.meta.map((m) => (
                        <li
                          key={m}
                          className="font-mono-label rounded-lg border border-border/60 bg-background/50 px-2.5 py-1.5 text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground"
                        >
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};

export default HowItWorks;
