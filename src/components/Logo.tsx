import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export const LogoMark: React.FC<{ className?: string }> = ({ className }) => (
  <span
    className={cn(
      "relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl text-white",
      className,
    )}
    style={{
      backgroundImage: "linear-gradient(135deg,#635BFF,#8B3DFF 55%,#E13DA0)",
      boxShadow: "0 8px 24px -8px rgba(139,61,255,0.85), inset 0 1px 0 rgba(255,255,255,0.35)",
    }}
    aria-hidden="true"
  >
    <svg
      viewBox="0 0 24 24"
      className="relative z-10 h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    >
      <path d="M4 7h16" />
      <path d="M4 12h10" />
      <path d="M4 17h13" />
    </svg>
    {/* specular sheen */}
    <span className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/25" />
    <span
      className="absolute inset-x-0 -top-full h-full bg-gradient-to-b from-transparent via-white/45 to-transparent transition-transform duration-700 ease-cinematic group-hover:translate-y-[220%]"
      aria-hidden="true"
    />
  </span>
);

const Logo: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <Link
    to="/"
    className="group flex items-center gap-2.5"
    aria-label="CaptionGrab home"
  >
    <LogoMark className="transition-transform duration-500 ease-cinematic group-hover:rotate-6 group-hover:scale-105" />
    <span className="flex flex-col leading-none">
      <span className="font-display text-[1.1rem] font-bold tracking-tight">
        Caption<span className="text-gradient">Grab</span>
      </span>
      {!compact && (
        <span className="font-mono-label mt-1 text-[0.55rem] uppercase tracking-ultra text-muted-foreground">
          Transcript Studio
        </span>
      )}
    </span>
  </Link>
);

export default Logo;
