import type { Channel, ChannelMeta, NavKey, Tone, ToneId } from './types'

export const TONES: Record<ToneId, Tone> = {
  formal: {
    id: 'formal',
    label: 'Formal',
    description: 'Mensajes claros y respetuosos, sin tecnicismos.',
    dot: 'bg-[oklch(0.55_0.13_255)]',
  },
  ejecutivo: {
    id: 'ejecutivo',
    label: 'Ejecutivo',
    description: 'Directo y conciso, orientado a la acción.',
    dot: 'bg-[oklch(0.5_0.01_260)]',
  },
  amistoso: {
    id: 'amistoso',
    label: 'Amistoso',
    description: 'Cálido y cercano, manteniendo la profesionalidad.',
    dot: 'bg-[oklch(0.65_0.15_150)]',
  },
  informal: {
    id: 'informal',
    label: 'Informal',
    description: 'Relajado y espontáneo, como hablarías con un amigo.',
    dot: 'bg-[oklch(0.72_0.15_65)]',
  },
  cercano: {
    id: 'cercano',
    label: 'Cercano',
    description: 'Afectivo y personal, con un toque emotivo.',
    dot: 'bg-[oklch(0.68_0.13_10)]',
  },
}

/**
 * Tonos que el backend soporta realmente (FORMAL / NEUTRO / INFORMAL).
 * Úsalo para filtros y selectores; TONES conserva las etiquetas.
 */
export const TONE_IDS: ToneId[] = ['formal', 'ejecutivo', 'informal']

export const CHANNELS: Record<Channel, ChannelMeta> = {
  whatsapp: { id: 'whatsapp', label: 'WhatsApp', color: 'text-channel-whatsapp' },
  telegram: { id: 'telegram', label: 'Telegram', color: 'text-channel-telegram' },
  gmail: { id: 'gmail', label: 'Gmail', color: 'text-channel-gmail' },
}

export const INTENT_SUGGESTIONS = [
  'Recordatorio',
  'Invitación',
  'Seguimiento',
  'Agradecimiento',
  'Disculpa',
]

export const REFINE_CHIPS = ['Más corto', 'Más cálido', 'Más directo', 'Más formal']

/** Ruta interna del microfrontend dentro del Shell. */
export const BASE_ROUTE = '/communication'

/** Rutas de cada microfrontend (usadas para navegar entre zonas con <a href>). */
export const ROUTES: Record<NavKey, string> = {
  dashboard: '/dashboard',
  contacts: '/contacts',
  compose: '/compose',
}

/** Constructores de URL para navegar entre microfrontends. */
export const href = {
  dashboard: () => ROUTES.dashboard,
  contacts: () => ROUTES.contacts,
  contact: (id: string) => `${ROUTES.contacts}/${id}`,
  compose: (contactId?: string) =>
    contactId ? `${ROUTES.compose}?contact=${contactId}` : ROUTES.compose,
}
