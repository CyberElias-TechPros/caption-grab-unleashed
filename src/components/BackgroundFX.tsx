import React from "react";

/** Ambient page background: aurora orbs + grid + vignette. Pure decoration. */
const BackgroundFX: React.FC = () => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
    {/* Grid */}
    <div className="bg-grid bg-grid-fade absolute inset-0 opacity-70 dark:opacity-100" />
    {/* Aurora orbs */}
    <div className="animate-float-slow absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(99,91,255,0.35),transparent)] blur-2xl dark:bg-[radial-gradient(closest-side,rgba(99,91,255,0.28),transparent)]" />
    <div className="animate-float absolute -left-40 top-1/3 h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,rgba(139,61,255,0.22),transparent)] blur-2xl" />
    <div
      className="animate-float absolute -right-40 top-1/2 h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,rgba(225,61,160,0.18),transparent)] blur-2xl"
      style={{ animationDelay: "-3.5s" }}
    />
    {/* Top glow line */}
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
    {/* Vignette for depth in dark mode */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,transparent_40%,hsl(var(--background)/0.6)_100%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,transparent_30%,rgba(4,6,16,0.7)_100%)]" />
  </div>
);

export default BackgroundFX;
