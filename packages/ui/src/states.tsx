import { AlertCircle, Inbox, Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground" role="status" aria-live="polite">
      <Loader2 className="size-6 animate-spin text-primary" />
      <p className="text-[13px]">{label}</p>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-destructive/30 py-16 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="size-5 text-destructive" />
      </div>
      <div>
        <p className="text-[15px] font-medium">No se pudo cargar</p>
        <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="mt-1 flex h-8 items-center rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-foreground transition-all hover:brightness-105">
          Reintentar
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
      <div className="mb-1 flex size-11 items-center justify-center rounded-full bg-muted">
        <Inbox className="size-5 text-muted-foreground" />
      </div>
      <p className="text-[15px] font-medium">{title}</p>
      {description && <p className="max-w-sm text-[13px] text-muted-foreground">{description}</p>}
      {action}
    </div>
  )
}
