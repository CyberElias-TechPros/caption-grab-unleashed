import React, { useEffect, useMemo, useRef, useState } from "react";
import { useInView, useReducedMotion } from "@/lib/motion";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";

const LINES: Array<{ t: number; text: string }> = [
  { t: 0.4, text: "For most of the twentieth century, captions were an afterthought." },
  { t: 4.6, text: "They were designed for people who could not hear the soundtrack at all." },
  { t: 9.1, text: "And then something strange happened when video moved online." },
  { t: 13.2, text: "People who could hear perfectly well started turning captions on." },
  { t: 17.8, text: "On a noisy train, captions are the difference between watching and giving up." },
  { t: 22.4, text: "In a second language, they turn listening practice into reading practice." },
  { t: 27.1, text: "Captions stopped being an accessibility feature and became an interface." },
];

/**
 * The signature element: a transcript that writes itself.
 *
 * It is a real product demo, not decoration — the timecodes are the same
 * `formatClock` output the app renders, and it demonstrates exactly what the
 * extractor produces before you have pasted anything.
 */
const TranscriptTicker: React.FC = () => {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.3 });
  const reduced = useReducedMotion();
  const [count, setCount] = useState(0);
  const [typed, setTyped] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setCount(LINES.length);
      return;
    }
    setCount(0);
    let i = 0;
    const step = () => {
      i += 1;
      setCount(i);
      if (i < LINES.length) {
        timer.current = window.setTimeout(step, 1250);
      }
    };
    timer.current = window.setTimeout(step, 700);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [inView, reduced]);

  // Character-by-character typing on the newest line only.
  useEffect(() => {
    if (reduced || count === 0 || count >= LINES.length) {
      setTyped(999);
      return;
    }
    const full = LINES[count - 1].text;
    let n = 0;
    setTyped(0);
    const id = window.setInterval(() => {
      n += 3;
      setTyped(n);
      if (n >= full.length) window.clearInterval(id);
    }, 16);
    return () => window.clearInterval(id);
  }, [count, reduced]);

  const visible = useMemo(() => LINES.slice(0, count), [count]);
  const isTyping = !reduced && count > 0 && count < LINES.length;

  return (
    <div ref={ref} className="panel relative">
      {/* Console chrome */}
      <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </span>
        <p className="font-mono-label text-[0.62rem] uppercase tracking-ultra text-muted-foreground">
          transcript · live
        </p>
        <span className="ml-auto flex items-center gap-2 font-mono-label text-[0.62rem] text-emerald-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-400/70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          streaming
        </span>
      </div>

      <ol className="h-[212px] space-y-1 overflow-hidden p-3" aria-live="off">
        {visible.map((line, i) => {
          const isLast = i === visible.length - 1;
          const text = isLast && isTyping ? line.text.slice(0, typed) : line.text;
          return (
            <li
              key={line.t}
              className={cn(
                "segment-row animate-fade-in items-start",
                i === 0 && "opacity-45",
                i === 1 && "opacity-65",
                i === 2 && "opacity-80",
              )}
            >
              <span className="num mt-[3px] rounded-md bg-primary/10 px-2 py-1 text-[0.68rem] font-semibold text-primary">
                {formatClock(line.t)}
              </span>
              <p className="text-[0.9rem] leading-relaxed text-foreground/90">
                {text}
                {isLast && isTyping && <span className="caret" aria-hidden="true" />}
              </p>
            </li>
          );
        })}
      </ol>

      <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
        <p className="font-mono-label text-[0.62rem] uppercase tracking-ultra text-muted-foreground">
          {LINES.length} segments · en
        </p>
        <p className="font-mono-label text-[0.62rem] uppercase tracking-ultra text-muted-foreground">
          export · srt / vtt / txt / json
        </p>
      </div>
    </div>
  );
};

export default TranscriptTicker;
