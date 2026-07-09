# Despliegue en Railway — Relay Chat Service

Guía de despliegue del monorepo (npm workspaces) en Railway: **8 servicios backend**
(NestJS: 1 gateway HTTP + 7 microservicios TCP), **4 microfrontends** (Next.js Multi
Zones) y **2 datastores** (MySQL, Redis). Total: **14 servicios** en un proyecto Railway.

```
                    Internet
                       │
          ┌────────────┴───────────┐
          ▼ (dominio público)      ▼ (opcional, para consumir la API directa)
     ┌─────────┐              ┌─────────┐
     │  shell  │ ─ /api ────▶ │ gateway │──── HTTP público con /api/health
     └────┬────┘   rewrite    └────┬────┘
          │ rewrites por zona      │ TCP por red privada IPv6 (*.railway.internal)
   ┌──────┼──────┐        ┌───┬───┼────┬─────┬─────┬─────┐
   ▼      ▼      ▼        ▼   ▼   ▼    ▼     ▼     ▼     ▼
dashboard contacts composer auth user  ia  mail telegram redis-svc whatsapp
                            │    │                              │
                          MySQL MySQL                    volumen /data
                                        Redis (plugin)
```

## Decisiones técnicas (documentadas)

| Decisión | Motivo |
|---|---|
| `npm ci` en Dockerfiles (no pnpm) | El repo usa npm workspaces con `package-lock.json`; migrar el gestor rompería el lockfile y la compatibilidad |
| Root Directory = `/` en todos los servicios + `RAILWAY_DOCKERFILE_PATH` | Los builds necesitan el contexto completo del monorepo (packages/shared, lockfile raíz) |
| Rewrite `/api` en el shell → gateway | La cookie de sesión es `sameSite: 'strict'`; con dominios distintos el login no funcionaría. Con el proxy todo es same-origin y no se necesita CORS |
| `HOST='::'` en microservicios TCP | La red privada de Railway es **IPv6-only**; con `0.0.0.0` (IPv4) el gateway no podría conectar |
| `PORT` de Railway con fallback a `*_SERVICE_PORT` | Railway inyecta `PORT`; en local todo sigue igual |
| Volumen en `/data` para whatsapp-service | La sesión de Baileys (`WHATSAPP_AUTH_DIR=/data/baileys`) debe sobrevivir redeploys; si se pierde hay que re-vincular el teléfono |
| Health check solo en gateway y frontends | Railway solo hace health checks HTTP; los microservicios TCP no exponen HTTP (se cubren con restart policy) |

## Paso 0 — Prerrequisitos

1. Repo subido a GitHub (Railway despliega desde ahí).
2. Proyecto nuevo en Railway: `railway init` o dashboard.
3. Plugins del proyecto: **MySQL** y **Redis** (Railway los provisiona y expone
   `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`,
   `REDISHOST`, `REDISPORT`, `REDISPASSWORD` como variables referenciables).

## Paso 1 — Crear los 12 servicios de la app

Para **cada** servicio: *New Service → GitHub Repo* (el mismo repo), y en
*Settings*:

| Servicio (nombre en Railway) | Dockerfile Path (variable `RAILWAY_DOCKERFILE_PATH`) | Público | Health check |
|---|---|---|---|
| `gateway` | `apps/gateway/Dockerfile` | ✅ dominio | `/api/health` |
| `auth-service` | `apps/services/auth-service/Dockerfile` | ❌ | — |
| `user-service` | `apps/services/user-service/Dockerfile` | ❌ | — |
| `ia-service` | `apps/services/ia-service/Dockerfile` | ❌ | — |
| `mail-service` | `apps/services/mail-service/Dockerfile` | ❌ | — |
| `telegram-service` | `apps/services/telegram-service/Dockerfile` | ❌ | — |
| `redis-service` | `apps/services/redis-service/Dockerfile` | ❌ | — |
| `whatsapp-service` | `apps/services/whatsapp-service/Dockerfile` | ❌ | — |
| `shell` | `apps/web/shell/Dockerfile` | ✅ dominio | `/login` |
| `dashboard` | `apps/web/dashboard/Dockerfile` | ❌ | `/dashboard` |
| `contacts` | `apps/web/contacts/Dockerfile` | ❌ | `/contacts` |
| `composer` | `apps/web/composer/Dockerfile` | ❌ | `/compose` |

> **Importante:** deja *Root Directory* en `/` (raíz). El Dockerfile se
> selecciona añadiendo la variable `RAILWAY_DOCKERFILE_PATH` al servicio
> (o en Settings → Build → Dockerfile Path si tu plan lo muestra).
>
> **Nombres**: usa exactamente los de la tabla — los hosts internos
> (`<nombre>.railway.internal`) derivan del nombre del servicio.

## Paso 2 — Variables por servicio

Cada app tiene su plantilla en `<app>/.env.example`. Resumen:

### gateway
```
NODE_ENV=production
APP_URL=https://${{shell.RAILWAY_PUBLIC_DOMAIN}}
JWT_SECRET=<mismo valor que auth-service>
SESSION_TTL=900
COOKIE_ACCESS_MAX_AGE=900000
COOKIE_REFRESH_MAX_AGE=604800000
REDIS_HOST=${{Redis.REDISHOST}}
REDIS_PORT=${{Redis.REDISPORT}}
REDIS_PASSWORD=${{Redis.REDISPASSWORD}}
USER_SERVICE_HOST=user-service.railway.internal
AUTH_SERVICE_HOST=auth-service.railway.internal
IA_SERVICE_HOST=ia-service.railway.internal
MAIL_SERVICE_HOST=mail-service.railway.internal
TELEGRAM_SERVICE_HOST=telegram-service.railway.internal
WHATSAPP_SERVICE_HOST=whatsapp-service.railway.internal
REDIS_SERVICE_HOST=redis-service.railway.internal
USER_SERVICE_PORT=4002
AUTH_SERVICE_PORT=4003
IA_SERVICE_PORT=4004
MAIL_SERVICE_PORT=4005
TELEGRAM_SERVICE_PORT=4006
REDIS_SERVICE_PORT=4008
WHATSAPP_SERVICE_PORT=4011
```

### Microservicios TCP (todos)
```
NODE_ENV=production
HOST=::          ← imprescindible (red privada IPv6)
PORT=<su puerto de la tabla>   ← fija el puerto interno conocido por el gateway
```
Más las suyas propias:

- **auth-service / user-service** (MySQL + lo que consumen):
  ```
  DB_HOST=${{MySQL.MYSQLHOST}}
  DB_PORT=${{MySQL.MYSQLPORT}}
  DB_USERNAME=${{MySQL.MYSQLUSER}}
  DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
  DB_DATABASE=${{MySQL.MYSQLDATABASE}}
  DB_SSL=false
  DB_SYNCHRONIZE=false
  ```
  auth-service además: `JWT_SECRET`, `JWT_ACCESS_EXPIRES_IN=15m`,
  `JWT_REFRESH_EXPIRES_IN=7d`, `REDIS_HOST/PORT/PASSWORD` (referencias al plugin).
  user-service además: los `*_SERVICE_HOST/PORT` de ia, mail, telegram,
  whatsapp y auth (ver su `.env.example`).
- **ia-service**: `GEMINI_API_KEY`, `GEMINI_MODEL`
- **mail-service**: `MAIL_USER`, `MAIL_PASSWORD`
- **telegram-service**: `TELEGRAM_BOT_TOKEN`
- **redis-service**: `REDIS_HOST/PORT/PASSWORD` (referencias al plugin)
- **whatsapp-service**: `WHATSAPP_AUTH_DIR=/data/baileys` **+ volumen** (paso 3)

### Frontends
```
# shell (runtime)
DASHBOARD_URL=http://dashboard.railway.internal:3001
CONTACTS_URL=http://contacts.railway.internal:3002
COMPOSER_URL=http://composer.railway.internal:3003
API_URL=http://gateway.railway.internal:4001
PORT=3000

# shell + las 3 zonas (build-time; Railway pasa las vars al build)
NEXT_PUBLIC_API_URL=/api

# zonas (runtime)
PORT=3001 / 3002 / 3003 según la tabla
```

## Paso 3 — Volumen para WhatsApp

En `whatsapp-service`: *Settings → Volumes → New Volume* montado en **`/data`**.
Sin esto, cada deploy borra la sesión de Baileys y hay que re-vincular el
teléfono con un pairing code.

## Paso 4 — Orden de despliegue

1. MySQL y Redis (plugins) — ya corriendo.
2. Microservicios TCP: `auth-service` y `user-service` primero (crean BD/seeds
   vía `db:init-prod` en su arranque), luego ia, mail, telegram, redis-service,
   whatsapp-service.
3. `gateway` → probar `https://<gateway>/api/health` → `{"status":"ok"}`.
4. Zonas `dashboard`, `contacts`, `composer`.
5. `shell` → abrir `https://<shell>/login` y hacer login end-to-end.
6. Entrar a Redactar → canal WhatsApp → vincular con pairing code (una vez;
   queda en el volumen).

## Verificación post-deploy

- `GET https://<gateway>/api/health` → 200
- Login en el shell → cookie visible como HttpOnly y `Secure`
- Crear contacto → generar borrador (Gemini) → enviar por WhatsApp
- Redeploy de whatsapp-service → la sesión debe sobrevivir (volumen)

## Problemas conocidos / recomendaciones de producción

1. **`DB_SYNCHRONIZE`**: en el `.env` local está `true`. En producción debe ser
   `false` (los seeds/DDL corren con `db:init-prod`). Ya está así en las plantillas.
2. **Throttling en memoria**: el ThrottlerGuard del gateway no usa Redis; con
   varias réplicas el límite es por instancia. Suficiente con 1 réplica.
3. **Sin compresión HTTP**: el gateway no usa `compression`. Railway sirve
   detrás de su proxy; si sirves payloads grandes, añadir `compression` después.
4. **Timeouts/retries TCP**: los `ClientProxy` de Nest no traen retry
   configurado; un microservicio caído produce error inmediato (el gateway
   responde 500 y Railway reinicia el servicio caído). Aceptable; para
   endurecer, envolver `send()` con `retry`/`timeout` de RxJS.
5. **Baileys en contenedor**: WhatsApp puede pedir re-vinculación si detecta
   cambios de IP frecuentes. El volumen minimiza esto; evita redeploys
   innecesarios del whatsapp-service.
6. **`docker-compose.yml` legado**: referencia servicios inexistentes
   (media/payment/report/reservation) y una red externa `coolify`. No lo uses;
   se conserva solo como referencia histórica.
7. **Repo con merge sin resolver en `.gitignore`** (estado `UU` en git): resuélvelo
   antes de pushear (`git add .gitignore` tras revisar el contenido actual).
8. **Logs**: los servicios loguean a stdout (correcto para Railway). El logger
   custom imprime emojis/colores; si quieres logs estructurados JSON, cambiar
   `CustomLoggerService` después.
```
