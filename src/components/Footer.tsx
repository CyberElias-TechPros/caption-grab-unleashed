import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Github, Heart } from "lucide-react";
import Logo from "@/components/Logo";

const COLUMNS: Array<{
  title: string;
  links: Array<{ label: string; href: string; external?: boolean }>;
}> = [
  {
    title: "Product",
    links: [
      { label: "Extractor", href: "/#extractor" },
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
  {
    title: "Resources",
    links: [
      {
        label: "Source code",
        href: "https://github.com/CyberElias-TechPros/caption-grab-unleashed",
        external: true,
      },
      {
        label: "Report an issue",
        href: "https://github.com/CyberElias-TechPros/caption-grab-unleashed/issues",
        external: true,
      },
      {
        label: "YouTube caption help",
        href: "https://support.google.com/youtube/answer/6373554",
        external: true,
      },
    ],
  },
];

const Footer: React.FC = () => (
  <footer className="relative mt-32 border-t border-border/60">
    <div
      className="absolute inset-x-0 top-0 h-px"
      style={{
        background:
          "linear-gradient(90deg, transparent, hsl(var(--brand-1) / 0.6) 30%, hsl(var(--brand-3) / 0.6) 70%, transparent)",
      }}
      aria-hidden="true"
    />
    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-60"
      style={{
        background:
          "radial-gradient(60% 100% at 50% 0%, hsl(var(--brand-2) / 0.10), transparent 72%)",
      }}
      aria-hidden="true"
    />

    <div className="container relative py-16">
      <div className="grid gap-12 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
            The fastest way to turn any YouTube video into a searchable, shareable transcript. Free
            forever, no account needed.
          </p>
          <a
            href="https://github.com/CyberElias-TechPros/caption-grab-unleashed"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/40 px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-all duration-300 hover:-translate-y-px hover:border-primary/50 hover:text-foreground"
          >
            <Github className="h-4 w-4" aria-hidden="true" /> Star us on GitHub
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="font-mono-label text-[0.6rem] uppercase tracking-ultra text-muted-foreground">
              {col.title}
            </h3>
            <ul className="mt-5 space-y-3">
              {col.links.map((link) => (
                <li key={link.label}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1.5 text-sm text-foreground/75 transition-colors hover:text-primary"
                    >
                      {link.label}
                      <ArrowUpRight
                        className="h-3 w-3 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
                        aria-hidden="true"
                      />
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className="text-sm text-foreground/75 transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-7 text-xs text-muted-foreground sm:flex-row">
        <p className="num">© {new Date().getFullYear()} CaptionGrab. Free forever.</p>
        <p className="inline-flex items-center gap-1.5">
          Made with
          <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" aria-hidden="true" />
          for learners, creators &amp; researchers
        </p>
        <p>Not affiliated with YouTube or Google.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
