import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export const LogoMark: React.FC<{ className?: string }> = ({ className }) => (
  <span
    className={cn(
      "relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl text-white shadow-[0_6px_20px_-6px_rgba(124,58,237,0.7)]",
      className,
    )}
    style={{ backgroundImage: "linear-gradient(135deg,#5B5BF0,#8B3DFF 55%,#E13DA0)" }}
    aria-hidden="true"
  >
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M4 7h16" />
      <path d="M4 12h10" />
      <path d="M4 17h13" />
    </svg>
    <span className="absolute inset-0 bg-gradient-to-t from-black/15 to-white/20" />
  </span>
);

const Logo: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <Link to="/" className="group flex items-center gap-2.5" aria-label="CaptionGrab home">
    <LogoMark className="transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105" />
    <span className="flex flex-col leading-none">
      <span className="font-display text-[1.15rem] font-bold tracking-tight">
        Caption<span className="text-gradient">Grab</span>
      </span>
      {!compact && (
        <span className="mt-0.5 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Transcript Studio
        </span>
      )}
    </span>
  </Link>
);

export default Logo;
