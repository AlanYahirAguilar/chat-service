'use client'

import { Menu, Search } from 'lucide-react'
import { useUiStore } from '../store'
import { Kbd } from '../atoms'

export function Topbar({ title }: { title: string }) {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen)

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 md:px-6">
      <button
        onClick={toggleSidebar}
        className="hidden size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:flex"
        aria-label="Contraer barra lateral"
      >
        <Menu className="size-4" />
      </button>
      <h1 className="text-[15px] font-semibold md:hidden">Relay</h1>
      <span className="hidden text-[15px] font-semibold md:inline">{title}</span>

      <button
        onClick={() => setPaletteOpen(true)}
        className="ml-auto flex h-8 items-center gap-2 rounded-lg border border-border bg-card px-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted"
      >
        <Search className="size-3.5" />
        <span className="hidden sm:inline">Buscar…</span>
        <Kbd className="hidden sm:inline">⌘K</Kbd>
      </button>
    </header>
  )
}
