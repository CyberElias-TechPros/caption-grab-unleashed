import React, { useEffect, useState } from "react";
import { useScrollProgress } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Reading-progress rail pinned to the top of the viewport.
 * Rendered with a transform (no layout thrash) and tinted with the brand ramp.
 */
const ScrollRail: React.FC = () => {
  const progress = useScrollProgress();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(progress > 0.005 && progress < 0.999);
  }, [progress]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[2px]"
      aria-hidden="true"
    >
      <div
        className={cn(
          "h-full origin-left bg-[linear-gradient(90deg,hsl(var(--brand-1)),hsl(var(--brand-2))_55%,hsl(var(--brand-3)))] transition-opacity duration-500",
          visible ? "opacity-100" : "opacity-0",
        )}
        style={{
          transform: `scaleX(${progress})`,
          boxShadow: "0 0 14px hsl(var(--brand-2) / 0.85)",
        }}
      />
    </div>
  );
};

export default ScrollRail;
