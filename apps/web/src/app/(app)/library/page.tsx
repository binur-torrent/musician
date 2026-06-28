"use client";

import { useCallback, useEffect, useState } from "react";
import type { Track } from "@musician/shared";
import { InstallPrompt } from "@/components/install-prompt";
import { TrackRow } from "@/components/track-row";
import { createClient } from "@/lib/supabase/client";
import { deleteTrackAudio, saveTrackAudio } from "@/lib/audio-storage";
import { downloadTrackAudio } from "@/lib/api-client";

export default function LibraryPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTracks = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("tracks")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setTracks(data as Track[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadTracks();

    const supabase = createClient();
    const channel = supabase
      .channel("tracks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tracks" },
        () => void loadTracks(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadTracks]);

  async function handleDelete(track: Track) {
    const supabase = createClient();
    await deleteTrackAudio(track.id);
    await supabase.from("tracks").delete().eq("id", track.id);
    setTracks((prev) => prev.filter((t) => t.id !== track.id));
  }

  async function handleRedownload(track: Track) {
    const supabase = createClient();
    await supabase
      .from("tracks")
      .update({ status: "downloading", error_message: null })
      .eq("id", track.id);

    try {
      const blob = await downloadTrackAudio(track.youtube_url);
      await saveTrackAudio(track.id, blob);
      await supabase
        .from("tracks")
        .update({ status: "ready", local_key: track.id })
        .eq("id", track.id);
    } catch (err) {
      await supabase
        .from("tracks")
        .update({
          status: "failed",
          error_message:
            err instanceof Error ? err.message : "Download failed",
        })
        .eq("id", track.id);
    }

    void loadTracks();
  }

  return (
    <div className="space-y-4">
      <InstallPrompt />
      <div>
        <h2 className="text-2xl font-bold">Library</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tracks saved on this device play offline.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : tracks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-muted-foreground">No tracks yet.</p>
          <a href="/add" className="mt-2 inline-block text-accent hover:underline">
            Add your first track
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {tracks.map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              onDelete={(t) => void handleDelete(t)}
              onRedownload={(t) => void handleRedownload(t)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
