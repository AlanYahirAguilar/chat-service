# Etapa 1: Dependencias y Construcción
FROM node:22-alpine AS builder
WORKDIR /app

# Copiamos archivos de la raíz del monorepo para iniciar
COPY package*.json ./

# Copiamos package.json de los paquetes para resolver workspaces de NPM
COPY packages/shared/package*.json ./packages/shared/
COPY apps/gateway/package*.json ./apps/gateway/
COPY apps/services/user-service/package*.json ./apps/services/user-service/
COPY apps/services/auth-service/package*.json ./apps/services/auth-service/
COPY apps/services/ia-service/package*.json ./apps/services/ia-service/
COPY apps/services/mail-service/package*.json ./apps/services/mail-service/
COPY apps/services/media-service/package*.json ./apps/services/media-service/
COPY apps/services/payment-service/package*.json ./apps/services/payment-service/
COPY apps/services/redis-service/package*.json ./apps/services/redis-service/
COPY apps/services/report-service/package*.json ./apps/services/report-service/
COPY apps/services/reservation-service/package*.json ./apps/services/reservation-service/
COPY apps/services/whatsapp-service/package*.json ./apps/services/whatsapp-service/

# Instalamos dependencias en la raíz
RUN npm ci

# Copiamos el resto del monorepo
COPY . .

# Limitamos memoria para el build si es necesario
ENV NODE_OPTIONS="--max-old-space-size=512"

# Compilamos todos los workspaces del monorepo
RUN npm run build

# Etapa 2: Producción (Runner)
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copiamos package.json mínimos para resoluciones
COPY package*.json ./
COPY apps/services/mail-service/package*.json ./apps/services/mail-service/
COPY packages/shared/package*.json ./packages/shared/

# Copiamos node_modules de producción y dist de la compilación anterior
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/services/mail-service/dist ./apps/services/mail-service/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

USER node

# El puerto del microservicio TCP
EXPOSE 4005

# Comando para iniciar la aplicación corriendo db:init-prod y levantando el servidor
CMD ["npm", "run", "start:prod", "--workspace=apps/services/mail-service"]

