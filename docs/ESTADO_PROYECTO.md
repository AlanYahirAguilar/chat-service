# Estado del proyecto — chat-monorepo

_Última actualización: 2026-07-08_

Resumen del trabajo para completar el flujo: **el usuario registra contactos (cada uno con su tono), da una orden simple (intent), la IA redacta el mensaje con ese tono y se envía por WhatsApp / Telegram / correo.**

---

## ✅ Hecho (código completo y verificado en vivo)

### Funcionalidad implementada

* **CRUD de contactos** (crear/listar/ver/editar/borrar), aislado por usuario vía **JWT**.
  + Microservicio: `apps/services/user-service/src/modules/user/contact.controller.ts` + `contact.service.ts` + DTOs `model/create.contact.dto.ts`,   `model/update.contact.dto.ts`.
  + Gateway (HTTP): `apps/gateway/src/proxies/contact/` (`contact.controller.ts`,   `contact.proxy.module.ts`,   `dto/`), registrado en `app.module.ts`.
  + Decorador nuevo: `apps/gateway/src/proxies/auth/decorators/current-user.decorator.ts`.
* **Envío de correo arreglado**: se agregó el handler `sendMail` faltante.
  + `apps/services/mail-service/src/modules/mail/mail.controller.ts` (`cmd: 'sendMail'`) + `mail.service.ts` (`sendGeneratedMail`) + plantilla `generatedMessageTemplate`.
* **IA genera asunto + cuerpo** para correo (el usuario solo da el intent; la IA autocompleta con el tono).
  + `apps/services/ia-service/src/modules/ia/ia.service.ts` (`generateMessage` ahora devuelve `{subject, message}` + helper `parseMailJson`).
* **Dispatcher** valida que el contacto pertenezca al usuario autenticado y pasa el canal a la IA.
  + `apps/services/user-service/src/modules/user/message-dispatcher.service.ts` + `.controller.ts`.
* **Chat endpoint protegido con JWT**: `apps/gateway/src/proxies/chat/chat.controller.ts`.

### Bugs / infra corregidos para poder correr

* **Dependencia faltante**: `whatsapp-service` importaba `@open-wa/wa-automate` pero **no estaba en su `package.json`** (el commit que migró de Baileys no la agregó). → Instalada.
* **Driver MySQL**: MySQL 8.4 usa `caching_sha2_password`, incompatible con el driver `mysql` viejo. → Se agregó `mysql2` (root deps) y `connectorPackage: 'mysql2'` en los 7 `type.orm.config.ts` (con *fallback* seguro a `mysql` en producción).
* **Fuga de datos corregida**: crear contacto devolvía el objeto `user` con el hash de contraseña. → Se elimina de la respuesta (`contact.service.ts`).
* **`@chat-monorepo/shared` compilado** (`packages/shared/dist`), que no venía compilado.

### Probado EN VIVO

* CRUD de contactos: POST / GET / PATCH (cambió tono) / DELETE (soft-delete). ✔
* IA + tono: FORMAL vs NEUTRO claramente distintos. ✔
* **Telegram: envío real confirmado** (llegó el mensaje). ✔
* Login real (JWT) + sesión en Redis. ✔
* Correo: la IA generó el correo correctamente; entrega bloqueada por AVG (ver abajo). ✔ (generación)

---

## ⛔ Pendiente / bloqueado

### 1. Antivirus AVG bloquea 2 canales (acción del usuario, NO es código)

AVG intercepta TLS (Web Shield / Mail Shield):
* **Correo (Gmail SMTP)**: AVG presenta cert `Untrusted Root` → Node rechaza (`unable to verify the first certificate`).
* **WhatsApp Web (OpenWA)**: WhatsApp Web no expone `window.Debug` → OpenWA hace timeout. Probable interferencia de AVG.
* **Acción**: pausar AVG *Web Shield* + *Mail Shield* (o excepciones para `smtp.gmail.com` y `web.whatsapp.com`) y reintentar. Un solo cambio desbloquea ambos.

### 2. WhatsApp (OpenWA) — fragilidad de la librería

* Ya instalada y el servicio arranca Chrome y carga WhatsApp Web, con captura de QR a imagen (`whatsapp.service.ts` con `useChrome:true` y guardado del QR en `C:\Users\Admin\Desktop\wa-qr.png`).
* OpenWA `4.76.0` (la última publicada) tiene problemas de compatibilidad con WhatsApp Web actual, agravados por AVG. Falta lograr el emparejamiento del QR.

### 3. Decisión de producto pendiente: modelo de envío multiusuario

* Hoy: **credenciales compartidas** (1 bot de Telegram, 1 WhatsApp, 1 Gmail) para todos. Lo "por usuario" son contactos + tono.
* Si se quiere que cada usuario envíe desde SUS cuentas (Modelo B), hay que mover credenciales del `.env` a la BD por usuario y ajustar el dispatcher. **Sin decidir.**

### 4. Limpieza opcional

* `whatsapp-service/package.json` aún lista `@whiskeysockets/baileys` (ya no se usa) — se puede quitar.
* El seeder de user-service (`npm run seed`) usa un DataSource propio con el driver viejo y falla; conviene agregarle `connectorPackage: 'mysql2'` o migrarlo.
* El `.env` local quedó apuntando a MySQL/Redis locales (`chat_db`, root/root). El `.env` de producción original (Azure) es distinto.

---

## ▶️ Cómo retomar (levantar en local)

1. Requisitos vivos: **MySQL 8.4 local** (BD `chat_db`, root/root) y **Redis local** (6379).
2. Compilar shared: `cd packages/shared && npx tsc`
3. Compilar servicios: en cada `apps/services/*` y `apps/gateway`: `npx nest build`
4. Arrancar **desde la raíz del repo** (para que tomen el `.env`), cada uno:
   

```
   node apps/services/auth-service/dist/main.js      # 4003
   node apps/services/user-service/dist/main.js      # 4002
   node apps/services/ia-service/dist/main.js         # 4004
   node apps/services/mail-service/dist/main.js       # 4005
   node apps/services/telegram-service/dist/main.js   # 4006
   node apps/services/redis-service/dist/main.js      # 4008  (obligatorio para login)
   node apps/gateway/dist/main.js                     # 4001  (HTTP + Swagger /docs)
   node apps/services/whatsapp-service/dist/main.js   # 4011  (QR)
   ```

5. **Swagger**: http://localhost:4001/docs · **Usuario de prueba**: `test@chat.local` / `Password123`
6. Flujo: `POST /api/auth/login` → luego `POST /api/contacts` (crear contacto con tono) → `POST /api/chat/send {contactId, prompt}`.

> Nota: los usuarios de prueba se crean por SQL (el seeder falla por el driver). El endpoint `/api/chat/send` y los de contactos requieren el JWT (cookie `Authentication` o `Authorization: Bearer` ).
