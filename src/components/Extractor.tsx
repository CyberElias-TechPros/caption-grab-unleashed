import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ClipboardPaste,
  FileText,
  Languages,
  Loader2,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import PlatformBadge from "@/components/PlatformBadge";
import VideoPreview from "@/components/VideoPreview";
import CaptionDisplay from "@/components/CaptionDisplay";
import { useSettings } from "@/contexts/SettingsContext";
import { useCaptionHistory } from "@/hooks/useCaptionHistory";
import {
  describeError,
  fetchTranscript,
  fetchVideoInfo,
  type TranscriptResult,
  type VideoInfo,
} from "@/lib/api";
import { SAMPLE_VIDEOS } from "@/config/apiConfig";
import {
  detectPlatform,
  extractYoutubeVideoId,
  getPlatformSupport,
} from "@/lib/youtube";
import { cn } from "@/lib/utils";

type Phase = "idle" | "loading-video" | "pick-language" | "loading-transcript" | "done";

const Extractor: React.FC = () => {
  const { settings } = useSettings();
  const { add } = useCaptionHistory();
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [video, setVideo] = useState<VideoInfo | null>(null);
  const [result, setResult] = useState<TranscriptResult | null>(null);
  const [language, setLanguage] = useState(settings.defaultLanguage);
  const [error, setError] = useState<string | null>(null);

  const platform = useMemo(() => detectPlatform(url), [url]);
  const support = useMemo(() => getPlatformSupport(platform), [platform]);
  const videoId = useMemo(() => extractYoutubeVideoId(url), [url]);
  const busy = phase === "loading-video" || phase === "loading-transcript";

  const reset = (keepUrl = true) => {
    if (!keepUrl) setUrl("");
    setPhase("idle");
    setVideo(null);
    setResult(null);
    setError(null);
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
        description: "Your browser blocked reading the clipboard — paste with Ctrl+V instead.",
      });
    }
  };

  const handleLookup = async (rawUrl?: string) => {
    const value = (rawUrl ?? url).trim();
    if (!value) {
      setError("Paste a YouTube link or video id to get started.");
      return;
    }
    const id = extractYoutubeVideoId(value);
    if (!id) {
      const p = detectPlatform(value);
      setError(getPlatformSupport(p).message);
      return;
    }
    setError(null);
    setResult(null);
    setPhase("loading-video");
    try {
      const info = await fetchVideoInfo(id);
      setVideo(info);
      const preferred =
        info.tracks.find((t) => t.languageCode.toLowerCase() === settings.defaultLanguage.toLowerCase()) ||
        info.tracks.find((t) => t.languageCode.toLowerCase().startsWith("en")) ||
        info.tracks[0];
      setLanguage(preferred?.languageCode || settings.defaultLanguage);
      setPhase("pick-language");
      if (!info.captionsAvailable) {
        setError(
          "YouTube reports no caption tracks for this video. You can still try extraction — auto-captions sometimes exist anyway.",
        );
      }
    } catch (e) {
      const { title, message } = describeError(e);
      setError(`${title}: ${message}`);
      setPhase("idle");
      toast.error(title, { description: message });
    }
  };

  const handleExtract = async () => {
    if (!video) return;
    setError(null);
    setPhase("loading-transcript");
    try {
      const transcript = await fetchTranscript(video.videoId, language);
      setResult(transcript);
      setPhase("done");
      if (settings.historyEnabled) add(transcript, video.thumbnail);
      toast.success("Transcript extracted", {
        description: `${transcript.segments.length} segments · ${transcript.languageName}${transcript.translated ? " (auto-translated)" : ""}`,
      });
      // Scroll the result into view on small screens.
      requestAnimationFrame(() => {
        document.getElementById("transcript-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (e) {
      const { title, message } = describeError(e);
      setError(`${title}: ${message}`);
      setPhase("pick-language");
      toast.error(title, { description: message });
    }
  };

  return (
    <div className="w-full">
      {/* Step 1 — URL input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleLookup();
        }}
        className="rounded-3xl border border-border/70 bg-card/70 p-4 shadow-[0_20px_80px_-24px_rgba(99,91,255,0.45)] backdrop-blur-xl sm:p-6"
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[0.7rem] font-bold text-primary">
            1
          </span>
          Paste a YouTube link
        </div>

        <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Input
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
              className="h-12 rounded-xl bg-background/80 pr-24 text-[0.95rem]"
            />
            <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
              {url && videoId && (
                <span className="hidden items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[0.7rem] font-semibold text-emerald-500 sm:inline-flex">
                  <Check className="h-3 w-3" /> Valid ID
                </span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handlePaste}
                className="h-9 gap-1.5 rounded-lg text-xs"
              >
                <ClipboardPaste className="h-4 w-4" /> Paste
              </Button>
            </div>
          </div>
          <Button
            type="submit"
            disabled={busy || !url.trim()}
            className="caption-button btn-shine h-12 rounded-xl px-6"
          >
            {phase === "loading-video" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
              </>
            ) : (
              <>
                Continue <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {url.trim() ? (
            <>
              <PlatformBadge platform={platform} />
              {!support.supported && <span>{support.message}</span>}
              {support.supported && !videoId && (
                <span className="text-amber-500">Couldn't find a video id in that input yet.</span>
              )}
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> No link handy? Try a sample:
              </span>
              {SAMPLE_VIDEOS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => {
                    setUrl(s.url);
                    handleLookup(s.url);
                  }}
                  className="rounded-full border border-border/70 px-3 py-1 font-medium text-foreground/80 transition-all hover:border-primary/60 hover:text-primary"
                >
                  {s.label}
                </button>
              ))}
            </>
          )}
        </div>

        {phase === "loading-video" && (
          <div className="mt-4 space-y-2" aria-label="Loading video details">
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        )}

        {error && phase !== "pick-language" && (
          <Alert variant="destructive" className="animate-fade-in mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Couldn't continue</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </form>

      {/* Step 2 — video + language */}
      {(phase === "pick-language" || phase === "loading-transcript" || phase === "done") && video && (
        <div className="animate-fade-up mt-4 rounded-3xl border border-border/70 bg-card/70 p-4 backdrop-blur-xl sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[0.7rem] font-bold text-primary">
                2
              </span>
              Confirm video & language
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => reset()}
              className="h-8 gap-1.5 rounded-lg text-xs text-muted-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Start over
            </Button>
          </div>

          <div className="mt-3">
            <VideoPreview video={video} />
          </div>

          {error && (
            <Alert className="animate-fade-in mt-3 border-amber-500/30 bg-amber-500/5">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-amber-600 dark:text-amber-400">Heads up</AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-300/90">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Languages className="h-4 w-4 text-primary" />
              Caption language
              {video.tracks.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground">
                  — {video.tracks.length} track{video.tracks.length === 1 ? "" : "s"} on this video
                </span>
              )}
            </p>
            {video.tracks.length > 0 ? (
              <div className="mt-2.5 flex flex-wrap gap-2" role="radiogroup" aria-label="Caption language">
                {video.tracks.map((t) => {
                  const active = language === t.languageCode;
                  return (
                    <button
                      key={`${t.languageCode}-${t.kind}`}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setLanguage(t.languageCode)}
                      className={cn(
                        "group inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all",
                        active
                          ? "border-primary/70 bg-primary/10 text-foreground shadow-[0_0_0_1px_hsl(var(--primary)/0.5)]"
                          : "border-border/70 bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      {active && <Check className="h-3.5 w-3.5 text-primary" />}
                      {t.languageName}
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold",
                          t.kind === "auto"
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        {t.kind === "auto" ? "Auto" : "Manual"}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                No tracks listed — extraction will attempt English and auto-translate if needed.
              </p>
            )}
          </div>

          <Button
            type="button"
            onClick={handleExtract}
            disabled={phase === "loading-transcript"}
            className="caption-button btn-shine mt-5 h-12 w-full rounded-xl text-[0.95rem] sm:w-auto sm:px-8"
          >
            {phase === "loading-transcript" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Extracting transcript…
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" /> Extract transcript
              </>
            )}
          </Button>

          {phase === "loading-transcript" && (
            <div className="mt-4 space-y-2" aria-label="Loading transcript">
              <Skeleton className="h-5 w-2/3 rounded-md" />
              <Skeleton className="h-5 w-full rounded-md" />
              <Skeleton className="h-5 w-5/6 rounded-md" />
              <Skeleton className="h-5 w-3/4 rounded-md" />
            </div>
          )}
        </div>
      )}

      {/* Step 3 — result */}
      {phase === "done" && result && video && (
        <div id="transcript-result" className="scroll-mt-24">
          <CaptionDisplay result={result} thumbnail={video.thumbnail} />
        </div>
      )}
    </div>
  );
};

export default Extractor;
