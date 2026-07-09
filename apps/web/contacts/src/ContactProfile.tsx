'use client'

import { useState } from 'react'
import { ArrowLeft, Loader2, Mail, Pencil, PenLine, Phone, Send } from 'lucide-react'
import {
  CHANNELS,
  TONES,
  TONE_IDS,
  Avatar,
  ChannelIcon,
  ErrorState,
  LoadingState,
  ToneChip,
  cn,
  contactsApi,
  href,
  useContact,
  useUiStore,
  type BackendTone,
  type ToneId,
} from '@org/ui'
import { ContactFormModal } from './ContactFormModal'

const TONE_TO_BACKEND: Record<ToneId, BackendTone> = {
  formal: 'FORMAL',
  ejecutivo: 'NEUTRO',
  informal: 'INFORMAL',
  amistoso: 'INFORMAL',
  cercano: 'NEUTRO',
}

export function ContactProfile({ id }: { id: string }) {
  const { data: contact, loading, error, reload } = useContact(id)
  const addToast = useUiStore((s) => s.addToast)
  const [editOpen, setEditOpen] = useState(false)
  const [savingTone, setSavingTone] = useState<ToneId | null>(null)

  if (loading) return <LoadingState label="Cargando contacto…" />
  if (error) return <div className="p-8"><ErrorState message={error} onRetry={reload} /></div>
  if (!contact) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-8">
        <p className="text-muted-foreground">Contacto no encontrado.</p>
      </div>
    )
  }

  // Guarda el tono en el backend: es lo que la IA usará al redactar.
  async function handleToneChange(t: ToneId) {
    if (!contact || t === contact.tone || savingTone) return
    setSavingTone(t)
    try {
      await contactsApi.updateContact(contact.id, { tone: TONE_TO_BACKEND[t] })
      reload()
      addToast({ title: `Tono de ${contact.name.split(' ')[0]} actualizado`, variant: 'success' })
    } catch {
      addToast({ title: 'No se pudo actualizar el tono', variant: 'error' })
    } finally {
      setSavingTone(null)
    }
  }

  const infoItems = [
    { icon: Phone, value: contact.phone, label: 'Teléfono' },
    { icon: Mail, value: contact.email, label: 'Correo' },
    { icon: Send, value: contact.telegram, label: 'Telegram' },
  ].filter((i) => i.value)

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-8 md:px-8">
      <a href={href.contacts()} className="mb-5 flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" />
        Contactos
      </a>

      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar initials={contact.initials} hue={contact.avatarHue} className="size-16 text-xl" />
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">{contact.name}</h1>
            <p className="text-[13px] text-muted-foreground">
              {contact.phone || contact.email || contact.telegram}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ToneChip tone={contact.tone} />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                <ChannelIcon channel={contact.favoriteChannel} className="size-3" />
                {CHANNELS[contact.favoriteChannel].label}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href={href.compose(contact.id)} className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-all hover:brightness-105 active:scale-[0.98]">
            <PenLine className="size-4" />
            Redactar mensaje
          </a>
          <button onClick={() => setEditOpen(true)} className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Editar contacto">
            <Pencil className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Tono de voz</h2>
          <p className="mb-3 text-[13px] text-muted-foreground">
            La IA redactará los mensajes para {contact.name.split(' ')[0]} con este registro.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {TONE_IDS.map((t) => {
              const active = contact.tone === t
              const saving = savingTone === t
              return (
                <button
                  key={t}
                  onClick={() => handleToneChange(t)}
                  disabled={savingTone !== null}
                  aria-pressed={active}
                  className={cn(
                    'flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors disabled:opacity-60',
                    active
                      ? 'border-primary/40 bg-primary/[0.08] text-primary'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground',
                  )}
                >
                  {saving ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <span className={cn('size-2 rounded-full', TONES[t].dot)} />
                  )}
                  {TONES[t].label}
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-[13px] text-muted-foreground text-pretty">{TONES[contact.tone].description}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Datos de contacto</h2>
          {infoItems.length > 0 ? (
            <ul className="space-y-2.5 text-sm">
              {infoItems.map((i) => (
                <li key={i.label} className="flex items-center gap-2.5 text-muted-foreground">
                  <i.icon className="size-4 shrink-0" aria-label={i.label} />
                  <span className="min-w-0 truncate text-foreground">{i.value}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-muted-foreground">Sin datos. Edita el contacto para añadirlos.</p>
          )}
        </div>
      </div>

      {/* Modal de edición */}
      {editOpen && (
        <ContactFormModal
          mode="edit"
          contact={contact}
          onSuccess={() => { setEditOpen(false); reload() }}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  )
}
