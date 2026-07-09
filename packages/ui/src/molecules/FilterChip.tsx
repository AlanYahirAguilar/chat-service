import { cn } from '../utils'

/** Chip de filtro reutilizable (usado en Contactos e Historial). */
export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[13px] font-medium transition-colors',
        active
          ? 'border-primary/40 bg-primary/[0.08] text-primary'
          : 'border-border bg-card text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
