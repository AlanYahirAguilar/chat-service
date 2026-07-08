'use client'

import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import {
    ChannelIcon,
    cn,
    contactsApi,
    type BackendPlatform,
    type BackendTone,
    type Contact,
    type ToneId,
    type Channel,
} from '@org/ui'

type Mode = 'create' | 'edit'

interface Props {
    mode: Mode
    /** Pre-rellena el formulario cuando mode === 'edit'. */
    contact?: Contact
    onSuccess: (saved: Contact) => void
    onClose: () => void
}

const PLATFORM_OPTIONS: { value: BackendPlatform; label: string; channel: Channel }[] = [
    { value: 'WHATSAPP', label: 'WhatsApp', channel: 'whatsapp' },
    { value: 'TELEGRAM', label: 'Telegram', channel: 'telegram' },
    { value: 'MAIL', label: 'Correo', channel: 'gmail' },
]

const TONE_OPTIONS: { value: BackendTone; label: string; desc: string }[] = [
    { value: 'FORMAL', label: 'Formal', desc: 'Claro y respetuoso' },
    { value: 'NEUTRO', label: 'Neutro / Ejecutivo', desc: 'Directo y conciso' },
    { value: 'INFORMAL', label: 'Informal', desc: 'Relajado y espontáneo' },
]

/** Convierte el canal del frontend → BackendPlatform para pre-rellenar. */
function channelToPlatform(ch: Channel): BackendPlatform {
    if (ch === 'whatsapp') return 'WHATSAPP'
    if (ch === 'telegram') return 'TELEGRAM'
    return 'MAIL'
}

/** Convierte ToneId del frontend → BackendTone para pre-rellenar. */
function toneToBackend(t: ToneId): BackendTone {
    if (t === 'formal') return 'FORMAL'
    if (t === 'informal' || t === 'amistoso' || t === 'cercano') return 'INFORMAL'
    return 'NEUTRO'
}

/** Etiqueta e placeholder según la plataforma elegida. */
function infoMeta(platform: BackendPlatform) {
    if (platform === 'WHATSAPP') return { label: 'Número de WhatsApp', placeholder: '+521234567890' }
    if (platform === 'TELEGRAM') return { label: 'Chat ID o @usuario', placeholder: '@usuario o 123456789' }
    return { label: 'Correo electrónico', placeholder: 'usuario@dominio.com' }
}

export function ContactFormModal({ mode, contact, onSuccess, onClose }: Props) {
    const [name, setName] = useState(contact?.name ?? '')
    const [platform, setPlatform] = useState<BackendPlatform>(
        contact ? channelToPlatform(contact.favoriteChannel) : 'WHATSAPP',
    )
    const [contactInfo, setContactInfo] = useState(
        contact ? (contact.phone || contact.email || contact.telegram) : '',
    )
    const [tone, setTone] = useState<BackendTone>(
        contact ? toneToBackend(contact.tone) : 'NEUTRO',
    )
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const { label: infoLabel, placeholder: infoPlaceholder } = infoMeta(platform)

    // Al cambiar de plataforma limpiamos el campo de contactInfo para evitar
    // dejar un teléfono en un campo de correo, etc.
    function handlePlatformChange(p: BackendPlatform) {
        setPlatform(p)
        setContactInfo('')
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            const payload = {
                name: name.trim(),
                platform,
                contactInfo: contactInfo.trim(),
                tone,
            }
            const result =
                mode === 'edit' && contact
                    ? await contactsApi.updateContact(contact.id, payload)
                    : await contactsApi.createContact(payload)
            onSuccess(result)
        } catch (err) {
            const e = err as { response?: { data?: { message?: string } }; message?: string }
            setError(e?.response?.data?.message || e?.message || 'Error al guardar el contacto.')
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            {/* Backdrop */}
            <button
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                onClick={onClose}
                aria-label="Cerrar formulario"
            />

            {/* Panel */}
            <div className="relative w-full max-w-md rounded-t-2xl border border-border bg-card p-6 shadow-[0_-4px_24px_rgba(0,0,0,0.14)] duration-200 animate-in fade-in slide-in-from-bottom-4 sm:rounded-2xl sm:shadow-[0_8px_32px_rgba(0,0,0,0.16)] sm:slide-in-from-bottom-2">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-[17px] font-semibold">
                        {mode === 'create' ? 'Nuevo contacto' : 'Editar contacto'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Cerrar"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="flex flex-col gap-4">
                    {/* Nombre */}
                    <label className="flex flex-col gap-1.5">
                        <span className="text-[13px] font-medium">Nombre</span>
                        <input
                            required
                            maxLength={255}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nombre completo"
                            className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
                        />
                    </label>

                    {/* Plataforma */}
                    <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Canal">
                        <span className="text-[13px] font-medium">Canal</span>
                        <div className="flex gap-2">
                            {PLATFORM_OPTIONS.map((o) => (
                                <button
                                    key={o.value}
                                    type="button"
                                    role="radio"
                                    aria-checked={platform === o.value}
                                    onClick={() => handlePlatformChange(o.value)}
                                    className={cn(
                                        'flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border text-[13px] font-medium transition-colors',
                                        platform === o.value
                                            ? 'border-primary/40 bg-primary/[0.06] text-foreground'
                                            : 'border-border bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground',
                                    )}
                                >
                                    <ChannelIcon channel={o.channel} className="size-4" />
                                    {o.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dato de contacto (dinámico según plataforma) */}
                    <label className="flex flex-col gap-1.5">
                        <span className="text-[13px] font-medium">{infoLabel}</span>
                        <input
                            required
                            maxLength={255}
                            value={contactInfo}
                            onChange={(e) => setContactInfo(e.target.value)}
                            placeholder={infoPlaceholder}
                            type={platform === 'MAIL' ? 'email' : 'text'}
                            className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
                        />
                    </label>

                    {/* Tono */}
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[13px] font-medium">Tono de voz</span>
                        <div className="flex gap-2">
                            {TONE_OPTIONS.map((o) => (
                                <button
                                    key={o.value}
                                    type="button"
                                    onClick={() => setTone(o.value)}
                                    className={`flex flex-1 flex-col rounded-lg border px-2 py-2 text-left transition-colors ${tone === o.value
                                            ? 'border-primary/40 bg-primary/[0.06] text-primary'
                                            : 'border-border bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground'
                                        }`}
                                >
                                    <span className="block text-[13px] font-medium leading-tight">{o.label}</span>
                                    <span className="mt-0.5 block text-[11px] leading-tight opacity-70">{o.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-[13px] text-destructive" role="alert">
                            {error}
                        </p>
                    )}

                    {/* Acciones */}
                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-10 flex-1 items-center justify-center rounded-lg border border-border text-sm font-medium transition-colors hover:bg-muted"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-all hover:brightness-105 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
                        >
                            {loading && <Loader2 className="size-4 animate-spin" />}
                            {loading ? 'Guardando…' : mode === 'create' ? 'Crear contacto' : 'Guardar cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
