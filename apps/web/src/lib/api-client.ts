import type { CreateTrackRequest, YoutubeMetadata } from "@musician/shared";
import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

async function getAccessToken() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token;
}

async function apiFetch(path: string, init?: RequestInit) {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? `API error ${response.status}`);
  }

  return response;
}

export async function fetchYoutubeMetadata(youtubeUrl: string) {
  const response = await apiFetch("/tracks/metadata", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ youtube_url: youtubeUrl } satisfies CreateTrackRequest),
  });
  const data = (await response.json()) as { metadata: YoutubeMetadata };
  return data.metadata;
}

export async function downloadTrackAudio(youtubeUrl: string) {
  const encoded = encodeURIComponent(youtubeUrl);
  const response = await apiFetch(`/tracks/audio?url=${encoded}`);
  return response.blob();
}
