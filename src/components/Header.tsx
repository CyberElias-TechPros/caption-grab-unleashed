import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Github, Menu, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import SettingsDialog from "@/components/SettingsDialog";
import ApiStatus from "@/components/ApiStatus";
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

  const isActive = (href: string) =>
    href === "/about"
      ? location.pathname === "/about"
      : location.pathname === "/" && location.hash === href.slice(1);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-500 ease-cinematic",
        scrolled
          ? "border-b border-border/60 bg-background/72 shadow-[0_10px_40px_-24px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-3 lg:h-[4.5rem]">
        <Logo />

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={cn(
                "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-300",
                isActive(item.href)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
              <span
                className={cn(
                  "absolute inset-x-3 -bottom-0.5 h-px origin-left bg-gradient-to-r from-primary to-brand-3 transition-transform duration-500 ease-cinematic",
                  isActive(item.href) ? "scale-x-100" : "scale-x-0",
                )}
                aria-hidden="true"
              />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <ApiStatus className="hidden xl:inline-flex" />
          <ThemeToggle />
          <SettingsDialog />
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-9 w-9 rounded-xl sm:inline-flex"
            asChild
          >
            <a
              href="https://github.com/CyberElias-TechPros/caption-grab-unleashed"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View source on GitHub"
            >
              <Github className="h-[18px] w-[18px]" aria-hidden="true" />
            </a>
          </Button>
          <Button asChild className="caption-button btn-shine ml-1 hidden rounded-xl sm:inline-flex">
            <Link to="/#extractor">
              <Sparkles className="h-4 w-4" aria-hidden="true" /> Get started
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
          "grid overflow-hidden border-b border-border/60 bg-background/95 backdrop-blur-2xl transition-all duration-500 ease-cinematic lg:hidden",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] border-transparent opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <nav className="container flex flex-col gap-1 py-4" aria-label="Mobile">
            {NAV.map((item, i) => (
              <Link
                key={item.label}
                to={item.href}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-[0.95rem] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
                style={{ transitionDelay: open ? `${i * 40}ms` : "0ms" }}
              >
                <span className="num text-[0.62rem] text-primary/70">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item.label}
              </Link>
            ))}
            <div className="px-4 pt-3">
              <ApiStatus />
            </div>
            <Button asChild className="caption-button btn-shine mt-3 rounded-xl">
              <Link to="/#extractor">
                <Sparkles className="h-4 w-4" aria-hidden="true" /> Get started — it's free
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
