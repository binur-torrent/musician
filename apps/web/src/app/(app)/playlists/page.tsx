"use client";

import { useCallback, useEffect, useState } from "react";
import type { Playlist, Track } from "@musician/shared";
import Link from "next/link";
import { ListMusic, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("playlists")
      .select("*")
      .order("created_at", { ascending: false });
    setPlaylists((data as Playlist[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createPlaylist(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("playlists").insert({
      user_id: user.id,
      name: name.trim(),
    });

    setName("");
    void load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Playlists</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Organize your offline library.
        </p>
      </div>

      <form onSubmit={(e) => void createPlaylist(e)} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New playlist name"
          className="flex-1 rounded-xl border border-border bg-muted/50 px-4 py-2.5 outline-none ring-accent focus:ring-2"
        />
        <button
          type="submit"
          className="flex cursor-pointer items-center gap-1 rounded-xl bg-accent px-4 py-2.5 font-medium text-background hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Create
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : playlists.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
          No playlists yet.
        </div>
      ) : (
        <div className="space-y-2">
          {playlists.map((playlist) => (
            <Link
              key={playlist.id}
              href={`/playlists/${playlist.id}`}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-muted/40 p-4 transition-colors hover:bg-muted/70"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                <ListMusic className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium">{playlist.name}</p>
                {playlist.description ? (
                  <p className="text-xs text-muted-foreground">
                    {playlist.description}
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
