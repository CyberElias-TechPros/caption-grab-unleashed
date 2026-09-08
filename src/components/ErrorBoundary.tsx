import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h1 className="font-display text-2xl font-bold">Something broke on our end</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The page hit an unexpected error. Your history is stored locally and is safe — reloading
          usually fixes it.
        </p>
        <Button onClick={() => window.location.reload()} className="gap-2">
          <RotateCcw className="h-4 w-4" /> Reload the app
        </Button>
      </div>
    );
  }
}
