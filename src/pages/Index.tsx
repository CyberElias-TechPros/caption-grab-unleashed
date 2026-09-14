import React, { useCallback, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackgroundFX from "@/components/BackgroundFX";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import StatsBand from "@/components/landing/StatsBand";
import LanguageMarquee from "@/components/landing/LanguageMarquee";
import Faq from "@/components/landing/Faq";
import Cta from "@/components/landing/Cta";
import HistoryPanel from "@/components/HistoryPanel";
import CaptionDisplay from "@/components/CaptionDisplay";
import type { TranscriptResult } from "@/lib/api";

const Index: React.FC = () => {
  const [restored, setRestored] = useState<{ result: TranscriptResult; thumbnail: string } | null>(
    null,
  );

  const handleRestore = useCallback((result: TranscriptResult, thumbnail: string) => {
    setRestored({ result, thumbnail });
    requestAnimationFrame(() => {
      document
        .getElementById("restored-transcript")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <BackgroundFX />
      <Header />
      <main className="flex-1">
        <Hero />

        <div className="container max-w-5xl">
          <HistoryPanel onRestore={handleRestore} />
        </div>

        {restored && (
          <div id="restored-transcript" className="container mt-6 max-w-5xl scroll-mt-24">
            <CaptionDisplay result={restored.result} thumbnail={restored.thumbnail} />
          </div>
        )}

        <Features />
        <HowItWorks />
        <StatsBand />
        <LanguageMarquee />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
