# Deploy Musician — use anywhere, install on phone

Musician is a **PWA** (Progressive Web App). Once deployed to HTTPS, you install it on your phone like a native app. Saved tracks play **offline** from your device — no App Store needed.

## How it works in production

| What | Where |
|------|--------|
| App UI | Vercel (HTTPS) |
| YouTube extraction | Railway (NestJS + yt-dlp) |
| Login & playlists metadata | Supabase |
| **Audio files** | **On your phone/PC only** (IndexedDB) |

You need internet to **add new tracks**. Already-saved tracks play offline anywhere.

---

## Step 1 — Deploy API (Railway)

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
3. Select the `musician` repo
4. Railway detects `railway.toml` and builds from `apps/api/Dockerfile`
5. Add **Variables** (do **not** set `PORT` — Railway injects it automatically):

```
CORS_ORIGIN=https://YOUR-VERCEL-URL.vercel.app
SUPABASE_URL=https://nfuupczewbdynweumlrx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
YTDLP_PATH=yt-dlp
TEMP_DIR=/tmp/musician-audio
```

6. Deploy → copy the public URL, e.g. `https://musician-api-production.up.railway.app`

Health check: `https://YOUR-API-URL/api/health`

---

## Step 2 — Deploy Web (Vercel)

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import GitHub repo
2. Set **Root Directory** to `apps/web`
3. Add **Environment Variables**:

```
NEXT_PUBLIC_SUPABASE_URL=https://nfuupczewbdynweumlrx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=https://YOUR-API-URL/api
NEXT_PUBLIC_SITE_URL=https://YOUR-VERCEL-URL.vercel.app
```

4. Deploy → copy URL, e.g. `https://musician.vercel.app`

---

## Step 3 — Update Supabase

**Authentication → URL Configuration**

| Field | Value |
|-------|--------|
| Site URL | `https://YOUR-VERCEL-URL.vercel.app` |
| Redirect URLs | `https://YOUR-VERCEL-URL.vercel.app/auth/callback` |

Keep `http://localhost:3000/auth/callback` if you still develop locally.

---

## Step 4 — Update Google OAuth

In Google Cloud → your OAuth client:

**Authorized JavaScript origins**
- `https://YOUR-VERCEL-URL.vercel.app`

**Authorized redirect URIs** (unchanged)
- `https://nfuupczewbdynweumlrx.supabase.co/auth/v1/callback`

---

## Step 5 — Fix Railway CORS

After Vercel deploy, set Railway `CORS_ORIGIN` to your exact Vercel URL (no trailing slash).

Redeploy API if you changed it.

---

## Step 6 — Install on your phone

1. Open **https://YOUR-VERCEL-URL.vercel.app** in Safari (iPhone) or Chrome (Android)
2. Sign in
3. **iPhone:** Share → **Add to Home Screen**
4. **Android:** Menu → **Install app**

The Library page shows an install banner if you haven't added it yet.

---

## Using the app anywhere

1. **Online:** open app → Add → paste YouTube link → saves to device
2. **Offline:** open installed app → Library → play saved tracks
3. **New device:** sign in → metadata syncs → re-download tracks on that device (audio is per-device)

---

## Optional — custom domain

Point `musician.yourdomain.com` to Vercel, then update:
- Supabase redirect URLs
- Google JavaScript origins
- Railway `CORS_ORIGIN`
- Vercel `NEXT_PUBLIC_SITE_URL`

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Railway build fails on `python3: No such file or directory` during yt-dlp install | Dockerfile must download `yt-dlp_linux` (standalone binary), not the Python script named `yt-dlp` |
| Railway build fails on `pip3 install yt-dlp` | Fixed in latest Dockerfile — uses `yt-dlp_linux` binary instead of pip |
| Railway build fails on `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` | Pin pnpm in root `package.json` (`packageManager`) — Corepack was pulling pnpm 11, which blocks freshly published packages like `prettier` |
| Railway build fails on `pnpm install` | Ensure repo root has `pnpm-lock.yaml` committed; redeploy |
| Railway healthcheck fails on `/api/health` | Remove any manual `PORT` variable from Railway — the app must listen on Railway's injected `PORT`. Check **Deploy logs** for startup errors |
| Can't add tracks | `NEXT_PUBLIC_API_URL` must be your **Railway** URL + `/api`, not Vercel |
| CORS error | Railway `CORS_ORIGIN` must match Vercel URL exactly (no trailing slash) |
| Google login fails | Add production callback URL in Supabase |
| Install button missing (iOS) | Use Safari, not Chrome in-app browser |
| Offline play fails | Track must show **Offline** badge — re-download if needed |
| **API deployed to Vercel** | Won't work — Vercel can't run yt-dlp/ffmpeg. Use Railway only for API |
| **`{"message":"Cannot GET /","statusCode":404}` on Vercel URL** | Vercel is serving the **NestJS API**, not the Next.js app. In Vercel → Project Settings → **Root Directory** → set to `apps/web`, Framework **Next.js**, then redeploy. The API belongs on Railway only |
