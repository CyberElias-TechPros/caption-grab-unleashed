import React, { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * A soft key-light that trails the cursor with a little lag.
 *
 * It never replaces the native cursor (that would cost accessibility) — it just
 * adds a moving light source so the ambient background feels lit by the viewer.
 * Desktop only: skipped entirely on touch devices and under reduced motion.
 */
const CursorGlow: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;
    if (prefersReducedMotion()) return;

    const el = ref.current;
    if (!el) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;
    let raf = 0;
    let visible = false;

    const loop = () => {
      x += (targetX - x) * 0.09;
      y += (targetY - y) * 0.09;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!visible) {
        visible = true;
        el.style.opacity = "1";
      }
    };

    const onLeave = () => {
      visible = false;
      el.style.opacity = "0";
    };

    raf = requestAnimationFrame(loop);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[65] h-[30rem] w-[30rem] rounded-full opacity-0 transition-opacity duration-700 will-change-transform"
      style={{
        background:
          "radial-gradient(closest-side, hsl(var(--brand-2) / 0.09), hsl(var(--brand-1) / 0.04) 45%, transparent 72%)",
        mixBlendMode: "screen",
      }}
    />
  );
};

export default CursorGlow;
