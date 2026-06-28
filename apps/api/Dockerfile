FROM node:22-bookworm-slim

# Install ffmpeg + yt-dlp (standalone binary — no pip needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    curl \
  && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp \
  && chmod a+xx /usr/local/bin/yt-dlp \
  && yt-dlp --version \
  && ffmpeg -version \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# API + shared package (everything needed to install & build)
COPY apps/api/package.json apps/api/tsconfig.json apps/api/tsconfig.build.json apps/api/nest-cli.json ./apps/api/
COPY apps/api/src ./apps/api/src
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src

RUN corepack enable \
  && pnpm install --frozen-lockfile --filter @musician/api... \
  && pnpm --filter @musician/api build

ENV NODE_ENV=production

# Railway injects PORT at runtime
EXPOSE 3001

CMD ["node", "apps/api/dist/main.js"]
