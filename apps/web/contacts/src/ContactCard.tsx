'use client'

import { Loader2, MoreHorizontal, Pencil, PenLine, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Avatar, ChannelIcon, ToneChip, contactsApi, href, useUiStore, type Contact } from '@org/ui'

interface Props {
  contact: Contact
  /** Invocado para abrir el modal de edición en el padre. */
  onEdit?: (c: Contact) => void
  /** Invocado tras eliminar con éxito para que el padre refresque la lista. */
  onDeleted?: (id: string) => void
}

/** null = cerrado · 'menu' = opciones · 'confirm' = confirmar borrado */
type MenuState = null | 'menu' | 'confirm'

export function ContactCard({ contact: c, onEdit, onDeleted }: Props) {
  const addToast = useUiStore((s) => s.addToast)
  const [menu, setMenu] = useState<MenuState>(null)
  const [deleting, setDeleting] = useState(false)

  const contactInfo = c.phone || c.email || c.telegram

  async function handleDelete() {
    setDeleting(true)
    try {
      await contactsApi.deleteContact(c.id)
      onDeleted?.(c.id)
      addToast({ title: `${c.name.split(' ')[0]} eliminado`, variant: 'success' })
    } catch {
      addToast({ title: 'No se pudo eliminar el contacto', variant: 'error' })
      setDeleting(false)
      setMenu(null)
    }
  }

  return (
    <div className="group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between">
        <div className="relative">
          <Avatar initials={c.initials} hue={c.avatarHue} className="size-12 text-sm" />
          <span className="absolute -right-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-full border-2 border-card bg-card">
            <ChannelIcon channel={c.favoriteChannel} className="size-3.5" />
          </span>
        </div>

        {/* Menú de opciones */}
        <div className="relative">
          <button
            onClick={() => setMenu(menu ? null : 'menu')}
            disabled={deleting}
            className="rounded-md p-1 text-muted-foreground transition-all hover:bg-muted hover:text-foreground focus-visible:opacity-100 disabled:opacity-30 md:opacity-0 md:group-hover:opacity-100"
            aria-label={`Más opciones para ${c.name}`}
            aria-expanded={menu !== null}
          >
            {deleting ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
          </button>

          {menu && !deleting && (
            <>
              <button
                className="fixed inset-0 z-10"
                onClick={() => setMenu(null)}
                tabIndex={-1}
                aria-hidden="true"
              />
              <div className="absolute right-0 top-full z-20 mt-1.5 min-w-[190px] rounded-xl border border-border bg-popover p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)] duration-100 animate-in fade-in zoom-in-95">
                {menu === 'menu' ? (
                  <>
                    <button
                      onClick={() => { setMenu(null); onEdit?.(c) }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors hover:bg-muted"
                    >
                      <Pencil className="size-3.5 text-muted-foreground" />
                      Editar
                    </button>
                    <button
                      onClick={() => setMenu('confirm')}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <Trash2 className="size-3.5" />
                      Eliminar…
                    </button>
                  </>
                ) : (
                  <div className="p-1">
                    <p className="px-1 text-[13px] font-medium">¿Eliminar a {c.name.split(' ')[0]}?</p>
                    <p className="mt-0.5 px-1 text-[12px] text-muted-foreground">Esta acción no se puede deshacer.</p>
                    <div className="mt-2.5 flex gap-1.5">
                      <button
                        onClick={() => setMenu(null)}
                        className="flex h-7 flex-1 items-center justify-center rounded-lg border border-border text-[12px] font-medium transition-colors hover:bg-muted"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleDelete}
                        className="flex h-7 flex-1 items-center justify-center gap-1 rounded-lg bg-destructive text-[12px] font-medium text-destructive-foreground transition-all hover:brightness-110"
                      >
                        <Trash2 className="size-3" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <a href={href.contact(c.id)} className="text-left">
        <p className="text-[15px] font-medium">{c.name}</p>
        <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{contactInfo}</p>
      </a>

      <div className="flex items-center justify-between">
        <ToneChip tone={c.tone} />
      </div>

      <div className="mt-1 flex gap-2 border-t border-border pt-3">
        <a
          href={href.compose(c.id)}
          className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary text-[13px] font-medium text-primary-foreground transition-all hover:brightness-105 active:scale-[0.98]"
        >
          <PenLine className="size-3.5" />
          Redactar
        </a>
        <a
          href={href.contact(c.id)}
          className="flex h-8 flex-1 items-center justify-center rounded-lg border border-border text-[13px] font-medium transition-colors hover:bg-muted"
        >
          Ver perfil
        </a>
      </div>
    </div>
  )
}
