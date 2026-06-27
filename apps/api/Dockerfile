# API NestJS — imagen multi-stage
FROM node:22-slim AS base
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

# 1) Dependencias del workspace (api + contracts)
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/contracts packages/contracts
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
RUN pnpm install --filter @cmpc/api... --frozen-lockfile

# 2) Build: contratos + cliente Prisma + compilación Nest
FROM base AS build
COPY --from=deps /app ./
COPY . .
RUN pnpm --filter @cmpc/contracts build \
  && pnpm --filter @cmpc/api exec prisma generate \
  && pnpm --filter @cmpc/api build

# 3) Runtime
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app ./
# Ejecuta como usuario sin privilegios (no root).
RUN chown -R node:node /app
USER node
WORKDIR /app/apps/api
EXPOSE 3000
# Aplica migraciones; siembra SOLO si SEED_ON_START=true (nunca en producción por defecto); arranca.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && ([ \"$SEED_ON_START\" = \"true\" ] && node_modules/.bin/tsx prisma/seed.ts || true) && node dist/main.js"]
