'use client'

import { useEffect, type ReactNode } from 'react'
import { useUiStore } from '../store'
import { Toaster } from '../feedback'
import type { NavKey } from '../types'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileNav } from './MobileNav'
import { CommandPalette } from './CommandPalette'

const TITLES: Record<NavKey, string> = {
  dashboard: 'Dashboard',
  contacts: 'Contactos',
  compose: 'Redactar',
}

/**
 * Layout compartido por todos los microfrontends. Cada zona lo usa indicando
 * cuál está activa; el chrome (sidebar, topbar, command palette) es idéntico.
 */
export function AppShell({
  active,
  title,
  children,
}: {
  active: NavKey
  title?: string
  children: ReactNode
}) {
  const setTheme = useUiStore((s) => s.setTheme)
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen)
  const paletteOpen = useUiStore((s) => s.paletteOpen)

  // Sincroniza el tema persistido y activa el atajo ⌘K.
  useEffect(() => {
    const saved = localStorage.getItem('relay-theme')
    if (saved === 'dark' || saved === 'light') setTheme(saved)
  }, [setTheme])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(!paletteOpen)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [paletteOpen, setPaletteOpen])

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar active={active} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title ?? TITLES[active]} />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>
      </div>
      <MobileNav active={active} />
      <CommandPalette />
      <Toaster />
    </div>
  )
}
