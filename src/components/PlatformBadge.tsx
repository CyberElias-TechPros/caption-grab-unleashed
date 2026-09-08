import React from "react";
import { Facebook, Instagram, Linkedin, Music2, Twitter, Youtube, HelpCircle } from "lucide-react";
import type { Platform } from "@/lib/youtube";
import { cn } from "@/lib/utils";

const CONFIG: Record<Platform, { label: string; className: string; Icon: React.ElementType }> = {
  youtube: { label: "YouTube", className: "bg-red-500/10 text-red-500 border-red-500/25", Icon: Youtube },
  facebook: { label: "Facebook", className: "bg-blue-500/10 text-blue-500 border-blue-500/25", Icon: Facebook },
  twitter: { label: "Twitter / X", className: "bg-sky-500/10 text-sky-500 border-sky-500/25", Icon: Twitter },
  linkedin: { label: "LinkedIn", className: "bg-cyan-600/10 text-cyan-600 border-cyan-600/25 dark:text-cyan-400", Icon: Linkedin },
  tiktok: { label: "TikTok", className: "bg-zinc-500/10 text-zinc-500 border-zinc-500/25 dark:text-zinc-300", Icon: Music2 },
  instagram: { label: "Instagram", className: "bg-pink-500/10 text-pink-500 border-pink-500/25", Icon: Instagram },
  unsupported: { label: "Unknown", className: "bg-muted text-muted-foreground border-border", Icon: HelpCircle },
};

const PlatformBadge: React.FC<{ platform: Platform; className?: string }> = ({ platform, className }) => {
  const { label, className: tone, Icon } = CONFIG[platform];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        tone,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
};

export default PlatformBadge;
