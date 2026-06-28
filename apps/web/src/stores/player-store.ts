"use client";

import type { Track } from "@musician/shared";
import { create } from "zustand";

interface PlayerState {
  queue: Track[];
  currentIndex: number;
  isPlaying: boolean;
  audioUrl: string | null;
  setQueue: (tracks: Track[], startIndex?: number) => void;
  playTrack: (track: Track, audioUrl: string) => void;
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
  next: () => void;
  previous: () => void;
  clear: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  currentIndex: 0,
  isPlaying: false,
  audioUrl: null,

  setQueue: (tracks, startIndex = 0) =>
    set({ queue: tracks, currentIndex: startIndex, isPlaying: false, audioUrl: null }),

  playTrack: (track, audioUrl) => {
    const { queue } = get();
    const index = queue.findIndex((t) => t.id === track.id);
    set({
      currentIndex: index >= 0 ? index : 0,
      queue: index >= 0 ? queue : [track, ...queue],
      audioUrl,
      isPlaying: true,
    });
  },

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setPlaying: (playing) => set({ isPlaying: playing }),

  next: () => {
    const { queue, currentIndex } = get();
    if (currentIndex < queue.length - 1) {
      set({ currentIndex: currentIndex + 1, isPlaying: true, audioUrl: null });
    }
  },

  previous: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1, isPlaying: true, audioUrl: null });
    }
  },

  clear: () =>
    set({ queue: [], currentIndex: 0, isPlaying: false, audioUrl: null }),
}));

export function useCurrentTrack() {
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  return queue[currentIndex] ?? null;
}
