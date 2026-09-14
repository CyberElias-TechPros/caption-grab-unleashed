import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Route-level scroll behaviour, which React Router does not do for you:
 *   • pathname change without a hash → back to the top
 *   • pathname change *with* a hash, or hash-only change → smooth-scroll there
 *
 * Without this, every `/#extractor` link in the header and footer navigated
 * but never scrolled — a dead-looking interaction on the home page.
 */
const RouteEffects: React.FC = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const smooth = prefersReducedMotion() ? "auto" : ("smooth" as ScrollBehavior);

    if (hash) {
      // Give the destination route a frame to mount before measuring.
      const raf = requestAnimationFrame(() => {
        const el = document.getElementById(hash.slice(1));
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 84;
          window.scrollTo({ top, behavior: smooth });
        }
      });
      return () => cancelAnimationFrame(raf);
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
};

export default RouteEffects;
