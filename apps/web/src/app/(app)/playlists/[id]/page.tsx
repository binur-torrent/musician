"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Track } from "@musician/shared";
import { Play } from "lucide-react";
import { TrackRow } from "@/components/track-row";
import { playTrackFromLibrary } from "@/components/player-provider";
import { createClient } from "@/lib/supabase/client";
import { deleteTrackAudio, saveTrackAudio } from "@/lib/audio-storage";
import { downloadTrackAudio } from "@/lib/api-client";
import { usePlayerStore } from "@/stores/player-store";

export default function PlaylistDetailPage() {
  const params = useParams<{ id: string }>();
  const [playlistName, setPlaylistName] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [availableTracks, setAvailableTracks] = useState<Track[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const setQueue = usePlayerStore((s) => s.setQueue);

  const load = useCallback(async () => {
    const supabase = createClient();
    const playlistId = params.id;

    const { data: playlist } = await supabase
      .from("playlists")
      .select("name")
      .eq("id", playlistId)
      .single();
    setPlaylistName(playlist?.name ?? "Playlist");

    const { data: playlistTracks } = await supabase
      .from("playlist_tracks")
      .select("track_id, position, tracks(*)")
      .eq("playlist_id", playlistId)
      .order("position", { ascending: true });

    const playlistTrackRows =
      (playlistTracks as Array<{ tracks: Track }> | null) ?? [];
    setTracks(playlistTrackRows.map((row) => row.tracks).filter(Boolean));

    const { data: allTracks } = await supabase
      .from("tracks")
      .select("*")
      .eq("status", "ready")
      .order("title");
    setAvailableTracks((allTracks as Track[]) ?? []);
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addTrackToPlaylist() {
    if (!selectedTrackId) return;
    const supabase = createClient();
    const position = tracks.length;
    await supabase.from("playlist_tracks").insert({
      playlist_id: params.id,
      track_id: selectedTrackId,
      position,
    });
    setSelectedTrackId("");
    void load();
  }

  async function playAll() {
    if (tracks.length === 0) return;
    setQueue(tracks, 0);
    await playTrackFromLibrary(tracks[0]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">{playlistName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {tracks.length} track{tracks.length === 1 ? "" : "s"}
          </p>
        </div>
        {tracks.length > 0 ? (
          <button
            type="button"
            onClick={() => void playAll()}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-background hover:opacity-90"
          >
            <Play className="h-4 w-4 fill-current" />
            Play all
          </button>
        ) : null}
      </div>

      <div className="flex gap-2">
        <select
          value={selectedTrackId}
          onChange={(e) => setSelectedTrackId(e.target.value)}
          className="flex-1 rounded-xl border border-border bg-muted/50 px-3 py-2.5 outline-none"
        >
          <option value="">Add track from library…</option>
          {availableTracks.map((track) => (
            <option key={track.id} value={track.id}>
              {track.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void addTrackToPlaylist()}
          disabled={!selectedTrackId}
          className="cursor-pointer rounded-xl border border-border px-4 py-2.5 text-sm hover:bg-muted/60 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      <div className="space-y-3">
        {tracks.map((track) => (
          <TrackRow
            key={track.id}
            track={track}
            onDelete={async (t) => {
              const supabase = createClient();
              await supabase
                .from("playlist_tracks")
                .delete()
                .eq("playlist_id", params.id)
                .eq("track_id", t.id);
              void load();
            }}
            onRedownload={async (t) => {
              const supabase = createClient();
              const blob = await downloadTrackAudio(t.youtube_url);
              await saveTrackAudio(t.id, blob);
              await supabase
                .from("tracks")
                .update({ status: "ready", local_key: t.id })
                .eq("id", t.id);
              void load();
            }}
          />
        ))}
      </div>
    </div>
  );
}
