import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsProvider } from "@/contexts/SettingsContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import BackgroundFX from "@/components/BackgroundFX";

const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageFallback: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center">
    <BackgroundFX />
    <div className="flex flex-col items-center gap-4" role="status" aria-label="Loading page">
      <span
        className="h-11 w-11 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary"
        aria-hidden="true"
      />
      <p className="text-sm font-medium text-muted-foreground">Loading…</p>
    </div>
  </div>
);

const App: React.FC = () => (
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="captiongrab:theme">
      <SettingsProvider>
        <TooltipProvider delayDuration={250}>
          <Sonner position="bottom-right" richColors closeButton toastOptions={{ duration: 3500 }} />
          <BrowserRouter>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </SettingsProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
