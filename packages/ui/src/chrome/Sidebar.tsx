'use client'

import { useState } from 'react'
import { Command, LayoutDashboard, Loader2, LogOut, Moon, PenLine, Sun, Users } from 'lucide-react'
import { cn } from '../utils'
import { ROUTES } from '../constants'
import { useUiStore } from '../store'
import { Kbd } from '../atoms'
import * as authApi from '../api/auth'
import type { NavKey } from '../types'

const NAV: { key: NavKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'contacts', label: 'Contactos', icon: Users },
]

export function Sidebar({ active }: { active: NavKey }) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen)
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await authApi.logout()
    } finally {
      window.location.href = '/login'
    }
  }

  return (
    <aside
      className={cn(
        'hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 md:flex',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className="flex h-14 items-center gap-2.5 px-4">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <PenLine className="size-4" />
        </div>
        {!collapsed && (
          <span className="text-[15px] font-semibold tracking-tight text-sidebar-foreground">
            Relay
          </span>
        )}
      </div>

      <div className="px-3 pt-1 pb-3">
        <a
          href={ROUTES.compose}
          className={cn(
            'flex h-10 w-full items-center gap-2.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all hover:brightness-105 active:scale-[0.98]',
            collapsed && 'justify-center px-0',
          )}
        >
          <PenLine className="size-4 shrink-0" />
          {!collapsed && 'Redactar'}
        </a>
      </div>

      <nav className="flex flex-col gap-0.5 px-3">
        {NAV.map(({ key, label, icon: Icon }) => {
          const isActive = active === key || (key === 'contacts' && active === 'contacts')
          return (
            <a
              key={key}
              href={ROUTES[key]}
              className={cn(
                'flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                collapsed && 'justify-center px-0',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && label}
            </a>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-0.5 px-3 pb-3">
        <button
          onClick={() => setPaletteOpen(true)}
          className={cn(
            'flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
            collapsed && 'justify-center px-0',
          )}
        >
          <Command className="size-4 shrink-0" />
          {!collapsed && (
            <span className="flex flex-1 items-center justify-between">
              Buscar
              <Kbd className="px-1.5">⌘K</Kbd>
            </span>
          )}
        </button>

        <button
          onClick={toggleTheme}
          className={cn(
            'flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
            collapsed && 'justify-center px-0',
          )}
        >
          {theme === 'light' ? <Moon className="size-4 shrink-0" /> : <Sun className="size-4 shrink-0" />}
          {!collapsed && (theme === 'light' ? 'Modo oscuro' : 'Modo claro')}
        </button>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className={cn(
            'flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground disabled:pointer-events-none disabled:opacity-60',
            collapsed && 'justify-center px-0',
          )}
        >
          {loggingOut ? <Loader2 className="size-4 shrink-0 animate-spin" /> : <LogOut className="size-4 shrink-0" />}
          {!collapsed && (loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión')}
        </button>
      </div>
    </aside>
  )
}
