import React, { useEffect, useState } from "react";
import { checkApiHealth, type ApiHealth } from "@/lib/api";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type State = "checking" | "online" | "demo" | "offline";

const LABEL: Record<State, string> = {
  checking: "Checking",
  online: "Edge API online",
  demo: "Demo mode",
  offline: "API unreachable",
};

const TONE: Record<State, string> = {
  checking: "bg-muted-foreground",
  online: "bg-emerald-400",
  demo: "bg-amber-400",
  offline: "bg-rose-400",
};

const DETAIL: Record<State, string> = {
  checking: "Asking the API whether it is awake.",
  online:
    "The Cloudflare Worker is answering. Extractions are fetched live from YouTube.",
  demo:
    "The Worker isn't reachable, so the dev server is answering from the bundled demo library. Every control still works — the transcript text is placeholder copy.",
  offline:
    "The API can't be reached. Locally, run `npm run worker:dev`; in production, check the API_WORKER_URL rewrite.",
};

/** A live status dot for the API, so the user always knows which path they're on. */
const ApiStatus: React.FC<{ className?: string }> = ({ className }) => {
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    let alive = true;

    const probe = async () => {
      const health: ApiHealth = await checkApiHealth();
      if (!alive) return;
      if (!health.reachable) setState("offline");
      else setState(health.demo ? "demo" : "online");
    };

    void probe();
    const id = window.setInterval(probe, 45_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex cursor-help items-center gap-2 rounded-full border border-border/70 bg-background/50 px-2.5 py-1 backdrop-blur-md",
            className,
          )}
        >
          <span className="relative flex h-1.5 w-1.5">
            {state !== "checking" && state !== "offline" && (
              <span
                className={cn(
                  "animate-pulse-ring absolute inline-flex h-full w-full rounded-full opacity-70",
                  TONE[state],
                )}
              />
            )}
            <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", TONE[state])} />
          </span>
          <span className="font-mono-label text-[0.58rem] uppercase tracking-[0.16em] text-muted-foreground">
            {LABEL[state]}
          </span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs rounded-xl text-xs leading-relaxed">
        {DETAIL[state]}
      </TooltipContent>
    </Tooltip>
  );
};

export default ApiStatus;
