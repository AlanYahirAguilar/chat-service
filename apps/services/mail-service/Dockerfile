# syntax=docker/dockerfile:1
# ─────────────────────────────────────────────────────────────
# apps/services/mail-service — build multi-stage para monorepo npm workspaces
# Contexto de build: RAÍZ del monorepo.
#   docker build -f apps/services/mail-service/Dockerfile .
# ─────────────────────────────────────────────────────────────

# Etapa 1: dependencias + compilación
FROM node:22-alpine AS builder
WORKDIR /app

# Manifests de todos los workspaces (necesarios para que npm ci
# resuelva el árbol completo del lockfile)
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

# Instala TODO el árbol una sola vez (capa cacheada mientras no cambien los manifests)
RUN npm ci

# Código fuente (filtrado por .dockerignore)
COPY . .

ENV NODE_OPTIONS="--max-old-space-size=512"

# Compila SOLO la librería compartida y esta app
RUN npm run build -w packages/shared -w apps/services/mail-service

# Deja únicamente dependencias de producción
RUN npm prune --omit=dev

# Etapa 2: runtime mínimo
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/apps/services/mail-service/package.json ./apps/services/mail-service/package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/services/mail-service/dist ./apps/services/mail-service/dist

USER node

# Puerto por defecto en local; Railway inyecta PORT en runtime
EXPOSE 4005

CMD ["node", "apps/services/mail-service/dist/main"]
