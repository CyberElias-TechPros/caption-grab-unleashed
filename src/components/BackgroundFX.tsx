import React from "react";

/**
 * Ambient, layered page background.
 *
 * Stack, back to front:
 *   1. base wash          — deep vertical gradient
 *   2. perspective grid   — a floor receding to the horizon, masked out at the top
 *   3. aurora orbs        — three drifting light sources, tinted with the brand ramp
 *   4. pointer light      — a soft key-light that follows the cursor (--px/--py)
 *   5. anamorphic beam    — a slow diagonal sweep, like a projector hitting dust
 *   6. scanline           — barely-there horizontal texture
 *   7. film grain         — animated noise, the thing that stops it looking "flat"
 *   8. vignette           — pulls the eye to the centre of the composition
 *
 * Purely decorative: `pointer-events: none`, `aria-hidden`, and every animated
 * layer is disabled under `prefers-reduced-motion` (see index.css).
 */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const BackgroundFX: React.FC = () => (
  <div
    className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    aria-hidden="true"
  >
    {/* 1 — base wash */}
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(120% 90% at 50% -10%, hsl(var(--brand-1) / 0.14), transparent 58%)," +
          "radial-gradient(90% 70% at 92% 8%, hsl(var(--brand-3) / 0.10), transparent 60%)," +
          "linear-gradient(180deg, hsl(var(--background)), hsl(var(--background)) 55%, hsl(var(--vignette) / 0.55))",
      }}
    />

    {/* 2 — perspective grid */}
    <div
      className="absolute inset-x-0 bottom-0 h-[62vh] opacity-[var(--grid-opacity)] [mask-image:linear-gradient(to_top,black,transparent_88%)]"
      style={{
        backgroundImage:
          "linear-gradient(to right, hsl(var(--surface-line) / 0.55) 1px, transparent 1px)," +
          "linear-gradient(to bottom, hsl(var(--surface-line) / 0.55) 1px, transparent 1px)",
        backgroundSize: "68px 68px",
        transform: "perspective(560px) rotateX(66deg) scale(2.1)",
        transformOrigin: "bottom center",
      }}
    />

    {/* 3 — aurora orbs */}
    <div
      className="animate-drift absolute -top-[18rem] left-1/2 h-[42rem] w-[68rem] -translate-x-1/2 rounded-full opacity-[var(--aurora-opacity)] blur-[90px]"
      style={{
        background:
          "radial-gradient(closest-side, hsl(var(--brand-1) / 0.5), hsl(var(--brand-1) / 0.05) 62%, transparent)",
      }}
    />
    <div
      className="animate-drift absolute -left-56 top-[38%] h-[34rem] w-[34rem] rounded-full opacity-[var(--aurora-opacity)] blur-[100px]"
      style={{
        animationDelay: "-7s",
        background:
          "radial-gradient(closest-side, hsl(var(--brand-2) / 0.34), transparent 70%)",
      }}
    />
    <div
      className="animate-drift absolute -right-56 top-[58%] h-[36rem] w-[36rem] rounded-full opacity-[var(--aurora-opacity)] blur-[100px]"
      style={{
        animationDelay: "-13s",
        background:
          "radial-gradient(closest-side, hsl(var(--brand-3) / 0.28), transparent 70%)",
      }}
    />

    {/* 4 — pointer key-light */}
    <div
      className="absolute inset-0 transition-opacity duration-700"
      style={{
        background:
          "radial-gradient(38rem circle at calc(var(--px, 0.5) * 100%) calc(var(--py, 0.5) * 100%), hsl(var(--brand-2) / 0.075), transparent 62%)",
      }}
    />

    {/* 5 — anamorphic beam */}
    <div className="absolute inset-0 overflow-hidden opacity-60">
      <div
        className="animate-beam-sweep absolute -top-1/3 left-0 h-[180%] w-[26%]"
        style={{
          background:
            "linear-gradient(90deg, transparent, hsl(var(--brand-4) / 0.055) 42%, hsl(0 0% 100% / 0.05) 50%, hsl(var(--brand-3) / 0.055) 58%, transparent)",
          filter: "blur(28px)",
        }}
      />
    </div>

    {/* 6 — scanline */}
    <div
      className="absolute inset-0 opacity-[0.16] mix-blend-overlay"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, hsl(var(--foreground) / 0.09) 0px, hsl(var(--foreground) / 0.09) 1px, transparent 1px, transparent 4px)",
      }}
    />

    {/* 7 — film grain */}
    <div
      className="animate-grain-shift absolute -inset-[15%] opacity-[var(--grain-opacity)] mix-blend-soft-light"
      style={{ backgroundImage: GRAIN, backgroundSize: "220px 220px" }}
    />

    {/* 8 — vignette + top glow line */}
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(115% 85% at 50% 40%, transparent 42%, hsl(var(--vignette) / 0.55) 100%)",
      }}
    />
    <div
      className="absolute inset-x-0 top-0 h-px"
      style={{
        background:
          "linear-gradient(90deg, transparent, hsl(var(--brand-1) / 0.7) 30%, hsl(var(--brand-3) / 0.7) 70%, transparent)",
      }}
    />
  </div>
);

export default BackgroundFX;
