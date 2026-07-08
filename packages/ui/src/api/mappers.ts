import type { Channel, Contact, ToneId } from '../types'
import type { BackendContact, BackendPlatform, BackendTone, CreateContactRequest } from './types'

const platformToChannel: Record<BackendPlatform, Channel> = {
  WHATSAPP: 'whatsapp',
  TELEGRAM: 'telegram',
  MAIL: 'gmail',
}
const channelToPlatform: Record<Channel, BackendPlatform> = {
  whatsapp: 'WHATSAPP',
  telegram: 'TELEGRAM',
  gmail: 'MAIL',
}
const backendToneToFront: Record<BackendTone, ToneId> = {
  FORMAL: 'formal',
  INFORMAL: 'informal',
  NEUTRO: 'ejecutivo',
}
const frontToneToBackend: Record<ToneId, BackendTone> = {
  formal: 'FORMAL',
  ejecutivo: 'NEUTRO',
  cercano: 'NEUTRO',
  amistoso: 'INFORMAL',
  informal: 'INFORMAL',
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '??'
}

function hueFrom(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360
  return h
}

/** DTO del user-service -> modelo de dominio del frontend. */
export function mapContact(b: BackendContact): Contact {
  const channel = platformToChannel[b.platform]
  const info = b.contactInfo ?? b.contact_info ?? ''
  return {
    id: String(b.id),
    name: b.name,
    initials: initialsFrom(b.name),
    tone: backendToneToFront[b.tone] ?? 'formal',
    favoriteChannel: channel,
    phone: channel === 'whatsapp' ? info : '',
    email: channel === 'gmail' ? info : '',
    telegram: channel === 'telegram' ? info : '',
    avatarHue: hueFrom(b.name),
  }
}

/** Modelo del frontend -> payload de creación (POST /contacts). */
export function toCreateContact(input: {
  name: string
  channel: Channel
  contactInfo: string
  tone: ToneId
}): CreateContactRequest {
  return {
    name: input.name,
    platform: channelToPlatform[input.channel],
    contactInfo: input.contactInfo,
    tone: frontToneToBackend[input.tone],
  }
}
