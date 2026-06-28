"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  downloadTrackAudio,
  fetchYoutubeMetadata,
} from "@/lib/api-client";
import { saveTrackAudio } from "@/lib/audio-storage";

export function AddTrackForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const metadata = await fetchYoutubeMetadata(url);

      const { data: track, error: insertError } = await supabase
        .from("tracks")
        .insert({
          user_id: user.id,
          youtube_url: url.trim(),
          youtube_id: metadata.youtube_id,
          title: metadata.title,
          thumbnail_url: metadata.thumbnail_url,
          duration_seconds: metadata.duration_seconds,
          status: "downloading",
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          throw new Error("This video is already in your library");
        }
        throw insertError;
      }

      const blob = await downloadTrackAudio(url.trim());
      const localKey = track.id;
      await saveTrackAudio(track.id, blob);

      const { error: updateError } = await supabase
        .from("tracks")
        .update({
          status: "ready",
          local_key: localKey,
          error_message: null,
        })
        .eq("id", track.id);

      if (updateError) throw updateError;

      setSuccess(`Saved "${metadata.title}" for offline playback`);
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add track");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div>
        <label htmlFor="youtube-url" className="mb-2 block text-sm font-medium">
          YouTube link
        </label>
        <input
          id="youtube-url"
          type="url"
          required
          placeholder="https://youtube.com/watch?v=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-foreground outline-none ring-accent focus:ring-2"
        />
      </div>

      {error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">
          {success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading || !url.trim()}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        {loading ? "Downloading audio…" : "Save for offline"}
      </button>

      <p className="text-xs text-muted-foreground">
        Audio is stored on this device only. You can listen without Wi‑Fi once
        saved.
      </p>
    </form>
  );
}
