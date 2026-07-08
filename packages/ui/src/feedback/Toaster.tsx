'use client'

import { Check, CircleAlert, Info, X } from 'lucide-react'
import { cn } from '../utils'
import { useUiStore } from '../store'

export function Toaster() {
  const toasts = useUiStore((s) => s.toasts)
  const dismissToast = useUiStore((s) => s.dismissToast)

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:top-auto sm:right-6 sm:bottom-6 sm:items-end"
    >
      {toasts.map((t) => {
        const Icon =
          t.variant === 'success'
            ? Check
            : t.variant === 'error'
              ? CircleAlert
              : Info
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex w-full max-w-90 items-start gap-3 rounded-xl border border-border bg-popover p-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)] duration-200 animate-in fade-in slide-in-from-bottom-2"
            role="status"
          >
            <span
              className={cn(
                'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full',
                t.variant === 'success' && 'bg-success/15 text-success',
                t.variant === 'error' && 'bg-destructive/15 text-destructive',
                (!t.variant || t.variant === 'default') && 'bg-primary/15 text-primary',
              )}
            >
              <Icon className="size-3" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-popover-foreground text-pretty">
                {t.title}
              </p>
              {t.description && (
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  {t.description}
                </p>
              )}
              {t.actionLabel && (
                <button
                  onClick={() => {
                    t.onAction?.()
                    dismissToast(t.id)
                  }}
                  className="mt-2 text-[13px] font-medium text-primary hover:underline"
                >
                  {t.actionLabel}
                </button>
              )}
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Cerrar notificación"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
