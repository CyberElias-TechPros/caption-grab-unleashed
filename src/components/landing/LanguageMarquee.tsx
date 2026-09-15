import React from "react";
import Marquee from "@/components/motion/Marquee";

const ROW_A = [
  "English", "Español", "Français", "Deutsch", "Português", "Italiano", "Nederlands",
  "Polski", "Türkçe", "Русский", "Українська", "العربية", "हिन्दी", "বাংলা",
];

const ROW_B = [
  "日本語", "한국어", "简体中文", "繁體中文", "Tiếng Việt", "ไทย", "Bahasa Indonesia",
  "Svenska", "Norsk", "Suomi", "Dansk", "Ελληνικά", "עברית", "فارسی",
];

const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="mx-2 inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border/60 bg-card/40 px-4 py-2 text-sm text-foreground/80 backdrop-blur-sm">
    <span
      className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-primary to-brand-3"
      aria-hidden="true"
    />
    {children}
  </span>
);

/** Two counter-scrolling rows of the languages the extractor can serve. */
const LanguageMarquee: React.FC = () => (
  <section className="mt-32 overflow-hidden" aria-label="Supported languages">
    <p className="container mb-6 text-center font-mono-label text-[0.62rem] uppercase tracking-ultra text-muted-foreground">
      Caption tracks in every language YouTube publishes
    </p>
    <div className="space-y-3">
      <Marquee duration={52}>
        {ROW_A.map((l) => (
          <Chip key={l}>{l}</Chip>
        ))}
      </Marquee>
      <Marquee duration={64} reverse>
        {ROW_B.map((l) => (
          <Chip key={l}>{l}</Chip>
        ))}
      </Marquee>
    </div>
  </section>
);

export default LanguageMarquee;
