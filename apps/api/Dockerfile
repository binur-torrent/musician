FROM node:22-bookworm-slim AS base

# Install ffmpeg + yt-dlp (standalone binary — no pip needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    curl \
  && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux \
    -o /usr/local/bin/yt-dlp \
  && chmod a+x /usr/local/bin/yt-dlp \
  && yt-dlp --version \
  && ffmpeg -version \
  && rm -rf /var/lib/apt/lists/*

FROM base AS build
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/tsconfig.json apps/api/tsconfig.build.json apps/api/nest-cli.json ./apps/api/
COPY apps/api/src ./apps/api/src
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src

ENV CI=true

RUN echo "node-linker=hoisted" > .npmrc \
  && corepack enable \
  && corepack prepare pnpm@10.27.0 --activate \
  && pnpm install --frozen-lockfile --filter @musician/api... \
  && pnpm --filter @musician/api build

FROM base AS runner
WORKDIR /app

ENV CI=true
ENV NODE_ENV=production
ENV TEMP_DIR=/tmp/musician-audio

RUN mkdir -p /tmp/musician-audio

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src
COPY --from=build /app/apps/api/dist ./apps/api/dist

RUN echo "node-linker=hoisted" > .npmrc \
  && corepack enable \
  && corepack prepare pnpm@10.27.0 --activate \
  && pnpm install --frozen-lockfile --prod --filter @musician/api...

# Railway injects PORT at runtime — do not hardcode it in service variables
EXPOSE 3001

CMD ["node", "apps/api/dist/main.js"]
