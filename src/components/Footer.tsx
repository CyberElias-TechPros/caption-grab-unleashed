import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Github, Heart } from "lucide-react";
import Logo from "@/components/Logo";

const COLUMNS: Array<{ title: string; links: Array<{ label: string; href: string; external?: boolean }> }> = [
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
      { label: "Source code", href: "https://github.com/CyberElias-TechPros/caption-grab-unleashed", external: true },
      { label: "Report an issue", href: "https://github.com/CyberElias-TechPros/caption-grab-unleashed/issues", external: true },
      { label: "YouTube help", href: "https://support.google.com/youtube/answer/6373554", external: true },
    ],
  },
];

const Footer: React.FC = () => (
  <footer className="relative mt-24 border-t border-border/60">
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    <div className="container py-14">
      <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            The fastest way to turn any YouTube video into a searchable, shareable transcript. Free
            forever, no account needed.
          </p>
          <a
            href="https://github.com/CyberElias-TechPros/caption-grab-unleashed"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-border/70 px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <Github className="h-4 w-4" /> Star us on GitHub <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {col.title}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) =>
                link.external ? (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-foreground/80 transition-colors hover:text-primary"
                    >
                      {link.label}
                    </a>
                  </li>
                ) : (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-foreground/80 transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </nav>
        ))}
      </div>

      <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} CaptionGrab. Free forever.</p>
        <p className="inline-flex items-center gap-1.5">
          Made with <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" /> for learners,
          creators & researchers
        </p>
        <p>Not affiliated with YouTube or Google.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
