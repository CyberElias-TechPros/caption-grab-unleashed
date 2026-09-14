import React from "react";
import { useInView } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ── Reveal ────────────────────────────────────────────────────────────── */

export interface RevealProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  /** Delay in ms before the transition starts. */
  delay?: number;
  /** Vertical travel in px. */
  y?: number;
  /** Blur applied before reveal — reads as a camera racking focus. */
  blur?: number;
}

/** Fades + lifts its children into frame the first time they are seen. */
export const Reveal = React.forwardRef<HTMLElement, RevealProps>(function Reveal(
  { as: Tag = "div", delay = 0, y = 26, blur = 0, className, style, children, ...rest },
  forwarded,
) {
  const [ref] = useInView<HTMLDivElement>();
  const inner = forwarded ?? ref;

  return (
    <Tag
      ref={inner}
      data-reveal=""
      className={className}
      style={
        {
          "--reveal-delay": `${delay}ms`,
          "--reveal-y": `${y}px`,
          "--reveal-blur": `${blur}px`,
          ...style,
        } as React.CSSProperties
      }
      {...rest}
    >
      {children}
    </Tag>
  );
});

/* ── MaskLines ─────────────────────────────────────────────────────────── */

/**
 * Editorial headline reveal: each line sits in an overflow-hidden mask and
 * slides up from below with a slight rotation, staggered line by line.
 */
export const MaskLines: React.FC<{
  lines: React.ReactNode[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  stagger?: number;
}> = ({ lines, className, lineClassName, delay = 0, stagger = 110 }) => {
  const [ref] = useInView<HTMLDivElement>({ threshold: 0.2 });
  return (
        <div ref={ref} className={className}>
      {lines.map((line, i) => (
        <span key={i} className={cn("mask-line", lineClassName)}>
          <span style={{ "--line-delay": `${delay + i * stagger}ms` } as React.CSSProperties}>
            {line}
          </span>
        </span>
      ))}
    </div>
  );
};

/* ── SplitWords ────────────────────────────────────────────────────────── */

/** Splits a string into words and staggers them in with a soft focus pull. */
export const SplitWords: React.FC<{
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  stagger?: number;
}> = ({ text, className, wordClassName, delay = 0, stagger = 34 }) => {
  const [ref] = useInView<HTMLSpanElement>({ threshold: 0.25 });
  const words = text.split(" ");
  return (
    <span ref={ref} className={cn("inline", className)}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block whitespace-nowrap">
          <span
            className={cn("word", wordClassName)}
            style={{ "--word-delay": `${delay + i * stagger}ms` } as React.CSSProperties}
          >
            {word}
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
};

/* ── SectionHeading ────────────────────────────────────────────────────── */

/** Numbered section marker + eyebrow + headline. The rhythm of the page. */
export const SectionHeading: React.FC<{
  index: string;
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}> = ({ index, eyebrow, title, lede, align = "center", className }) => (
  <div
    className={cn(
      "max-w-3xl",
      align === "center" ? "mx-auto text-center" : "text-left",
      className,
    )}
  >
    <Reveal
      className={cn(
        "flex items-center gap-3",
        align === "center" && "justify-center",
      )}
      y={14}
    >
      <span className="num text-[0.7rem] font-medium text-primary/70">{index}</span>
      <span
        className="h-px w-10 origin-left bg-gradient-to-r from-primary/70 to-transparent"
        aria-hidden="true"
      />
      <span className="font-mono-label text-[0.65rem] uppercase tracking-ultra text-muted-foreground">
        {eyebrow}
      </span>
    </Reveal>

    <Reveal delay={90} y={22}>
      <h2 className="mt-5 font-display text-display-xs text-foreground">{title}</h2>
    </Reveal>

    {lede && (
      <Reveal delay={170} y={18}>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-[1.05rem]">
          {lede}
        </p>
      </Reveal>
    )}
  </div>
);
