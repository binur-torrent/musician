"use client";

import type { RefObject } from "react";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import {
  useCurrentTrack,
  usePlayerStore,
} from "@/stores/player-store";

export function MiniPlayer({
  audioRef,
}: {
  audioRef: RefObject<HTMLAudioElement | null>;
}) {
  const track = useCurrentTrack();
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);

  if (!track) return null;

  return (
    <div className="fixed inset-x-0 bottom-16 z-50 border-t border-border bg-muted/95 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)]">
      <div className="mx-auto flex h-[72px] max-w-lg items-center gap-3 px-4">
        {track.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={track.thumbnail_url}
            alt=""
            className="h-12 w-12 shrink-0 rounded-md object-cover"
          />
        ) : (
          <div className="h-12 w-12 shrink-0 rounded-md bg-primary" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{track.title}</p>
          <p className="truncate text-xs text-muted-foreground">Offline ready</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous track"
            onClick={() => previous()}
            className="cursor-pointer rounded-full p-2 text-foreground hover:bg-background/60"
          >
            <SkipBack className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label={isPlaying ? "Pause" : "Play"}
            onClick={() => {
              togglePlay();
              const audio = audioRef.current;
              if (!audio) return;
              if (isPlaying) audio.pause();
              else void audio.play();
            }}
            className="cursor-pointer rounded-full bg-accent p-2.5 text-background hover:opacity-90"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="h-5 w-5 fill-current" />
            )}
          </button>
          <button
            type="button"
            aria-label="Next track"
            onClick={() => next()}
            className="cursor-pointer rounded-full p-2 text-foreground hover:bg-background/60"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
