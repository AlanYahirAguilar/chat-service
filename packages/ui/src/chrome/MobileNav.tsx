'use client'

import { LayoutDashboard, PenLine, Users } from 'lucide-react'
import { cn } from '../utils'
import { ROUTES } from '../constants'
import type { NavKey } from '../types'

const MOBILE_NAV: { key: NavKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
  { key: 'contacts', label: 'Contactos', icon: Users },
]

export function MobileNav({ active }: { active: NavKey }) {
  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-border bg-card/95 backdrop-blur md:hidden">
        {MOBILE_NAV.map(({ key, label, icon: Icon }) => (
          <a
            key={key}
            href={ROUTES[key]}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 text-[11px] font-medium transition-colors',
              active === key ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Icon className="size-5" />
            {label}
          </a>
        ))}
      </nav>

      <a
        href={ROUTES.compose}
        className="fixed right-5 bottom-20 z-30 flex size-13 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-transform active:scale-95 md:hidden"
        aria-label="Redactar mensaje"
      >
        <PenLine className="size-5" />
      </a>
    </>
  )
}
