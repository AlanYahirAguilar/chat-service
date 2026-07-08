'use client'

import { useEffect, useState } from 'react'
import {
  Check,
  CheckCheck,
  ChevronRight,
  Copy,
  Loader2,
  Pencil,
  RefreshCw,
  Send,
  Smartphone,
  Sparkles,
} from 'lucide-react'
import {
  CHANNELS,
  INTENT_SUGGESTIONS,
  REFINE_CHIPS,
  TONES,
  Avatar,
  ChannelIcon,
  Kbd,
  cn,
  href,
  useContacts,
  type Channel,
} from '@org/ui'
import { useMessageComposer } from './useMessageComposer'

export function Compose({ initialContactId }: { initialContactId?: string }) {
  const { data: contacts } = useContacts()
  const initialContact = initialContactId ? contacts?.find((c) => c.id === initialContactId) : undefined
  const {
    contact, channel, tone, intent, phase, message, streamed, editing, canGenerate, sending,
    waStatus, waChecking, pairCode, pairLoading, pairError,
    setChannel, setIntent, setMessage, setEditing, selectContact, runGeneration, send, reset,
    checkWhatsappStatus, requestPairCode, clearPairCode,
  } = useMessageComposer(initialContact)

  const [copied, setCopied] = useState(false)
  const [contactMenu, setContactMenu] = useState(false)

  const showWaPanel = channel === 'whatsapp' && waStatus === 'disconnected'

  useEffect(() => {
    if (phase !== 'preview' || editing) return
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target?.tagName === 'TEXTAREA' || target?.tagName === 'INPUT') return
      if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) {
        e.preventDefault()
        send()
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault()
        runGeneration()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, editing, intent, tone, channel, contact])

  function handleCopy() {
    navigator.clipboard?.writeText(message).catch(() => { })
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // ── Estado "enviado": confirmación en el propio flujo ──────────────────────
  if (phase === 'sent' && contact) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-5 py-16 text-center md:py-24">
        <span className="flex size-14 items-center justify-center rounded-full bg-success/12 text-success duration-300 animate-in zoom-in-75">
          <CheckCheck className="size-7" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">Mensaje enviado</h1>
        <p className="mt-1.5 text-[15px] text-muted-foreground">
          {contact.name.split(' ')[0]} lo recibirá por {CHANNELS[channel].label}.
        </p>

        <blockquote className="mt-6 w-full rounded-2xl border border-border bg-card p-4 text-left text-[15px] leading-relaxed">
          {message}
        </blockquote>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={reset}
            className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:brightness-105 active:scale-[0.98]"
          >
            <Sparkles className="size-4" />
            Redactar otro
          </button>
          <a
            href={href.contact(contact.id)}
            className="flex h-10 items-center gap-1.5 rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            Ver perfil de {contact.name.split(' ')[0]}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-8 md:py-12">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Redactar</h1>
      <p className="mb-7 text-[15px] text-muted-foreground">
        Escribe tu intención. La IA redacta el mensaje por ti.
      </p>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <button
            onClick={() => setContactMenu((v) => !v)}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-left transition-colors hover:bg-muted"
            aria-haspopup="listbox"
            aria-expanded={contactMenu}
          >
            {contact ? (
              <>
                <Avatar initials={contact.initials} hue={contact.avatarHue} className="size-7 text-[11px]" />
                <span className="text-sm font-medium">{contact.name}</span>
              </>
            ) : (
              <span className="px-1 text-sm text-muted-foreground">Elegir contacto…</span>
            )}
            <ChevronRight className={cn('size-4 text-muted-foreground transition-transform', contactMenu && 'rotate-90')} />
          </button>

          {contactMenu && (
            <>
              <button className="fixed inset-0 z-10" aria-hidden="true" onClick={() => setContactMenu(false)} tabIndex={-1} />
              <ul className="absolute top-full left-0 z-20 mt-1.5 max-h-72 w-64 overflow-y-auto rounded-xl border border-border bg-popover p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)]" role="listbox">
                {(contacts ?? []).map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => { selectContact(c); setContactMenu(false) }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted"
                      role="option"
                      aria-selected={contact?.id === c.id}
                    >
                      <Avatar initials={c.initials} hue={c.avatarHue} className="size-7 text-[11px]" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{c.name}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {c.email || c.phone || c.telegram}
                        </span>
                      </span>
                      {contact?.id === c.id && <Check className="size-4 text-primary" />}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {(Object.keys(CHANNELS) as Channel[]).map((ch) => {
            const active = channel === ch
            return (
              <button
                key={ch}
                onClick={() => setChannel(ch)}
                className={cn(
                  'flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium transition-colors',
                  active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
                aria-pressed={active}
              >
                <ChannelIcon channel={ch} className="size-3.5" />
                <span className="hidden sm:inline">{CHANNELS[ch].label}</span>
                {ch === 'whatsapp' && waStatus === 'connected' && (
                  <span className="size-1.5 rounded-full bg-success" aria-label="Conectado" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Vinculación de WhatsApp por código ── */}
      {showWaPanel && (
        <div className="mb-5 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-channel-whatsapp/12">
              <Smartphone className="size-4.5 text-channel-whatsapp" />
            </span>
            <div className="flex-1">
              <p className="text-[15px] font-semibold">Conecta WhatsApp para enviar</p>
              <p className="text-[13px] text-muted-foreground">
                Se vincula una sola vez con un código, sin escanear nada.
              </p>
            </div>
          </div>

          <div className="px-5 py-4">
            {!pairCode ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const phone = new FormData(e.currentTarget).get('phone') as string
                  requestPairCode(phone)
                }}
                className="flex flex-col gap-2"
              >
                <label htmlFor="wa-phone" className="text-[13px] font-medium">
                  Tu número de WhatsApp
                </label>
                <div className="flex gap-2">
                  <input
                    id="wa-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="52 777 123 4567"
                    className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
                  />
                  <button
                    type="submit"
                    disabled={pairLoading}
                    className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
                  >
                    {pairLoading && <Loader2 className="size-4 animate-spin" />}
                    {pairLoading ? 'Generando…' : 'Obtener código'}
                  </button>
                </div>
                <p className="text-[12px] text-muted-foreground">
                  Con código de país, sin “+”. El código caduca en un minuto, tenlo a mano.
                </p>
                {pairError && (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-[13px] text-destructive" role="alert">
                    {pairError}
                  </p>
                )}
              </form>
            ) : (
              <div className="flex flex-col items-center gap-4 py-2">
                <PairCode code={pairCode} />
                <ol className="w-full max-w-sm space-y-1.5 text-[13px] text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="font-medium text-foreground">1.</span>
                    En tu teléfono: WhatsApp → <strong className="text-foreground">Dispositivos vinculados</strong>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium text-foreground">2.</span>
                    <span>
                      <strong className="text-foreground">Vincular un dispositivo</strong> →{' '}
                      <strong className="text-foreground">Vincular con el número de teléfono</strong>
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium text-foreground">3.</span>
                    Escribe el código de arriba
                  </li>
                </ol>
                <p className="flex items-center gap-2 text-[13px] text-muted-foreground" role="status">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
                    <span className="relative inline-flex size-2 rounded-full bg-success" />
                  </span>
                  Esperando la vinculación… se detecta sola al completarla.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border bg-muted/40 px-5 py-2.5">
            <span className="text-[12px] text-muted-foreground">
              {pairCode ? '¿Caducó?' : 'La sesión queda guardada para próximos envíos.'}
            </span>
            <div className="flex items-center gap-4">
              {pairCode && (
                <button
                  onClick={clearPairCode}
                  className="text-[13px] font-medium text-primary hover:underline"
                >
                  Pedir otro código
                </button>
              )}
              <button
                onClick={checkWhatsappStatus}
                disabled={waChecking}
                className="flex items-center gap-1.5 text-[13px] font-medium text-primary transition-opacity hover:underline disabled:opacity-50"
              >
                {waChecking && <RefreshCw className="size-3 animate-spin" />}
                {waChecking ? 'Verificando…' : 'Verificar ahora'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="intent" className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Tu intención
          </label>
          <span className="text-[11px] text-muted-foreground">La IA redactará el mensaje por ti</span>
        </div>
        <textarea
          id="intent"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) {
              e.preventDefault()
              runGeneration()
            }
          }}
          rows={2}
          placeholder="Escribe qué quieres decir… ej: “Invítalo a la reunión del viernes”"
          className="w-full resize-none bg-transparent text-[17px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {INTENT_SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setIntent(intent ? intent : `${s}: `)}
              className="rounded-full border border-border bg-muted px-2.5 py-1 text-[13px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => runGeneration()}
        disabled={!canGenerate || phase === 'generating'}
        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-medium text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all hover:brightness-105 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-45"
      >
        {phase === 'generating' ? (
          <><RefreshCw className="size-4 animate-spin" />Generando…</>
        ) : (
          <>
            <Sparkles className="size-4" />
            Generar con IA
            <Kbd className="ml-1 border-primary-foreground/30 bg-transparent text-primary-foreground/80">⌘↵</Kbd>
          </>
        )}
      </button>

      {contact && (
        <p className="mt-3 text-center text-[13px] text-muted-foreground">
          Se usará el tono <span className="font-medium text-foreground">{TONES[tone].label}</span> por{' '}
          <span className="font-medium text-foreground">{CHANNELS[channel].label}</span>
        </p>
      )}

      {phase !== 'idle' && (
        <div className="mt-8 border-t border-border pt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">Vista previa</h2>
            {contact && (
              <span className="text-[13px] text-muted-foreground">
                Para {contact.name.split(' ')[0]} · {CHANNELS[channel].label} · {TONES[tone].label}
              </span>
            )}
          </div>

          <div className={cn('rounded-2xl p-4', channel === 'gmail' ? 'border border-border bg-card' : 'bg-muted/60')}>
            {channel === 'gmail' && (
              <div className="mb-2 border-b border-border pb-2 text-[13px] text-muted-foreground">Para: {contact?.email}</div>
            )}
            {phase === 'generating' ? (
              <div className="space-y-2">
                <div className="relay-shimmer h-3.5 w-[90%] rounded bg-muted" />
                <div className="relay-shimmer h-3.5 w-[75%] rounded bg-muted" />
                <div className="relay-shimmer h-3.5 w-[60%] rounded bg-muted" />
              </div>
            ) : editing ? (
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                className="w-full resize-none rounded-lg border border-primary/40 bg-card p-2 text-[15px] leading-relaxed text-foreground outline-none ring-3 ring-ring/20"
              />
            ) : (
              <button onClick={() => setEditing(true)} className="w-full text-left text-[15px] leading-relaxed text-foreground" title="Haz clic para editar">
                {streamed}
                {streamed.length < message.length && (
                  <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle" />
                )}
              </button>
            )}
          </div>

          {phase === 'preview' && streamed.length >= message.length && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Ajustar:</span>
              {REFINE_CHIPS.map((r) => (
                <button key={r} onClick={() => runGeneration(r)} className="rounded-full border border-border bg-card px-2.5 py-1 text-[13px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                  {r}
                </button>
              ))}
            </div>
          )}

          {phase === 'preview' && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button onClick={send} disabled={sending} className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60">
                {sending ? <RefreshCw className="size-4 animate-spin" /> : <Send className="size-4" />}
                {sending ? 'Enviando…' : 'Enviar'}
                {!sending && <Kbd className="border-primary-foreground/30 bg-transparent text-primary-foreground/80">↵</Kbd>}
              </button>
              <button onClick={() => runGeneration()} className="flex h-10 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted">
                <RefreshCw className="size-4" />
                Regenerar
              </button>
              <button onClick={() => setEditing(!editing)} className="flex h-10 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted">
                <Pencil className="size-4" />
                {editing ? 'Listo' : 'Editar'}
              </button>
              <button onClick={handleCopy} className="flex size-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Copiar mensaje">
                {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** Código de vinculación en grupos de 4, con copia al portapapeles. */
function PairCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const grouped = code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code

  function copy() {
    navigator.clipboard?.writeText(code).catch(() => { })
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      onClick={copy}
      className="group flex items-center gap-3 rounded-xl border border-border bg-background px-5 py-3 transition-colors hover:border-primary/40"
      title="Copiar código"
    >
      <span className="font-mono text-[28px] font-semibold tracking-[0.18em] text-foreground">
        {grouped}
      </span>
      {copied ? (
        <Check className="size-4 shrink-0 text-success" />
      ) : (
        <Copy className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
      )}
    </button>
  )
}
