FROM node:22-bookworm-slim AS base

FROM base AS build
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/tsconfig.json apps/web/next.config.ts apps/web/postcss.config.mjs apps/web/eslint.config.mjs ./apps/web/
COPY apps/web/src ./apps/web/src
COPY apps/web/public ./apps/web/public
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src

ENV CI=true

RUN echo "node-linker=hoisted" > .npmrc \
  && corepack enable \
  && corepack prepare pnpm@10.27.0 --activate \
  && pnpm install --frozen-lockfile --filter @musician/web... \
  && pnpm --filter @musician/web build

FROM base AS runner
WORKDIR /app

ENV CI=true
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public

RUN echo "node-linker=hoisted" > .npmrc \
  && corepack enable \
  && corepack prepare pnpm@10.27.0 --activate \
  && pnpm install --frozen-lockfile --prod --filter @musician/web...

# Railway injects PORT at runtime — do not hardcode it in service variables
EXPOSE 3000

CMD ["pnpm", "--filter", "@musician/web", "start", "--", "--hostname", "0.0.0.0"]
