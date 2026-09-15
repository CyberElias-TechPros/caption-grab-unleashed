import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Cinematic route transition.
 *
 * Two things happen at once: thin letterbox bars snap closed and open (the
 * "cut" between scenes), and a light pass sweeps across the frame. The new
 * route's content animates in underneath with `.page-enter`.
 */
const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const [sweeping, setSweeping] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (prefersReducedMotion()) return;

    setSweeping(true);
    const t = setTimeout(() => setSweeping(false), 780);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[80]" aria-hidden="true">
        {/* Letterbox */}
        <span
          className={cn(
            "absolute inset-x-0 top-0 origin-top bg-background transition-transform ease-cinematic",
            sweeping ? "h-[7vh] translate-y-0" : "h-[7vh] -translate-y-full",
          )}
          style={{ transitionDuration: "420ms" }}
        />
        <span
          className={cn(
            "absolute inset-x-0 bottom-0 origin-bottom bg-background transition-transform ease-cinematic",
            sweeping ? "h-[7vh] translate-y-0" : "h-[7vh] translate-y-full",
          )}
          style={{ transitionDuration: "420ms" }}
        />
        {/* Light pass */}
        <span
          className={cn(
            "absolute inset-y-0 w-1/2 transition-transform ease-expo",
            sweeping ? "translate-x-[220%]" : "-translate-x-[160%]",
          )}
          style={{
            background:
              "linear-gradient(100deg, transparent, hsl(var(--brand-1) / 0.10) 38%, hsl(0 0% 100% / 0.14) 50%, hsl(var(--brand-3) / 0.10) 62%, transparent)",
            filter: "blur(20px)",
            transitionDuration: "780ms",
          }}
        />
      </div>
      <div key={pathname} className="page-enter">
        {children}
      </div>
    </>
  );
};

export default PageTransition;
