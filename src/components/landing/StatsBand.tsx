import React from "react";
import CountUp from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";

const STATS = [
  { value: 170, suffix: "+", label: "Caption languages", sub: "whatever the video offers" },
  { value: 5, suffix: "", label: "Export formats", sub: "srt · vtt · txt · json · timed" },
  { value: 0, suffix: "", label: "API keys needed", sub: "no accounts, no quotas" },
  { value: 10, suffix: "s", label: "Typical extraction", sub: "edge-cached and fast" },
];

/** A quiet band of numbers between the loud sections. */
const StatsBand: React.FC = () => (
  <section className="container mt-32" aria-label="By the numbers">
    <div className="hairline" aria-hidden="true" />

    <div className="grid grid-cols-2 gap-px lg:grid-cols-4">
      {STATS.map((stat, i) => (
        <Reveal
          key={stat.label}
          delay={i * 90}
          y={20}
          className="group relative px-2 py-10 text-center lg:px-6"
        >
          <p className="font-display text-[clamp(2.25rem,6vw,3.5rem)] font-bold leading-none tracking-tight">
            <span className="text-gradient">
              <CountUp value={stat.value} suffix={stat.suffix} />
            </span>
          </p>
          <p className="mt-3 text-sm font-semibold text-foreground">{stat.label}</p>
          <p className="font-mono-label mt-1.5 text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">
            {stat.sub}
          </p>
          <span
            className="pointer-events-none absolute inset-x-6 bottom-4 h-px scale-x-0 bg-gradient-to-r from-transparent via-primary/60 to-transparent transition-transform duration-700 ease-cinematic group-hover:scale-x-100"
            aria-hidden="true"
          />
        </Reveal>
      ))}
    </div>

    <div className="hairline" aria-hidden="true" />
  </section>
);

export default StatsBand;
