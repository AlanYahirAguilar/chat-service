'use client'

import { PenLine, Plus, Smartphone, Sparkles } from 'lucide-react'
import {
  Avatar,
  ErrorState,
  LoadingState,
  ToneChip,
  chatApi,
  cn,
  href,
  useAsync,
  useContacts,
} from '@org/ui'

function greeting() {
  const h = new Date().getHours()
  if (h < 6) return 'Buenas noches'
  if (h < 12) return 'Buenos días'
  if (h < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

/** Estado de la sesión de WhatsApp (GET /chat/whatsapp-status). */
function WhatsappCard() {
  const { data, loading } = useAsync(() => chatApi.getWhatsappStatus(), [])
  const connected = data?.status === 'connected'

  return (
    <a
      href={href.compose()}
      className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
    >
      <span className="relative flex size-9 items-center justify-center rounded-lg bg-muted text-foreground">
        <Smartphone className="size-4.5" />
        {!loading && (
          <span
            className={cn(
              'absolute -top-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-card',
              connected ? 'bg-success' : 'bg-warning',
            )}
          />
        )}
      </span>
      <span>
        <span className="block text-[15px] font-medium">
          {loading ? 'WhatsApp' : connected ? 'WhatsApp conectado' : 'Conectar WhatsApp'}
        </span>
        <span className="mt-0.5 block text-[13px] text-muted-foreground text-pretty">
          {loading
            ? 'Comprobando la sesión…'
            : connected
              ? 'Listo para enviar mensajes.'
              : 'Vincula tu número para poder enviar.'}
        </span>
      </span>
    </a>
  )
}

export function Dashboard() {
  const { data: contacts, loading, error, reload } = useContacts()
  const recentContacts = (contacts ?? []).slice(0, 6)

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 md:px-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-[28px]">
          {greeting()}
        </h1>
        <p className="mt-1.5 text-[15px] text-muted-foreground">
          Elige un contacto y deja que la IA redacte el mensaje en su tono y canal.
        </p>
      </header>

      {/* Acciones rápidas */}
      <div className="mb-10 grid gap-3 sm:grid-cols-3">
        <a
          href={href.compose()}
          className="group flex flex-col items-start gap-3 rounded-xl border border-primary/30 bg-primary/[0.04] p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <PenLine className="size-4.5" />
          </span>
          <span>
            <span className="block text-[15px] font-medium">Redactar mensaje</span>
            <span className="mt-0.5 block text-[13px] text-muted-foreground text-pretty">
              Escribe una intención y deja que la IA lo redacte.
            </span>
          </span>
        </a>

        <a
          href={href.contacts()}
          className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground">
            <Plus className="size-4.5" />
          </span>
          <span>
            <span className="block text-[15px] font-medium">Nuevo contacto</span>
            <span className="mt-0.5 block text-[13px] text-muted-foreground text-pretty">
              Añade una persona y define su tono.
            </span>
          </span>
        </a>

        <WhatsappCard />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold">Tus contactos</h2>
        <a href={href.contacts()} className="text-[13px] font-medium text-primary hover:underline">
          Ver todos
        </a>
      </div>

      {loading ? (
        <LoadingState label="Cargando contactos…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : recentContacts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-[15px] font-medium">Aún no tienes contactos</p>
          <p className="mt-1 text-[13px] text-muted-foreground">Crea tu primer contacto para empezar a enviar mensajes.</p>
          <a href={href.contacts()} className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-foreground">
            <Plus className="size-3.5" />
            Nuevo contacto
          </a>
        </div>
      ) : (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            {recentContacts.map((c) => (
              <a
                key={c.id}
                href={href.contact(c.id)}
                className="group flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                <Avatar initials={c.initials} hue={c.avatarHue} className="size-9 shrink-0 text-[13px]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="truncate text-[12px] text-muted-foreground">{c.email || c.phone || c.telegram}</p>
                </div>
                <ToneChip tone={c.tone} />
              </a>
            ))}
          </div>

          {/* Sugerencias a partir de contactos reales */}
          <div className="mt-6 rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h3 className="text-[13px] font-semibold">Empezar una conversación</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentContacts.slice(0, 4).map((c) => (
                <a
                  key={c.id}
                  href={href.compose(c.id)}
                  className="rounded-full border border-border bg-muted px-3 py-1 text-[13px] text-foreground transition-colors hover:border-primary/40 hover:bg-primary/[0.06]"
                >
                  Escribir a {c.name.split(' ')[0]}
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
