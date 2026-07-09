'use client'

import { useState } from 'react'
import { Loader2, LogIn, PenLine } from 'lucide-react'
import { authApi } from '@org/ui'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await authApi.login({ email, password })
      window.location.href = '/dashboard'
    } catch (err) {
      const m = err as { response?: { data?: { message?: string } } }
      setError(m?.response?.data?.message || 'Credenciales incorrectas. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <PenLine className="size-4.5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Relay</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <h1 className="text-[19px] font-semibold tracking-tight">Inicia sesión</h1>
          <p className="mt-1 mb-5 text-[13px] text-muted-foreground">
            Accede para redactar y enviar mensajes con IA.
          </p>

          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium">Correo</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium">Contraseña</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
              />
            </label>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-[13px] text-destructive" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex h-10 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-all hover:brightness-105 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
              {loading ? 'Entrando…' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
