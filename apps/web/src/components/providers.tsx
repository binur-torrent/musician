"use client";

import { PlayerProvider } from "@/components/player-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <PlayerProvider>{children}</PlayerProvider>;
}
