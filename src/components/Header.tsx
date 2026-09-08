import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Github, Menu, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import SettingsDialog from "@/components/SettingsDialog";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Extractor", href: "/#extractor" },
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "FAQ", href: "/#faq" },
  { label: "About", href: "/about" },
];

const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border/70 bg-background/80 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.35)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-3">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <SettingsDialog />
          <Button variant="ghost" size="icon" className="hidden h-9 w-9 rounded-xl sm:inline-flex" asChild>
            <a
              href="https://github.com/CyberElias-TechPros/caption-grab-unleashed"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View source on GitHub"
            >
              <Github className="h-[18px] w-[18px]" />
            </a>
          </Button>
          <Button asChild className="btn-shine ml-1 hidden rounded-xl font-semibold sm:inline-flex">
            <Link to="/#extractor">
              <Sparkles className="h-4 w-4" /> Get started
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      <div
        className={cn(
          "grid overflow-hidden border-b border-border/60 bg-background/95 backdrop-blur-xl transition-all duration-300 lg:hidden",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] border-transparent opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <nav className="container flex flex-col gap-1 py-4" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="rounded-xl px-4 py-3 text-[0.95rem] font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <Button asChild className="btn-shine mt-2 rounded-xl font-semibold">
              <Link to="/#extractor">
                <Sparkles className="h-4 w-4" /> Get started — it's free
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
