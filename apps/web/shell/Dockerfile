# syntax=docker/dockerfile:1
# ─────────────────────────────────────────────────────────────
# apps/web/shell — Next.js (Multi Zone) · build standalone
# Contexto de build: RAÍZ del monorepo.
#   docker build -f apps/web/shell/Dockerfile .
# ─────────────────────────────────────────────────────────────

FROM node:22-alpine AS builder
WORKDIR /app

# Manifests de todos los workspaces (npm ci consistente con el lockfile)
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/
COPY apps/gateway/package.json ./apps/gateway/
COPY apps/services/auth-service/package.json ./apps/services/auth-service/
COPY apps/services/ia-service/package.json ./apps/services/ia-service/
COPY apps/services/mail-service/package.json ./apps/services/mail-service/
COPY apps/services/redis-service/package.json ./apps/services/redis-service/
COPY apps/services/telegram-service/package.json ./apps/services/telegram-service/
COPY apps/services/user-service/package.json ./apps/services/user-service/
COPY apps/services/whatsapp-service/package.json ./apps/services/whatsapp-service/
COPY apps/web/shell/package.json ./apps/web/shell/
COPY apps/web/dashboard/package.json ./apps/web/dashboard/
COPY apps/web/contacts/package.json ./apps/web/contacts/
COPY apps/web/composer/package.json ./apps/web/composer/

RUN npm ci

COPY . .

# NEXT_PUBLIC_* se hornea en el bundle del navegador en build-time.
# '/api' asume que el tráfico entra por el shell (rewrite same-origin).
ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build -w apps/web/shell

# ── runtime ──────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Next standalone respeta PORT y HOSTNAME en runtime
ENV HOSTNAME=0.0.0.0

# El output standalone replica la estructura del monorepo
COPY --from=builder /app/apps/web/shell/.next/standalone ./
COPY --from=builder /app/apps/web/shell/.next/static ./apps/web/shell/.next/static

USER node

EXPOSE 3000

CMD ["node", "apps/web/shell/server.js"]
