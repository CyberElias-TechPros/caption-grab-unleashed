import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { HistoryProvider } from "@/contexts/HistoryContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import BackgroundFX from "@/components/BackgroundFX";
import CursorGlow from "@/components/CursorGlow";
import PageTransition from "@/components/PageTransition";
import RouteEffects from "@/components/RouteEffects";
import ScrollRail from "@/components/motion/ScrollRail";
import { usePointerLight, useScrollProgressVar } from "@/lib/motion";

const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageFallback: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="flex flex-col items-center gap-5" role="status" aria-label="Loading page">
      <span className="relative flex h-12 w-12 items-center justify-center">
        <span className="animate-pulse-ring absolute inset-0 rounded-full border border-primary/40" />
        <span className="h-11 w-11 animate-spin rounded-full border-[2px] border-primary/20 border-t-primary" />
      </span>
      <p className="font-mono-label text-[0.65rem] uppercase tracking-ultra text-muted-foreground">
        Loading
      </p>
    </div>
  </div>
);

/** Publishes scroll progress + pointer position as CSS vars for the ambient layers. */
const AmbientDrivers: React.FC = () => {
  useScrollProgressVar();
  usePointerLight();
  return null;
};

const App: React.FC = () => (
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="captiongrab:theme">
      <SettingsProvider>
        <HistoryProvider>
          <TooltipProvider delayDuration={250}>
            <Sonner
              position="bottom-right"
              richColors
              closeButton
              toastOptions={{
                duration: 3800,
                classNames: {
                  toast:
                    "!rounded-2xl !border-border/70 !bg-card/95 !backdrop-blur-xl !shadow-[0_24px_70px_-28px_rgba(0,0,0,0.7)]",
                },
              }}
            />
            <AmbientDrivers />
            <ScrollRail />
            <CursorGlow />
            <BrowserRouter>
              <RouteEffects />
              <PageTransition>
                <Suspense fallback={<PageFallback />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </PageTransition>
            </BrowserRouter>
          </TooltipProvider>
        </HistoryProvider>
      </SettingsProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export { BackgroundFX };
export default App;
