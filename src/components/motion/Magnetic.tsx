import React, { useCallback, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface MagneticProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Pull strength in px at the edge of the field. */
  strength?: number;
  /** Radius multiplier of the element's own box. */
  radius?: number;
}

/**
 * Magnetic hover: the element drifts toward the pointer while it is inside an
 * invisible field around it, then springs back. The label counter-drifts so
 * the whole thing feels like it has mass.
 */
const Magnetic: React.FC<MagneticProps> = ({
  children,
  className,
  strength = 14,
  radius = 1.6,
  style,
  ...rest
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);

  const setTransform = useCallback((dx: number, dy: number) => {
    if (ref.current) {
      ref.current.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    }
    if (innerRef.current) {
      innerRef.current.style.transform = `translate3d(${dx * 0.28}px, ${dy * 0.28}px, 0)`;
    }
  }, []);

  const onMove = (e: React.PointerEvent<HTMLSpanElement>) => {
    if (prefersReducedMotion()) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const fieldX = (rect.width / 2) * radius;
    const fieldY = (rect.height / 2) * radius;
    const dx = ((e.clientX - cx) / fieldX) * strength;
    const dy = ((e.clientY - cy) / fieldY) * strength;
    setTransform(
      Math.max(-strength, Math.min(strength, dx)),
      Math.max(-strength, Math.min(strength, dy)),
    );
  };

  const onLeave = () => setTransform(0, 0);

  return (
    <span
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn("inline-block will-change-transform", className)}
      style={{ transition: "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)", ...style }}
      {...rest}
    >
      <span
        ref={innerRef}
        className="inline-block"
        style={{ transition: "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
        {children}
      </span>
    </span>
  );
};

export default Magnetic;
