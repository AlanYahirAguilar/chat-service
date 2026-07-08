export type Channel = 'whatsapp' | 'telegram' | 'gmail'
export type ToneId = 'formal' | 'ejecutivo' | 'amistoso' | 'informal' | 'cercano'

/** Cada microfrontend corresponde a una entrada de navegación. */
export type NavKey = 'dashboard' | 'contacts' | 'compose'

export interface Tone {
  id: ToneId
  label: string
  description: string
  dot: string
}
export interface ChannelMeta {
  id: Channel
  label: string
  color: string
}
export interface Contact {
  id: string
  name: string
  initials: string
  tone: ToneId
  favoriteChannel: Channel
  phone: string
  email: string
  telegram: string
  avatarHue: number
}
export interface Toast {
  id: number
  title: string
  description?: string
  variant?: 'default' | 'success' | 'error'
  actionLabel?: string
  onAction?: () => void
}
