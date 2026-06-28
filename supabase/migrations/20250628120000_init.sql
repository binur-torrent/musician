-- Musician: metadata-only schema (audio stored locally on devices)

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Tracks (metadata only; audio bytes live in client IndexedDB)
create type public.track_status as enum ('pending', 'downloading', 'ready', 'failed');

create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  youtube_url text not null,
  youtube_id text not null,
  title text not null,
  thumbnail_url text,
  duration_seconds integer,
  status public.track_status not null default 'pending',
  error_message text,
  local_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, youtube_id)
);

create index tracks_user_id_idx on public.tracks (user_id);
create index tracks_status_idx on public.tracks (status);

-- Playlists
create table public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index playlists_user_id_idx on public.playlists (user_id);

-- Playlist tracks (ordered)
create table public.playlist_tracks (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists (id) on delete cascade,
  track_id uuid not null references public.tracks (id) on delete cascade,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (playlist_id, track_id)
);

create index playlist_tracks_playlist_id_idx on public.playlist_tracks (playlist_id);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger tracks_updated_at before update on public.tracks
  for each row execute function public.set_updated_at();
create trigger playlists_updated_at before update on public.playlists
  for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.tracks enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_tracks enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Tracks policies
create policy "Users manage own tracks"
  on public.tracks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins view all tracks"
  on public.tracks for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Playlists policies
create policy "Users manage own playlists"
  on public.playlists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Playlist tracks policies
create policy "Users manage own playlist tracks"
  on public.playlist_tracks for all
  using (
    exists (
      select 1 from public.playlists pl
      where pl.id = playlist_id and pl.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.playlists pl
      where pl.id = playlist_id and pl.user_id = auth.uid()
    )
  );
