# Frontend · SyncSlot / Relay

Microfrontends **reales** con el enfoque oficial de Next.js: **Multi Zones**. Cada dominio es
una app Next independiente y desplegable por separado; el **shell** (host) las compone por
rewrites y todas comparten el app-shell y el design system desde **`@org/ui`**.

```
apps/web/
├─ shell/         Host (:3000) — rewrites a cada zona; "/" → /dashboard
├─ dashboard/     Microfrontend (:3001, basePath /dashboard)
├─ contacts/      Microfrontend (:3002, basePath /contacts, ruta /contacts/[id])
├─ composer/      Microfrontend (:3003, basePath /compose, lee ?contact=)
└─ history/       Microfrontend (:3004, basePath /history)

packages/
├─ ui/            @org/ui — design system + app-shell compartido
│  └─ src/
│     ├─ tokens.css            Design tokens (temas claro/oscuro)
│     ├─ atoms/ molecules/     Atomic Design (Avatar, ChannelBadge, ToneChip…)
│     ├─ feedback/Toaster
│     ├─ chrome/               AppShell, Sidebar, Topbar, MobileNav, CommandPalette
│     ├─ store.ts              Zustand (tema, toasts, sidebar) — estado de UI local por zona
│     ├─ data.ts services/     Datos mock + generación de mensaje (stub de IA)
│     └─ constants.ts (ROUTES, href) types.ts utils.ts
└─ shared/        Librería compartida de backend (NestJS)
```

## Cómo compone (Multi Zones)

- El **shell** (:3000) es el host: define los `rewrites` que enrutan cada prefijo a su zona
  (`/dashboard` → :3001, `/contacts` → :3002, `/compose` → :3003, `/history` → :3004) y
  redirige `/` a `/dashboard`.
- Cada zona es una app Next **independiente** que envuelve su página en `<AppShell active=…>`
  de `@org/ui`, por lo que el sidebar/topbar/command palette son idénticos en todas.
- La navegación **entre zonas** es por URL (`<a href>` con los helpers `href.*`), que caen en
  los rewrites del shell. Dentro de una zona se usa navegación normal de Next.
- El estado que cruza zonas viaja por la **URL** (ej. `/compose?contact=ana`); no hay store global
  compartido en runtime (cada zona tiene su propio proceso). El tema persiste en `localStorage`.

## Compartir el design system

`@org/ui` es un workspace consumido por cada app vía `transpilePackages: ['@org/ui']` (Next) y
escaneado por Tailwind v4 con `@source` para generar sus clases. Un solo origen de tokens,
átomos y chrome → misma identidad visual en todos los microfrontends.

## Puesta en marcha (desde la raíz del monorepo)

```bash
npm install -w @org/ui -w shell -w dashboard -w contacts -w composer -w history
npm run web:dev          # arranca las 5 apps en paralelo
npm run web:build        # build de las 5
```

Abrir **http://localhost:3000** (entra por el shell y navega entre microfrontends).

## Añadir un microfrontend nuevo

1. `apps/web/<name>` como app Next con `basePath: '/<name>'` y `transpilePackages: ['@org/ui']`.
2. Envolver sus páginas en `<AppShell active="<name>">` y añadir la entrada a `NavKey`/`ROUTES`
   en `@org/ui`.
3. Agregar su `rewrite` en `shell/next.config.js` y su script en el `package.json` raíz.
