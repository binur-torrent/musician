"use client";

import { useEffect, useRef } from "react";
import type { Track } from "@musician/shared";
import { getTrackAudio } from "@/lib/audio-storage";
import {
  useCurrentTrack,
  usePlayerStore,
} from "@/stores/player-store";
import { MiniPlayer } from "@/components/mini-player";

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrack = useCurrentTrack();
  const audioUrl = usePlayerStore((s) => s.audioUrl);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setPlaying = usePlayerStore((s) => s.setPlaying);
  const next = usePlayerStore((s) => s.next);
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const playTrack = usePlayerStore((s) => s.playTrack);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      void audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, audioUrl, setPlaying]);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function loadCurrentTrack() {
      const track = queue[currentIndex];
      if (!track) return;

      if (audioUrl) return;

      const local = await getTrackAudio(track.id);
      if (cancelled || !local?.blob) return;

      objectUrl = URL.createObjectURL(local.blob);
      playTrack(track, objectUrl);
    }

    void loadCurrentTrack();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [queue, currentIndex, audioUrl, playTrack]);

  return (
    <>
      {children}
      <audio
        ref={audioRef}
        src={audioUrl ?? undefined}
        preload="metadata"
        onEnded={() => next()}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      {currentTrack && audioUrl ? <MiniPlayer audioRef={audioRef} /> : null}
    </>
  );
}

export async function playTrackFromLibrary(track: Track) {
  const local = await getTrackAudio(track.id);
  if (!local?.blob) {
    throw new Error("Audio not available offline. Re-download this track.");
  }
  const url = URL.createObjectURL(local.blob);
  usePlayerStore.getState().playTrack(track, url);
}
