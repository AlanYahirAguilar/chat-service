'use client'

import { create } from 'zustand'
import type { Toast } from './types'

let toastCounter = 0

interface UiState {
  theme: 'light' | 'dark'
  sidebarCollapsed: boolean
  paletteOpen: boolean
  toasts: Toast[]
  setTheme: (t: 'light' | 'dark') => void
  toggleTheme: () => void
  toggleSidebar: () => void
  setPaletteOpen: (open: boolean) => void
  addToast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void
}

function applyTheme(theme: 'light' | 'dark') {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('relay-theme', theme)
  }
}

export const useUiStore = create<UiState>((set, get) => ({
  theme: 'light',
  sidebarCollapsed: false,
  paletteOpen: false,
  toasts: [],
  setTheme: (theme) => {
    applyTheme(theme)
    set({ theme })
  },
  toggleTheme: () => {
    const theme = get().theme === 'light' ? 'dark' : 'light'
    applyTheme(theme)
    set({ theme })
  },
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  addToast: (t) => {
    const id = ++toastCounter
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }))
    setTimeout(() => get().dismissToast(id), 4500)
  },
}))
