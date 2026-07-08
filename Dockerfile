# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @dnd-companion/shared build
RUN pnpm --filter @dnd-companion/api exec prisma generate
RUN pnpm --filter @dnd-companion/web build
RUN pnpm --filter @dnd-companion/api build
RUN pnpm --filter @dnd-companion/api deploy --prod /prod/api

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /prod/api ./
COPY --from=builder /app/apps/web/dist ./public

EXPOSE 3000

CMD ["node", "dist/main.js"]
