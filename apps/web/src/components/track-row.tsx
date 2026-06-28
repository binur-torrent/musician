"use client";

import type { Track } from "@musician/shared";
import { Loader2, Music2, Play, RefreshCw, Trash2 } from "lucide-react";
import { hasTrackAudio } from "@/lib/audio-storage";
import { playTrackFromLibrary } from "@/components/player-provider";
import { useEffect, useState } from "react";

function formatDuration(seconds: number | null) {
  if (!seconds) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TrackRow({
  track,
  onDelete,
  onRedownload,
}: {
  track: Track;
  onDelete: (track: Track) => void;
  onRedownload: (track: Track) => void;
}) {
  const [offlineReady, setOfflineReady] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    void hasTrackAudio(track.id).then(setOfflineReady);
  }, [track.id, track.status]);

  async function handlePlay() {
    if (!offlineReady) return;
    setPlaying(true);
    try {
      await playTrackFromLibrary(track);
    } finally {
      setPlaying(false);
    }
  }

  const statusLabel =
    track.status === "ready"
      ? offlineReady
        ? "Offline"
        : "Needs download"
      : track.status;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 p-3">
      {track.thumbnail_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={track.thumbnail_url}
          alt=""
          className="h-14 w-14 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Music2 className="h-6 w-6 text-foreground/70" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{track.title}</p>
        <p className="text-xs text-muted-foreground">
          {formatDuration(track.duration_seconds)} · {statusLabel}
        </p>
      </div>

      <div className="flex items-center gap-1">
        {track.status === "downloading" || track.status === "pending" ? (
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
        ) : offlineReady ? (
          <button
            type="button"
            aria-label={`Play ${track.title}`}
            onClick={() => void handlePlay()}
            disabled={playing}
            className="cursor-pointer rounded-full p-2 text-accent hover:bg-background/50"
          >
            <Play className="h-5 w-5 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            aria-label={`Re-download ${track.title}`}
            onClick={() => onRedownload(track)}
            className="cursor-pointer rounded-full p-2 text-foreground hover:bg-background/50"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        )}
        <button
          type="button"
          aria-label={`Delete ${track.title}`}
          onClick={() => onDelete(track)}
          className="cursor-pointer rounded-full p-2 text-destructive hover:bg-background/50"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
