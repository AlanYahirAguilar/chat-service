'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { LayoutDashboard, Loader2, PenLine, Search, Users } from 'lucide-react'
import { ROUTES } from '../constants'
import { useContacts } from '../hooks'
import { useUiStore } from '../store'
import { Avatar, Kbd } from '../atoms'
import { cn } from '../utils'

function go(href: string) {
  if (typeof window !== 'undefined') window.location.href = href
}

export function CommandPalette() {
  const paletteOpen = useUiStore((s) => s.paletteOpen)
  // El contenido solo se monta con la paleta abierta: así los contactos
  // se piden al abrirla y no en cada carga de página.
  if (!paletteOpen) return null
  return <PaletteContent />
}

function PaletteContent() {
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const { data: contacts, loading } = useContacts()

  const actions = useMemo(
    () => [
      { id: 'compose', label: 'Redactar mensaje nuevo', icon: PenLine, run: () => go(ROUTES.compose) },
      { id: 'dashboard', label: 'Ir al Dashboard', icon: LayoutDashboard, run: () => go(ROUTES.dashboard) },
      { id: 'contacts', label: 'Ver Contactos', icon: Users, run: () => go(ROUTES.contacts) },
    ],
    [],
  )

  const q = query.trim().toLowerCase()
  const filteredActions = actions.filter((a) => a.label.toLowerCase().includes(q))
  const filteredContacts = (contacts ?? []).filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.telegram.toLowerCase().includes(q),
  )

  // Lista plana para navegación con teclado: acciones primero, contactos después.
  const flat = useMemo(
    () => [
      ...filteredActions.map((a) => ({ key: `a-${a.id}`, run: a.run })),
      ...filteredContacts.map((c) => ({ key: `c-${c.id}`, run: () => go(`${ROUTES.compose}?contact=${c.id}`) })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, contacts],
  )
  const activeKey = flat[Math.min(cursor, flat.length - 1)]?.key

  useEffect(() => setCursor(0), [q])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPaletteOpen(false)
      else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setCursor((i) => Math.min(i + 1, flat.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setCursor((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        flat[Math.min(cursor, flat.length - 1)]?.run()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setPaletteOpen, flat, cursor])

  // Mantiene visible la opción activa al navegar con flechas.
  useEffect(() => {
    if (!activeKey) return
    listRef.current
      ?.querySelector(`[data-key="${CSS.escape(activeKey)}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [activeKey])

  const rowClass = (selected: boolean) =>
    cn(
      'flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm text-foreground transition-colors',
      selected ? 'bg-muted' : 'hover:bg-muted/60',
    )

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Paleta de comandos"
    >
      <button className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" aria-label="Cerrar" onClick={() => setPaletteOpen(false)} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-popover shadow-[0_8px_24px_rgba(0,0,0,0.18)] duration-150 animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar acciones o contactos…"
            className="h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {loading && <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />}
        </div>

        <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
          {filteredActions.length > 0 && (
            <div className="mb-1">
              <p className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Acciones</p>
              {filteredActions.map((a) => (
                <button
                  key={a.id}
                  data-key={`a-${a.id}`}
                  onClick={a.run}
                  onMouseEnter={() => setCursor(flat.findIndex((f) => f.key === `a-${a.id}`))}
                  className={rowClass(activeKey === `a-${a.id}`)}
                >
                  <a.icon className="size-4 text-muted-foreground" />
                  {a.label}
                </button>
              ))}
            </div>
          )}

          {filteredContacts.length > 0 && (
            <div>
              <p className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Escribir a…
              </p>
              {filteredContacts.map((c) => (
                <button
                  key={c.id}
                  data-key={`c-${c.id}`}
                  onClick={() => go(`${ROUTES.compose}?contact=${c.id}`)}
                  onMouseEnter={() => setCursor(flat.findIndex((f) => f.key === `c-${c.id}`))}
                  className={rowClass(activeKey === `c-${c.id}`)}
                >
                  <Avatar initials={c.initials} hue={c.avatarHue} className="size-7 text-[11px]" />
                  <span className="min-w-0 flex-1 truncate">
                    {c.name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {c.email || c.phone || c.telegram}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {!loading && filteredActions.length === 0 && filteredContacts.length === 0 && (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
              Sin resultados para “{query}”.
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Kbd>↑↓</Kbd>navegar</span>
          <span className="flex items-center gap-1"><Kbd>↵</Kbd>abrir</span>
          <span className="ml-auto flex items-center gap-1"><Kbd>esc</Kbd>cerrar</span>
        </div>
      </div>
    </div>
  )
}
