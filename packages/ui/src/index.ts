// API pública de @org/ui — design system + app-shell compartido por los microfrontends.

// Design system
export * from './atoms'
export * from './molecules'
export { Toaster } from './feedback'

// App-shell (chrome)
export { AppShell } from './chrome/AppShell'
export { ThemeScript } from './chrome/ThemeScript'

// Estado, utilidades, dominio
export { useUiStore } from './store'
export { cn } from './utils'
export * from './types'
export * from './constants'

// Consumo del API real (Gateway Chat Service)
export * from './api'
export * from './hooks'
export { LoadingState, ErrorState, EmptyState } from './states'
