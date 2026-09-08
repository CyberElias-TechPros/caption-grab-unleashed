import React from "react";
import { ExternalLink, Play } from "lucide-react";
import type { VideoInfo } from "@/lib/api";
import { formatCount, formatDuration } from "@/lib/format";
import { youtubeWatchUrl } from "@/lib/youtube";

const VideoPreview: React.FC<{ video: VideoInfo }> = ({ video }) => (
  <div className="animate-fade-up overflow-hidden rounded-2xl border border-border/70 bg-card/60">
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
          className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;
          }}
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-black shadow-lg">
            <Play className="ml-0.5 h-5 w-5 fill-current" />
          </span>
        </span>
        {video.lengthSeconds > 0 && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-[0.7rem] font-semibold text-white">
            {formatDuration(video.lengthSeconds)}
          </span>
        )}
      </a>

      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-[0.95rem] font-semibold leading-snug">{video.title}</h3>
        <p className="mt-1 truncate text-sm text-muted-foreground">{video.author}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {video.viewCount != null && video.viewCount > 0 && (
            <span>{formatCount(video.viewCount)} views</span>
          )}
          <span
            className={
              video.captionsAvailable ? "font-medium text-emerald-500" : "font-medium text-amber-500"
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
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Open on YouTube <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  </div>
);

export default VideoPreview;
