'use client'

import { useMemo, useState } from 'react'
import { Plus, Search, User } from 'lucide-react'
import {
  CHANNELS,
  TONES,
  TONE_IDS,
  ChannelIcon,
  ErrorState,
  FilterChip,
  LoadingState,
  useContacts,
  useUiStore,
  type Channel,
  type Contact,
  type ToneId,
} from '@org/ui'
import { ContactCard } from './ContactCard'
import { ContactFormModal } from './ContactFormModal'

/** null = cerrado, 'create' = nuevo, Contact = editar ese contacto */
type ModalState = null | 'create' | Contact

export function Contacts() {
  const addToast = useUiStore((s) => s.addToast)
  const { data, loading, error, reload } = useContacts()
  const [query, setQuery] = useState('')
  const [channelFilter, setChannelFilter] = useState<Channel | 'all'>('all')
  const [toneFilter, setToneFilter] = useState<ToneId | 'all'>('all')
  const [modal, setModal] = useState<ModalState>(null)

  const results = useMemo(() => {
    const q = query.toLowerCase()
    return (data ?? []).filter((c) => {
      const matchesQuery =
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.telegram.toLowerCase().includes(q)
      const matchesChannel = channelFilter === 'all' || c.favoriteChannel === channelFilter
      const matchesTone = toneFilter === 'all' || c.tone === toneFilter
      return matchesQuery && matchesChannel && matchesTone
    })
  }, [data, query, channelFilter, toneFilter])

  function handleSuccess(saved: Contact) {
    const wasCreating = modal === 'create'
    setModal(null)
    reload()
    addToast({
      title: wasCreating ? 'Contacto creado' : `${saved.name.split(' ')[0]} actualizado`,
      variant: 'success',
    })
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 md:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Contactos</h1>
        <button
          onClick={() => setModal('create')}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-all hover:brightness-105 active:scale-[0.98]"
        >
          <Plus className="size-4" />
          Nuevo contacto
        </button>
      </div>

      <div className="mb-5 flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, teléfono o correo…"
            className="h-10 w-full rounded-lg border border-border bg-card pr-3 pl-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterChip active={channelFilter === 'all' && toneFilter === 'all'} onClick={() => { setChannelFilter('all'); setToneFilter('all') }}>
            Todos
          </FilterChip>
          {(Object.keys(CHANNELS) as Channel[]).map((ch) => (
            <FilterChip key={ch} active={channelFilter === ch} onClick={() => setChannelFilter(channelFilter === ch ? 'all' : ch)}>
              <ChannelIcon channel={ch} className="size-3.5" />
              {CHANNELS[ch].label}
            </FilterChip>
          ))}
          <span className="mx-1 h-4 w-px bg-border" />
          {TONE_IDS.map((t) => (
            <FilterChip key={t} active={toneFilter === t} onClick={() => setToneFilter(toneFilter === t ? 'all' : t)}>
              <span className={`size-2 rounded-full ${TONES[t].dot}`} />
              {TONES[t].label}
            </FilterChip>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState label="Cargando contactos…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-muted">
            <User className="size-5 text-muted-foreground" />
          </div>
          <p className="text-[15px] font-medium">Sin resultados</p>
          <p className="mt-1 text-[13px] text-muted-foreground">Prueba a cambiar la búsqueda o los filtros.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((c) => (
            <ContactCard
              key={c.id}
              contact={c}
              onEdit={(c) => setModal(c)}
              onDeleted={() => reload()}
            />
          ))}
        </div>
      )}

      {/* Modal de creación / edición */}
      {modal !== null && (
        <ContactFormModal
          mode={modal === 'create' ? 'create' : 'edit'}
          contact={modal === 'create' ? undefined : modal}
          onSuccess={handleSuccess}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
