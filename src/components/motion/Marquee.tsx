import React from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  children: React.ReactNode;
  /** Seconds for one full loop. */
  duration?: number;
  reverse?: boolean;
  className?: string;
}

/** Seamless infinite ticker. Content is duplicated so the loop never shows a seam. */
const Marquee: React.FC<MarqueeProps> = ({
  children,
  duration = 44,
  reverse = false,
  className,
}) => (
  <div
    className={cn("marquee marquee-mask relative overflow-hidden", className)}
    style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
  >
    <div
      className="marquee-track"
      style={{ animationDirection: reverse ? "reverse" : "normal" }}
    >
      <div className="flex shrink-0 items-center" aria-hidden="false">
        {children}
      </div>
      <div className="flex shrink-0 items-center" aria-hidden="true">
        {children}
      </div>
    </div>
  </div>
);

export default Marquee;
