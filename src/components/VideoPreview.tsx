import React from "react";
import { ExternalLink, Play } from "lucide-react";
import type { VideoInfo } from "@/lib/api";
import { formatCount, formatDuration } from "@/lib/format";
import { youtubeWatchUrl } from "@/lib/youtube";

const POSTER_FALLBACK = "/poster-fallback.svg";

const VideoPreview: React.FC<{ video: VideoInfo }> = ({ video }) => (
  <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/50">
    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <a
        href={youtubeWatchUrl(video.videoId)}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block w-full shrink-0 overflow-hidden rounded-xl sm:w-52"
        aria-label={`Watch ${video.title} on YouTube`}
      >
        <img
          src={video.thumbnail}
          alt=""
          loading="lazy"
          className="aspect-video w-full object-cover transition-transform duration-700 ease-cinematic group-hover:scale-[1.07]"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src !== POSTER_FALLBACK) img.src = POSTER_FALLBACK;
          }}
        />
        <span
          className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.62)), radial-gradient(60% 60% at 50% 50%, hsl(var(--brand-2) / 0.28), transparent 70%)",
          }}
          aria-hidden="true"
        />
        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-500 group-hover:opacity-100">
          <span className="flex h-12 w-12 scale-90 items-center justify-center rounded-full bg-white/95 text-black shadow-lg transition-transform duration-500 ease-cinematic group-hover:scale-100">
            <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden="true" />
          </span>
        </span>
        {video.lengthSeconds > 0 && (
          <span className="num absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-[0.68rem] font-semibold text-white backdrop-blur-sm">
            {formatDuration(video.lengthSeconds)}
          </span>
        )}
      </a>

      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 font-display text-[1rem] font-bold leading-snug tracking-tight">
          {video.title}
        </h3>
        <p className="mt-1 truncate text-sm text-muted-foreground">{video.author}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {video.viewCount != null && video.viewCount > 0 && (
            <span className="num">{formatCount(video.viewCount)} views</span>
          )}
          <span
            className={
              video.captionsAvailable
                ? "font-medium text-emerald-500"
                : "font-medium text-amber-500"
            }
          >
            {video.captionsAvailable
              ? `${video.tracks.length} caption track${video.tracks.length === 1 ? "" : "s"} available`
              : "No caption tracks detected"}
          </span>
        </div>
        <a
          href={youtubeWatchUrl(video.videoId)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-brand-3"
        >
          Open on YouTube <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>
    </div>
  </div>
);

export default VideoPreview;
