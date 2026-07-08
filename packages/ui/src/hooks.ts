'use client'

import { useEffect, useState } from 'react'
import { getContact, getContacts } from './api/contacts'
import type { Contact } from './types'

/** Extrae un mensaje legible de un error (axios o genérico). */
export function apiErrorMessage(e: unknown): string {
  const err = e as { response?: { data?: { message?: string } }; message?: string }
  return err?.response?.data?.message || err?.message || 'Ocurrió un error inesperado.'
}

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => void
}

/** Ejecuta una promesa y expone estado de carga/error con reintento. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    fn()
      .then((d) => alive && (setData(d), setLoading(false)))
      .catch((e) => alive && (setError(apiErrorMessage(e)), setLoading(false)))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  return { data, loading, error, reload: () => setNonce((n) => n + 1) }
}

/** Lista de contactos desde GET /contacts. */
export function useContacts() {
  return useAsync<Contact[]>(() => getContacts(), [])
}

/** Un contacto desde GET /contacts/:id. */
export function useContact(id: string) {
  return useAsync<Contact>(() => getContact(id), [id])
}
