export type TrackStatus = 'pending' | 'downloading' | 'ready' | 'failed';

export interface Track {
  id: string;
  user_id: string;
  youtube_url: string;
  youtube_id: string;
  title: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  status: TrackStatus;
  error_message: string | null;
  local_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  track_id: string;
  position: number;
  created_at: string;
}

export interface YoutubeMetadata {
  youtube_id: string;
  title: string;
  thumbnail_url: string;
  duration_seconds: number;
}

export interface CreateTrackRequest {
  youtube_url: string;
}

export interface CreateTrackResponse {
  track: Track;
}

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export const LOCAL_AUDIO_DB = 'musician-audio';
export const LOCAL_AUDIO_STORE = 'tracks';
