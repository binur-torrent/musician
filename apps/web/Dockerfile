FROM node:22-bookworm-slim

WORKDIR /app

# Workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Web app + shared package (everything needed to install & build)
COPY apps/web/package.json apps/web/tsconfig.json apps/web/next.config.ts apps/web/postcss.config.mjs ./apps/web/
COPY apps/web/src ./apps/web/src
COPY apps/web/public ./apps/web/public
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src

RUN corepack enable \
  && corepack prepare pnpm@10.27.0 --activate \
  && pnpm install --frozen-lockfile --filter @musician/web... \
  && pnpm --filter @musician/web build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["pnpm", "--filter", "@musician/web", "start"]
