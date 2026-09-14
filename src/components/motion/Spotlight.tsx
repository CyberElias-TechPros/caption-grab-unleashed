import React, { useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Max tilt in degrees. 0 keeps the light but drops the 3D tilt. */
  tilt?: number;
  glare?: boolean;
}

/**
 * A surface that lights up where you point at it.
 *
 * The pointer position is written to `--mx`/`--my`, consumed by the
 * `.spotlight` gradient in index.css, and to a 3D transform for a subtle tilt
 * with a specular glare that tracks the same point.
 */
const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className,
  tilt = 5,
  glare = true,
  style,
  ...rest
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLSpanElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    el.style.setProperty("--mx", `${(px * 100).toFixed(2)}%`);
    el.style.setProperty("--my", `${(py * 100).toFixed(2)}%`);

    if (tilt > 0 && !prefersReducedMotion()) {
      const rx = (0.5 - py) * tilt * 2;
      const ry = (px - 0.5) * tilt * 2;
      el.style.transform = `perspective(1100px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(0)`;
    }
    if (glareRef.current) glareRef.current.style.opacity = "1";
  };

  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = "";
    if (glareRef.current) glareRef.current.style.opacity = "0";
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn("spotlight preserve-3d", className)}
      style={{ transition: "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)", ...style }}
      {...rest}
    >
      {glare && (
        <span
          ref={glareRef}
          aria-hidden="true"
          className="pointer-events-none rounded-[inherit] opacity-0 transition-opacity duration-500"
          style={{
            // Inline position/z-index so no utility can be overridden.
            position: "absolute",
            inset: 0,
            zIndex: 3,
            background:
              "radial-gradient(280px circle at var(--mx,50%) var(--my,50%), hsl(0 0% 100% / 0.10), transparent 62%)",
          }}
        />
      )}
      <div className="spotlight-body h-full">{children}</div>
    </div>
  );
};

export default SpotlightCard;
