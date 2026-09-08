import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackgroundFX from "@/components/BackgroundFX";

const NotFound: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    console.warn("404: attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <BackgroundFX />
      <Header />
      <main className="container flex flex-1 flex-col items-center justify-center py-20 text-center">
        <div className="animate-fade-up">
          <p className="font-display text-8xl font-bold tracking-tight sm:text-9xl">
            <span className="text-gradient">404</span>
          </p>
          <h1 className="mt-4 font-display text-2xl font-bold">This page went off-script</h1>
          <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
            The link you followed doesn't exist or moved. Let's get you back to extracting
            transcripts.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="caption-button btn-shine rounded-2xl">
              <Link to="/">
                <Home className="h-4 w-4" /> Back to home
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-2xl">
              <Link to="/#extractor">
                <Compass className="h-4 w-4" /> Open the extractor
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
