import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import BackgroundFX from "@/components/BackgroundFX";

interface State {
  hasError: boolean;
  error?: Error;
}

/** Catches render crashes so users never see a blank page. */
export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("Uncaught render error:", error, info);
  }

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
        <BackgroundFX />
        <div className="animate-fade-up relative flex flex-col items-center gap-5">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <span className="animate-pulse-ring absolute inset-0 rounded-2xl border border-destructive/40" />
            <AlertTriangle className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="font-display text-display-xs">
            Something broke <span className="font-editorial italic text-gradient">on our end</span>
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            The page hit an unexpected error. Your history is stored locally and is safe — reloading
            usually fixes it.
          </p>
          <Button onClick={() => window.location.reload()} className="caption-button btn-shine rounded-2xl">
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reload the app
          </Button>
          {this.state.error?.message && (
            <p className="num max-w-lg rounded-xl border border-border/60 bg-card/60 p-3 text-left text-[0.7rem] text-muted-foreground">
              {this.state.error.message}
            </p>
          )}
        </div>
      </div>
    );
  }
}
