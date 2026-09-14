import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ClipboardPaste,
  FileText,
  FlaskConical,
  Languages,
  Loader2,
  RotateCcw,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PlatformBadge from "@/components/PlatformBadge";
import VideoPreview from "@/components/VideoPreview";
import CaptionDisplay from "@/components/CaptionDisplay";
import { useSettings } from "@/contexts/SettingsContext";
import { useCaptionHistory } from "@/contexts/HistoryContext";
import {
  CaptionGrabError,
  describeError,
  fetchTranscript,
  fetchVideoInfo,
  type TranscriptResult,
  type VideoInfo,
} from "@/lib/api";
import { SAMPLE_VIDEOS } from "@/config/apiConfig";
import { detectPlatform, extractYoutubeVideoId, getPlatformSupport } from "@/lib/youtube";
import { cn } from "@/lib/utils";

type Phase = "idle" | "loading-video" | "pick-language" | "loading-transcript" | "done";

const VIDEO_STAGES = [
  "Resolving video id",
  "Asking YouTube for metadata",
  "Reading caption tracks",
];

const TRANSCRIPT_STAGES = [
  "Selecting the best track",
  "Downloading timed text",
  "Parsing timestamps",
  "Assembling your transcript",
];

/** A stage ladder that keeps moving while the network takes its time. */
const StageLadder: React.FC<{ stages: string[]; active: boolean }> = ({ stages, active }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }
    const id = window.setInterval(() => {
      setStep((s) => Math.min(stages.length - 1, s + 1));
    }, 620);
    return () => window.clearInterval(id);
  }, [active, stages.length]);

  return (
    <ul className="mt-5 space-y-2" aria-live="polite">
      {stages.map((label, i) => {
        const done = i < step;
        const current = i === step;
        return (
          <li
            key={label}
            className={cn(
              "flex items-center gap-2.5 text-xs transition-all duration-500",
              done ? "text-muted-foreground" : current ? "text-foreground" : "text-muted-foreground/40",
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-300",
                done
                  ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-400"
                  : current
                    ? "border-primary/60 bg-primary/15"
                    : "border-border/60",
              )}
            >
              {done ? (
                <Check className="h-2.5 w-2.5" aria-hidden="true" />
              ) : current ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin text-primary" aria-hidden="true" />
              ) : null}
            </span>
            <span className="font-mono-label uppercase tracking-[0.16em]">{label}</span>
          </li>
        );
      })}
    </ul>
  );
};

/** A live equaliser, shown while work is in flight. */
const Equaliser: React.FC = () => (
  <span className="flex h-4 items-end gap-[3px]" aria-hidden="true">
    {[0, 1, 2, 3, 4].map((i) => (
      <span
        key={i}
        className="eq-bar w-[3px] rounded-full bg-gradient-to-t from-primary to-brand-3"
        style={{ height: "100%", ["--eq-delay" as string]: `${i * 110}ms` }}
      />
    ))}
  </span>
);

const Extractor: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { add } = useCaptionHistory();
  const inputRef = useRef<HTMLInputElement>(null);

  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [video, setVideo] = useState<VideoInfo | null>(null);
  const [result, setResult] = useState<TranscriptResult | null>(null);
  const [language, setLanguage] = useState(settings.defaultLanguage);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const platform = useMemo(() => detectPlatform(url), [url]);
  const support = useMemo(() => getPlatformSupport(platform), [platform]);
  const videoId = useMemo(() => extractYoutubeVideoId(url), [url]);
  const busy = phase === "loading-video" || phase === "loading-transcript";

  // "/" or ⌘K focuses the input from anywhere on the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (typing) return;
      if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const reset = (keepUrl = true) => {
    if (!keepUrl) setUrl("");
    setPhase("idle");
    setVideo(null);
    setResult(null);
    setError(null);
    setErrorCode(null);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        reset();
        setUrl(text.trim());
      }
    } catch {
      toast.error("Clipboard access denied", {
        description: "Your browser blocked reading the clipboard — use Ctrl/⌘ + V instead.",
      });
    }
  };

  const handleLookup = async (rawUrl?: string) => {
    const value = (rawUrl ?? url).trim();
    if (!value) {
      setError("Paste a YouTube link or video id to get started.");
      setErrorCode("EMPTY");
      return;
    }
    const id = extractYoutubeVideoId(value);
    if (!id) {
      const p = detectPlatform(value);
      setError(getPlatformSupport(p).message);
      setErrorCode(p === "unsupported" ? "UNSUPPORTED" : "PLATFORM");
      return;
    }
    setError(null);
    setErrorCode(null);
    setResult(null);
    setPhase("loading-video");
    try {
      const info = await fetchVideoInfo(id);
      setVideo(info);
      const preferred =
        info.tracks.find(
          (t) => t.languageCode.toLowerCase() === settings.defaultLanguage.toLowerCase(),
        ) ||
        info.tracks.find((t) => t.languageCode.toLowerCase().startsWith("en")) ||
        info.tracks[0];
      setLanguage(preferred?.languageCode || settings.defaultLanguage);
      setPhase("pick-language");
      if (!info.captionsAvailable) {
        setError(
          "YouTube reports no caption tracks for this video. You can still try extraction — auto-captions sometimes exist anyway.",
        );
        setErrorCode("NO_CAPTIONS_WARNING");
      }
    } catch (e) {
      const { title, message } = describeError(e);
      setError(`${title}: ${message}`);
      setErrorCode(e instanceof CaptionGrabError ? e.code : "UNKNOWN");
      setPhase("idle");
      toast.error(title, { description: message });
    }
  };

  const handleExtract = async () => {
    if (!video) return;
    setError(null);
    setErrorCode(null);
    setPhase("loading-transcript");
    try {
      const transcript = await fetchTranscript(video.videoId, language, {
        translate: settings.autoTranslate,
      });
      setResult(transcript);
      setPhase("done");
      if (settings.historyEnabled) add(transcript, video.thumbnail);
      toast.success("Transcript extracted", {
        description: `${transcript.segments.length} segments · ${transcript.languageName}${
          transcript.translated ? " (auto-translated)" : ""
        }`,
      });
      requestAnimationFrame(() => {
        document
          .getElementById("transcript-result")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (e) {
      const { title, message } = describeError(e);
      setError(`${title}: ${message}`);
      setErrorCode(e instanceof CaptionGrabError ? e.code : "UNKNOWN");
      setPhase("pick-language");
      toast.error(title, { description: message });
    }
  };

  const retryWithTranslation = () => {
    updateSettings({ autoTranslate: true });
    toast.success("Smart auto-translate enabled");
    // `settings` is stale inside this render, so call the API with the new value.
    if (!video) return;
    setError(null);
    setErrorCode(null);
    setPhase("loading-transcript");
    fetchTranscript(video.videoId, language, { translate: true })
      .then((transcript) => {
        setResult(transcript);
        setPhase("done");
        if (settings.historyEnabled) add(transcript, video.thumbnail);
        toast.success("Transcript extracted", {
          description: `${transcript.segments.length} segments · ${transcript.languageName}`,
        });
        requestAnimationFrame(() => {
          document
            .getElementById("transcript-result")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      })
      .catch((e) => {
        const { title, message } = describeError(e);
        setError(`${title}: ${message}`);
        setErrorCode(e instanceof CaptionGrabError ? e.code : "UNKNOWN");
        setPhase("pick-language");
        toast.error(title, { description: message });
      });
  };

  const showLanguageError = errorCode === "LANGUAGE_UNAVAILABLE" && phase === "pick-language";

  return (
    <div className="w-full">
      {/* ── Step 1 — the link ─────────────────────────────────────────── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleLookup();
        }}
        className="panel-raised p-5 sm:p-7"
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="num flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[0.68rem] font-bold text-primary">
            1
          </span>
          <h2 className="font-mono-label text-[0.65rem] uppercase tracking-ultra text-muted-foreground">
            Paste a YouTube link
          </h2>
          <kbd className="ml-auto hidden items-center gap-1 rounded-md border border-border/70 bg-background/70 px-1.5 py-0.5 font-mono-label text-[0.6rem] text-muted-foreground sm:inline-flex">
            press <span className="text-foreground">/</span> to focus
          </kbd>
        </div>

        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={url}
              onChange={(e) => {
                reset();
                setUrl(e.target.value);
                setLanguage(settings.defaultLanguage);
              }}
              placeholder="https://www.youtube.com/watch?v=…  or  paste a video id"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              aria-label="YouTube video URL"
              className="h-13 rounded-xl border-border/70 bg-background/70 pr-28 font-mono-label text-[0.85rem] transition-shadow duration-300 focus-visible:shadow-[0_0_0_4px_hsl(var(--brand-1)/0.16)]"
            />
            <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
              {url && videoId && (
                <span className="hidden items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-1 text-[0.65rem] font-semibold text-emerald-400 sm:inline-flex">
                  <Check className="h-3 w-3" aria-hidden="true" /> Valid ID
                </span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handlePaste}
                className="h-9 gap-1.5 rounded-lg text-xs"
              >
                <ClipboardPaste className="h-4 w-4" aria-hidden="true" /> Paste
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={busy || !url.trim()}
            className="caption-button btn-shine h-13 rounded-xl px-7"
          >
            {phase === "loading-video" ? (
              <>
                <Equaliser /> Analyzing…
              </>
            ) : (
              <>
                Continue <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>

        {/* Context row: platform badge, or samples when empty */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {url.trim() ? (
            <>
              <PlatformBadge platform={platform} />
              {!support.supported && <span>{support.message}</span>}
              {support.supported && !videoId && (
                <span className="text-amber-400">Couldn't find a video id in that input yet.</span>
              )}
            </>
          ) : (
            <>
              <span className="font-mono-label inline-flex items-center gap-1.5 text-[0.62rem] uppercase tracking-[0.16em]">
                No link handy? Try a sample
              </span>
              {SAMPLE_VIDEOS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => {
                    setUrl(s.url);
                    handleLookup(s.url);
                  }}
                  className="rounded-full border border-border/70 bg-background/50 px-3 py-1 font-medium text-foreground/80 transition-all duration-300 hover:-translate-y-px hover:border-primary/60 hover:text-primary"
                >
                  {s.label}
                </button>
              ))}
            </>
          )}
        </div>

        {/* In-flight ladder */}
        {phase === "loading-video" && <StageLadder stages={VIDEO_STAGES} active />}

        {/* Hard errors (step 1) */}
        {error && phase !== "pick-language" && phase !== "loading-transcript" && (
          <Alert variant="destructive" className="animate-fade-in mt-5 rounded-xl">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>Couldn't continue</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </form>

      {/* ── Step 2 — video + language ─────────────────────────────────── */}
      {(phase === "pick-language" || phase === "loading-transcript" || phase === "done") && video && (
        <div className="panel animate-fade-up mt-4 p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="num flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[0.68rem] font-bold text-primary">
                2
              </span>
              <h2 className="font-mono-label text-[0.65rem] uppercase tracking-ultra text-muted-foreground">
                Confirm video &amp; language
              </h2>
              {video.demo && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[0.62rem] font-semibold text-amber-400">
                  <FlaskConical className="h-3 w-3" aria-hidden="true" /> Demo data
                </span>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => reset()}
              className="h-8 gap-1.5 rounded-lg text-xs text-muted-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Start over
            </Button>
          </div>

          <div className="mt-4">
            <VideoPreview video={video} />
          </div>

          {error && !showLanguageError && (
            <Alert className="animate-fade-in mt-4 rounded-xl border-amber-500/30 bg-amber-500/5">
              <AlertCircle className="h-4 w-4 text-amber-500" aria-hidden="true" />
              <AlertTitle className="text-amber-500">Heads up</AlertTitle>
              <AlertDescription className="text-amber-600 dark:text-amber-200/85">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Language unavailable → offer the fix inline */}
          {showLanguageError && (
            <Alert className="animate-fade-in mt-4 rounded-xl border-primary/40 bg-primary/5">
              <Wand2 className="h-4 w-4 text-primary" aria-hidden="true" />
              <AlertTitle>That language isn't on this video</AlertTitle>
              <AlertDescription className="space-y-3">
                <span>{error}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="caption-button btn-shine mt-1 h-9 rounded-lg text-xs"
                  onClick={retryWithTranslation}
                >
                  <Wand2 className="h-3.5 w-3.5" aria-hidden="true" /> Turn on auto-translate &amp; retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-5">
            <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
              <Languages className="h-4 w-4 text-primary" aria-hidden="true" />
              Caption language
              {video.tracks.length > 0 && (
                <span className="num text-xs font-normal text-muted-foreground">
                  — {video.tracks.length} track{video.tracks.length === 1 ? "" : "s"} on this video
                </span>
              )}
            </p>

            {video.tracks.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Caption language">
                {video.tracks.map((t) => {
                  const active = language === t.languageCode;
                  return (
                    <button
                      key={`${t.languageCode}-${t.kind}`}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        setLanguage(t.languageCode);
                        setErrorCode(null);
                        setError(null);
                      }}
                      className={cn(
                        "group inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all duration-300",
                        active
                          ? "-translate-y-px border-primary/70 bg-primary/12 text-foreground shadow-[0_0_0_1px_hsl(var(--primary)/0.45),0_10px_28px_-14px_hsl(var(--brand-1)/0.9)]"
                          : "border-border/70 bg-background/50 text-muted-foreground hover:-translate-y-px hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      {active && <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}
                      {t.languageName}
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[0.6rem] font-semibold",
                          t.kind === "auto"
                            ? "bg-amber-500/15 text-amber-500"
                            : "bg-emerald-500/15 text-emerald-500",
                        )}
                      >
                        {t.kind === "auto" ? "Auto" : "Manual"}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No tracks listed — extraction will attempt English and auto-translate if needed.
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={handleExtract}
              disabled={phase === "loading-transcript"}
              className="caption-button btn-shine h-12 rounded-xl px-8 text-[0.95rem]"
            >
              {phase === "loading-transcript" ? (
                <>
                  <Equaliser /> Extracting…
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" aria-hidden="true" /> Extract transcript
                </>
              )}
            </Button>
            {!settings.autoTranslate && (
              <span className="font-mono-label text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">
                auto-translate off · exact track only
              </span>
            )}
          </div>

          {phase === "loading-transcript" && <StageLadder stages={TRANSCRIPT_STAGES} active />}
        </div>
      )}

      {/* ── Step 3 — the transcript ───────────────────────────────────── */}
      {phase === "done" && result && video && (
        <div id="transcript-result" className="scroll-mt-24">
          <CaptionDisplay result={result} thumbnail={video.thumbnail} />
        </div>
      )}
    </div>
  );
};

export default Extractor;
