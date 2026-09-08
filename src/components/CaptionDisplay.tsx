import React, { useEffect, useMemo, useState } from "react";
import {
  AlignLeft,
  Bot,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  Download,
  FileJson,
  FileText,
  Languages,
  ListVideo,
  Play,
  Search,
  User,
  WholeWord,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSettings, type ExportFormat } from "@/contexts/SettingsContext";
import type { TranscriptResult } from "@/lib/api";
import {
  copyText,
  countWords,
  downloadFile,
  formatClock,
  formatDuration,
  readingTime,
  slugifyFilename,
  toJson,
  toParagraphs,
  toPlainText,
  toSrt,
  toTimestampedText,
  toVtt,
} from "@/lib/format";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { cn } from "@/lib/utils";

interface Props {
  result: TranscriptResult;
  thumbnail: string;
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.trim().toLowerCase() ? <mark key={i}>{part}</mark> : part,
  );
}

const CaptionDisplay: React.FC<Props> = ({ result, thumbnail }) => {
  const { settings, updateSettings } = useSettings();
  const [query, setQuery] = useState("");
  const [seek, setSeek] = useState(0);
  const [view, setView] = useState<"segments" | "paragraphs">(settings.transcriptView);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setQuery("");
    setSeek(0);
    setView(settings.transcriptView);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.videoId, result.language]);

  const matches = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.trim().toLowerCase();
    const idx = new Set<number>();
    result.segments.forEach((s, i) => {
      if (s.text.toLowerCase().includes(q)) idx.add(i);
    });
    return idx;
  }, [query, result.segments]);

  const paragraphs = useMemo(() => toParagraphs(result.segments), [result.segments]);
  const words = useMemo(() => countWords(result.text), [result.text]);
  const duration = useMemo(() => {
    const last = result.segments[result.segments.length - 1];
    return last ? last.start + last.dur : 0;
  }, [result.segments]);

  const baseFilename = useMemo(
    () => slugifyFilename(`${result.title}-${result.language}`, `transcript-${result.videoId}`),
    [result.title, result.language, result.videoId],
  );

  const buildExport = (format: ExportFormat): { content: string; filename: string } => {
    switch (format) {
      case "srt":
        return { content: toSrt(result.segments), filename: `${baseFilename}.srt` };
      case "vtt":
        return { content: toVtt(result.segments), filename: `${baseFilename}.vtt` };
      case "json":
        return { content: toJson(result.segments), filename: `${baseFilename}.json` };
      case "timestamped":
        return { content: toTimestampedText(result.segments), filename: `${baseFilename}-timestamped.txt` };
      case "txt":
      default:
        return { content: result.text, filename: `${baseFilename}.txt` };
    }
  };

  const handleDownload = (format: ExportFormat) => {
    const { content, filename } = buildExport(format);
    downloadFile(content, filename, format === "json" ? "application/json" : "text/plain;charset=utf-8");
    toast.success("Download started", { description: filename });
  };

  const handleCopy = async (withTimestamps: boolean) => {
    const ok = await copyText(withTimestamps ? toTimestampedText(result.segments) : result.text);
    if (ok) {
      setCopied(true);
      toast.success("Copied to clipboard", {
        description: withTimestamps ? "Transcript with timestamps copied." : `${words.toLocaleString()} words copied.`,
      });
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Copy failed", { description: "Your browser blocked clipboard access." });
    }
  };

  return (
    <section className="animate-fade-up mt-4 overflow-hidden rounded-3xl border border-border/70 bg-card/70 backdrop-blur-xl">
      {/* Header */}
      <div className="border-b border-border/60 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[0.7rem] font-bold text-primary">
                3
              </span>
              Your transcript is ready
            </p>
            <h2 className="mt-2 line-clamp-2 font-display text-lg font-bold leading-snug sm:text-xl">
              {result.title}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{result.author}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
              <Languages className="h-3.5 w-3.5" /> {result.languageName}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "gap-1.5 rounded-full px-3 py-1",
                result.isAutoGenerated
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              )}
            >
              {result.isAutoGenerated ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
              {result.isAutoGenerated ? "Auto-generated" : "Creator captions"}
            </Badge>
            {result.translated && (
              <Badge variant="outline" className="rounded-full px-3 py-1">
                Translated to {result.requestedLanguage}
              </Badge>
            )}
          </div>
        </div>

        {/* Stats */}
        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { icon: WholeWord, label: "Words", value: words.toLocaleString() },
            { icon: ListVideo, label: "Segments", value: result.segments.length.toLocaleString() },
            { icon: Clock3, label: "Duration", value: formatDuration(duration) },
            { icon: FileText, label: "Reading time", value: readingTime(result.text) },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-background/60 px-3 py-2"
            >
              <s.icon className="h-4 w-4 shrink-0 text-primary" />
              <div className="leading-tight">
                <dt className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </dt>
                <dd className="text-sm font-bold">{s.value}</dd>
              </div>
            </div>
          ))}
        </dl>

        {/* Toolbar */}
        <div className="mt-4 flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search within the transcript…"
              aria-label="Search transcript"
              className="h-10 rounded-xl bg-background/80 pl-9 pr-16"
            />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {query.trim() && (
                <>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.7rem] font-semibold text-primary">
                    {matches?.size ?? 0}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="h-10 gap-2 rounded-xl" onClick={() => handleCopy(false)}>
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy text"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 gap-2 rounded-xl"
              onClick={() => handleDownload(settings.exportFormat)}
            >
              <Download className="h-4 w-4" /> Download .{settings.exportFormat === "timestamped" ? "txt" : settings.exportFormat}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="caption-button btn-shine h-10 gap-1.5 rounded-xl">
                  Export <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>Download transcript as</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleDownload("txt")}>
                  <FileText className="h-4 w-4" /> Plain text (.txt)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload("timestamped")}>
                  <Clock3 className="h-4 w-4" /> Timestamped text (.txt)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleDownload("srt")}>
                  <ListVideo className="h-4 w-4" /> SubRip subtitles (.srt)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload("vtt")}>
                  <Play className="h-4 w-4" /> WebVTT subtitles (.vtt)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload("json")}>
                  <FileJson className="h-4 w-4" /> Structured JSON (.json)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleCopy(true)}>
                  <Copy className="h-4 w-4" /> Copy with timestamps
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Body: transcript + sticky player */}
      <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 p-4 sm:p-6">
          <Tabs
            value={view}
            onValueChange={(v) => {
              setView(v as "segments" | "paragraphs");
              updateSettings({ transcriptView: v as "segments" | "paragraphs" });
            }}
          >
            <TabsList className="grid w-full max-w-xs grid-cols-2 rounded-xl">
              <TabsTrigger value="segments" className="gap-2 rounded-lg">
                <ListVideo className="h-4 w-4" /> Segments
              </TabsTrigger>
              <TabsTrigger value="paragraphs" className="gap-2 rounded-lg">
                <AlignLeft className="h-4 w-4" /> Reading
              </TabsTrigger>
            </TabsList>

            <TabsContent value="segments" className="mt-4">
              <ol className="max-h-[480px] space-y-0.5 overflow-y-auto rounded-2xl border border-border/60 bg-background/40 p-2">
                {result.segments.map((seg, i) => {
                  const dimmed = matches !== null && !matches.has(i);
                  return (
                    <li
                      key={`${seg.start}-${i}`}
                      className={cn("segment-row", dimmed && "opacity-30")}
                    >
                      <button
                        type="button"
                        onClick={() => setSeek(seg.start)}
                        title={`Play from ${formatClock(seg.start)}`}
                        className="h-fit rounded-md bg-primary/10 px-2 py-1 font-mono text-[0.72rem] font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                      >
                        {formatClock(seg.start)}
                      </button>
                      <p className="text-[0.92rem] leading-relaxed text-foreground/90">
                        {highlight(seg.text, query)}
                      </p>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-2 text-xs text-muted-foreground">
                Tip: click any timestamp to jump the video to that moment.
              </p>
            </TabsContent>

            <TabsContent value="paragraphs" className="mt-4">
              <div className="max-h-[480px] space-y-4 overflow-y-auto rounded-2xl border border-border/60 bg-background/40 p-5">
                {paragraphs.map((p, i) => (
                  <p key={i} className="text-[0.95rem] leading-[1.8] text-foreground/90">
                    {highlight(p, query)}
                  </p>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="border-t border-border/60 bg-background/40 p-4 sm:p-6 lg:border-l lg:border-t-0">
          <div className="lg:sticky lg:top-24">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Preview
            </p>
            <div className="mt-3 overflow-hidden rounded-2xl border border-border/70 bg-black shadow-lg">
              <iframe
                key={`${result.videoId}-${Math.floor(seek)}`}
                src={youtubeEmbedUrl(result.videoId, seek)}
                title={result.title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="aspect-video w-full"
              />
            </div>
            <div className="mt-3 flex items-start gap-3">
              <img
                src={thumbnail}
                alt=""
                loading="lazy"
                className="h-12 w-20 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0">
                <p className="line-clamp-2 text-xs font-medium leading-snug">{result.title}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{result.author}</p>
              </div>
            </div>
            <p className="mt-4 rounded-xl border border-border/60 bg-card/60 p-3 text-xs leading-relaxed text-muted-foreground">
              Transcripts belong to the video creator and are provided for study, accessibility and
              fair-use purposes. Always credit the original video when quoting.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default CaptionDisplay;
