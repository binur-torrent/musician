FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && pip3 install --break-system-packages yt-dlp

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src

RUN corepack enable && pnpm install --filter @musician/api...

COPY apps/api ./apps/api

RUN pnpm --filter @musician/api build

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "apps/api/dist/main.js"]
