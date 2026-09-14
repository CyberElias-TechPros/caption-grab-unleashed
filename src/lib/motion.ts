/**
 * Motion toolkit.
 *
 * Deliberately dependency-free: one shared rAF loop fans out to every
 * subscriber, so a page full of parallax layers costs a single scroll
 * listener and a single frame callback. Everything here is inert when the
 * user has asked for reduced motion.
 */

import { useCallback, useEffect, useRef, useState } from "react";

/* ── Reduced motion ──────────────────────────────────────────────────── */

const MQ_REDUCED = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(MQ_REDUCED).matches;
}

/** Reactive `prefers-reduced-motion` — updates if the user changes it live. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(MQ_REDUCED);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/* ── Shared scroll loop ──────────────────────────────────────────────── */

type ScrollSubscriber = (info: { y: number; progress: number }) => void;

const subscribers = new Set<ScrollSubscriber>();
let ticking = false;
let lastY = 0;

function measureProgress(): number {
  const doc = document.documentElement;
  const max = doc.scrollHeight - window.innerHeight;
  return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
}

function frame() {
  ticking = false;
  const y = window.scrollY;
  lastY = y;
  const info = { y, progress: measureProgress() };
  subscribers.forEach((fn) => fn(info));
}

function requestFrame() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(frame);
}

function ensureScrollListener(): void {
  if (subscribers.size === 1) {
    window.addEventListener("scroll", requestFrame, { passive: true });
    window.addEventListener("resize", requestFrame, { passive: true });
  }
}

function teardownScrollListener(): void {
  if (subscribers.size === 0) {
    window.removeEventListener("scroll", requestFrame);
    window.removeEventListener("resize", requestFrame);
  }
}

function subscribeScroll(fn: ScrollSubscriber): () => void {
  subscribers.add(fn);
  ensureScrollListener();
  fn({ y: window.scrollY, progress: measureProgress() });
  return () => {
    subscribers.delete(fn);
    teardownScrollListener();
  };
}

/* ── Hooks ───────────────────────────────────────────────────────────── */

/** Document scroll progress, 0 → 1. */
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);
  useEffect(() => subscribeScroll((i) => setProgress(i.progress)), []);
  return progress;
}

export interface ElementScrollState {
  /** -1 when the element is above the viewport, 1 when below. */
  progress: number;
  /** True while any part of the element is on screen. */
  visible: boolean;
}

/**
 * Position of an element relative to the viewport, as -1 … 1.
 * 0 means the element's centre is exactly at the viewport centre.
 */
export function useElementScroll<T extends HTMLElement>(): [
  React.RefObject<T>,
  ElementScrollState,
] {
  const ref = useRef<T>(null);
  const [state, setState] = useState<ElementScrollState>({ progress: 0, visible: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const compute = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const centre = rect.top + rect.height / 2;
      const progress = Math.max(-1, Math.min(1, (centre - vh / 2) / (vh / 2)));
      const visible = rect.bottom > 0 && rect.top < vh;
      setState((prev) =>
        Math.abs(prev.progress - progress) < 0.004 && prev.visible === visible
          ? prev
          : { progress, visible },
      );
    };

    return subscribeScroll(compute);
  }, []);

  return [ref, state];
}

/** Writes `--scroll-progress` on <html> so CSS can react without JS re-renders. */
export function useScrollProgressVar(): void {
  useEffect(
    () =>
      subscribeScroll((i) => {
        document.documentElement.style.setProperty("--scroll-progress", i.progress.toFixed(4));
      }),
    [],
  );
}

/**
 * Writes the pointer position to `--px` / `--py` on <html> (0 … 1).
 * Ambient lighting layers read these, so the background reacts to the cursor
 * without any React re-render. Disabled for coarse pointers.
 */
export function usePointerLight(): void {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: none)").matches) return;
    if (prefersReducedMotion()) return;

    let raf = 0;
    let x = 0.5;
    let y = 0.5;

    const apply = () => {
      raf = 0;
      const root = document.documentElement;
      root.style.setProperty("--px", x.toFixed(4));
      root.style.setProperty("--py", y.toFixed(4));
    };

    const onMove = (e: PointerEvent) => {
      x = e.clientX / (window.innerWidth || 1);
      y = e.clientY / (window.innerHeight || 1);
      if (!raf) raf = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}

/* ── In-view ─────────────────────────────────────────────────────────── */

export interface InViewOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

/**
 * Adds `.is-visible` to the element (and any `[data-reveal]` inside it) when
 * it enters the viewport. Falls back to "always visible" without IO support
 * or when reduced motion is requested.
 */
export function useInView<T extends HTMLElement>(options: InViewOptions = {}) {
  const { threshold = 0.14, rootMargin = "0px 0px -8% 0px", once = true } = options;
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      el.querySelectorAll<HTMLElement>("[data-reveal]").forEach((n) => n.classList.add("is-visible"));
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            entry.target
              .querySelectorAll<HTMLElement>("[data-reveal]")
              .forEach((n) => n.classList.add("is-visible"));
            setInView(true);
            if (once) io.unobserve(entry.target);
          } else if (!once) {
            entry.target.classList.remove("is-visible");
            setInView(false);
          }
        }
      },
      { threshold, rootMargin },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, inView] as const;
}

/* ── Count-up ────────────────────────────────────────────────────────── */

const EASE_OUT_EXPO = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/** Animates a number from 0 to `value` when `active` flips true. */
export function useCountUp(value: number, active: boolean, duration = 1400): number {
  const [display, setDisplay] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!active) return;
    if (reduced) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setDisplay(value * EASE_OUT_EXPO(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, active, duration, reduced]);

  return display;
}

/* ── Misc ────────────────────────────────────────────────────────────── */

/** Smoothly scroll an element into view, respecting reduced motion. */
export function scrollToId(id: string, opts: { offset?: number } = {}): void {
  const el = document.getElementById(id);
  if (!el) return;
  const offset = opts.offset ?? 84;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

/** Debounced boolean — used to keep expensive effects off the fast path. */
export function useDebounced<T>(value: T, delay = 220): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Stable callback ref that runs an effect whenever the node mounts. */
export function useNodeCallback<T extends HTMLElement>(
  fn: (node: T | null) => void,
): (node: T | null) => void {
  const saved = useRef(fn);
  saved.current = fn;
  return useCallback((node: T | null) => saved.current(node), []);
}
