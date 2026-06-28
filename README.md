# Musician

Personal YouTube audio library — metadata in Supabase, audio stored locally on each device for offline playback.

## Stack

- **apps/web** — Next.js PWA (mobile-first, dark OLED UI)
- **apps/api** — NestJS + yt-dlp + ffmpeg
- **supabase/** — Postgres schema + RLS
- **packages/shared** — shared TypeScript types

## Prerequisites

- Node.js 20+
- pnpm
- Python 3 + `yt-dlp` + `ffmpeg` (local API dev)
- Supabase project with Email + Google auth enabled

## Setup

### 1. Supabase

Run the migration in the Supabase SQL editor or via CLI:

```bash
# supabase/migrations/20250628120000_init.sql
```

In Supabase Dashboard:

- Enable **Email** and **Google** providers
- Add redirect URL: `http://localhost:3000/auth/callback`
- Promote an admin: `update profiles set role = 'admin' where email = 'you@example.com';`

### 2. Environment

```bash
cp apps/web/.env.local.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
```

Fill in your Supabase URL and anon key.

### 3. Install & run

```bash
pnpm install
pnpm dev:api   # http://localhost:3001
pnpm dev:web   # http://localhost:3000
```

### 4. PWA / offline

- Add tracks while online — audio saves to **IndexedDB**
- Install to home screen on phone
- Turn off Wi‑Fi — saved tracks still play from local storage
- App shell cached by service worker (`public/sw.js`)

## Deploy (use anywhere + install on phone)

**Full guide:** [DEPLOY.md](./DEPLOY.md)

Quick summary:
1. **Railway** — deploy API (`railway.toml` + Dockerfile)
2. **Vercel** — deploy web (`apps/web`, root directory)
3. **Supabase** — add production redirect URL
4. On phone — open your Vercel URL → **Add to Home Screen**

Saved tracks play **offline**. Internet only needed to add new YouTube links.

## UI design

Design system generated with [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) — see `design-system/musician/MASTER.md`.
