'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CHANNELS,
  apiErrorMessage,
  chatApi,
  useUiStore,
  type Channel,
  type Contact,
  type ToneId,
} from '@org/ui'

type Phase = 'idle' | 'generating' | 'preview' | 'sending' | 'sent'

// Sugerencias que se anexan al prompt para "reajustar" el borrador
const REFINE_HINT: Record<string, string> = {
  'Más corto': ' (hazlo más corto)',
  'Más cálido': ' (con un tono más cálido)',
  'Más directo': ' (ve directo al grano)',
  'Más formal': ' (en un registro más formal)',
}

const WA_ERROR_KEYWORDS = ['whatsapp no está conectado', 'whatsapp', 'no está conectado']

function isWhatsappError(msg: string) {
  const lower = msg.toLowerCase()
  return WA_ERROR_KEYWORDS.some((k) => lower.includes(k))
}

/**
 * Redactor conectado al Gateway real:
 *  - Generar   → POST /chat/draft          → { historyId, message, subject }
 *  - Enviar    → POST /chat/send-draft     → { contactId, historyId, message(editado), subject }
 *  - Estado    → GET  /chat/whatsapp-status
 *  - Vincular  → POST /chat/whatsapp-pair  → { code } (código de 8 caracteres)
 */
export function useMessageComposer(initialContact?: Contact) {
  const addToast = useUiStore((s) => s.addToast)

  const [contact, setContact] = useState<Contact | undefined>(initialContact)
  const [channel, setChannel] = useState<Channel>(initialContact?.favoriteChannel ?? 'whatsapp')
  const [tone, setTone] = useState<ToneId>(initialContact?.tone ?? 'formal')
  const [intent, setIntent] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [message, setMessage] = useState('')
  const [streamed, setStreamed] = useState('')
  const [historyId, setHistoryId] = useState<string | null>(null)
  const [subject, setSubject] = useState<string | undefined>(undefined)
  const [editing, setEditing] = useState(false)

  // Estado de conexión WhatsApp + vinculación por código
  const [waStatus, setWaStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown')
  const [waChecking, setWaChecking] = useState(false)
  const [pairCode, setPairCode] = useState<string | null>(null)
  const [pairLoading, setPairLoading] = useState(false)
  const [pairError, setPairError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pairCodeRef = useRef<string | null>(null)

  const streamTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  function selectContact(c: Contact) {
    setContact(c)
    setChannel(c.favoriteChannel)
    setTone(c.tone)
    setWaStatus('unknown')
  }

  useEffect(() => {
    if (initialContact && !contact) selectContact(initialContact)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialContact])

  useEffect(() => () => { if (streamTimer.current) clearInterval(streamTimer.current) }, [])

  const checkWhatsappStatus = useCallback(async () => {
    setWaChecking(true)
    try {
      const s = await chatApi.getWhatsappStatus()
      const connected = s.status === 'connected'
      setWaStatus((prev) => {
        // Transición desconectado → conectado con un código activo = el usuario
        // acaba de vincular: confirmamos y limpiamos el código.
        if (connected && prev !== 'connected' && pairCodeRef.current) {
          pairCodeRef.current = null
          setPairCode(null)
          addToast({ title: 'WhatsApp vinculado correctamente', variant: 'success' })
        }
        return connected ? 'connected' : 'disconnected'
      })
    } catch {
      setWaStatus('disconnected')
    } finally {
      setWaChecking(false)
    }
  }, [addToast])

  // Verificar estado WA automáticamente cuando el canal es whatsapp
  useEffect(() => {
    if (channel === 'whatsapp' && waStatus === 'unknown') {
      checkWhatsappStatus()
    }
  }, [channel, waStatus, checkWhatsappStatus])

  // Polling mientras esté desconectado: cada 4 s con un código activo
  // (la ventana de canje es corta), cada 15 s en reposo.
  useEffect(() => {
    if (channel === 'whatsapp' && waStatus === 'disconnected') {
      const interval = pairCode ? 4000 : 15000
      pollRef.current = setInterval(() => checkWhatsappStatus(), interval)
    } else if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null } }
  }, [channel, waStatus, pairCode, checkWhatsappStatus])

  async function requestPairCode(phone: string) {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length < 10) {
      setPairError('Escribe el número con código de país, ej. 52 777 123 4567')
      return
    }
    setPairLoading(true)
    setPairError(null)
    setPairCode(null)
    pairCodeRef.current = null
    try {
      const res = await chatApi.requestWhatsappPairCode(cleaned)
      setPairCode(res.code)
      pairCodeRef.current = res.code
    } catch (err) {
      setPairError(apiErrorMessage(err))
    } finally {
      setPairLoading(false)
    }
  }

  function streamReveal(full: string) {
    let i = 0
    if (streamTimer.current) clearInterval(streamTimer.current)
    streamTimer.current = setInterval(() => {
      i += 2
      setStreamed(full.slice(0, i))
      if (i >= full.length && streamTimer.current) {
        clearInterval(streamTimer.current)
        setStreamed(full)
      }
    }, 12)
  }

  async function runGeneration(refine?: string) {
    if (!contact || intent.trim().length < 5) return
    const prompt = (intent.trim() + (refine ? REFINE_HINT[refine] ?? '' : '')).slice(0, 500)
    setPhase('generating')
    setEditing(false)
    setStreamed('')
    try {
      const draft = await chatApi.draftMessage({ contactId: contact.id, prompt })
      setMessage(draft.message)
      setHistoryId(draft.historyId)
      setSubject(draft.subject ?? undefined)
      setPhase('preview')
      streamReveal(draft.message)
    } catch (err) {
      setPhase('idle')
      addToast({
        title: 'No se pudo generar el mensaje',
        description: apiErrorMessage(err),
        variant: 'error',
      })
    }
  }

  async function send() {
    if (!contact) return
    setPhase('sending')
    try {
      if (historyId) {
        await chatApi.sendDraft({
          contactId: contact.id,
          historyId,
          message: message.slice(0, 2000),
          subject,
        })
      } else {
        await chatApi.sendMessage({ contactId: contact.id, prompt: intent.trim().slice(0, 500) })
      }
      setPhase('sent')
      addToast({
        title: `Enviado a ${contact.name.split(' ')[0]} por ${CHANNELS[channel].label}`,
        variant: 'success',
      })
    } catch (err) {
      setPhase('preview')
      const msg = apiErrorMessage(err)
      if (isWhatsappError(msg)) {
        setWaStatus('disconnected')
      }
      addToast({
        title: 'No se pudo enviar el mensaje',
        description: msg,
        variant: 'error',
      })
    }
  }

  /** Descarta el código actual para pedir uno nuevo. */
  function clearPairCode() {
    setPairCode(null)
    pairCodeRef.current = null
    setPairError(null)
  }

  /** Vuelve al estado inicial para redactar otro mensaje al mismo contacto. */
  function reset() {
    setPhase('idle')
    setIntent('')
    setMessage('')
    setStreamed('')
    setHistoryId(null)
    setSubject(undefined)
    setEditing(false)
  }

  return {
    contact, channel, tone, intent, phase, message, streamed, editing,
    waStatus, waChecking, pairCode, pairLoading, pairError,
    canGenerate: Boolean(contact && intent.trim().length >= 5),
    sending: phase === 'sending',
    setChannel, setTone, setIntent, setMessage, setEditing,
    selectContact, runGeneration, send, reset, checkWhatsappStatus, requestPairCode, clearPairCode,
  }
}
