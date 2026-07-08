/** Envoltura estándar de respuestas del Gateway (TransformInterceptor). */
export interface ApiResponse<T> {
  status: number
  message: string
  data: T
}

export type BackendPlatform = 'WHATSAPP' | 'TELEGRAM' | 'MAIL'
export type BackendTone = 'FORMAL' | 'INFORMAL' | 'NEUTRO'

/** Entidad Contact tal como la devuelve el user-service (campo camelCase `contactInfo`). */
export interface BackendContact {
  id: string | number
  name: string
  platform: BackendPlatform
  contactInfo: string
  /** Defensivo: por si algún entorno serializa la columna en snake_case. */
  contact_info?: string
  tone: BackendTone
  createdAt?: string | null
  updatedAt?: string | null
}

/** POST /contacts — el campo es `contactInfo`; `tone` es opcional. */
export interface CreateContactRequest {
  name: string
  platform: BackendPlatform
  contactInfo: string
  tone?: BackendTone
}
export type UpdateContactRequest = Partial<CreateContactRequest>

export interface AuthLoginRequest {
  email: string
  password: string
}

// ---- Chat (IA) ----
export interface ChatSendRequest {
  contactId: string
  prompt: string
}

/** POST /chat/draft → genera el borrador (no lo despacha). */
export interface ChatDraftResponseData {
  success: boolean
  historyId: string
  message: string
  subject?: string | null
}

/** POST /chat/send-draft → despacha el borrador (con el texto posiblemente editado). */
export interface SendDraftRequest {
  contactId: string
  historyId: string
  message: string
  subject?: string
}

/** POST /chat/send y /chat/send-draft → resultado del despacho. */
export interface ChatSendResponseData {
  success: boolean
  historyId: string
  message?: string
}

/** GET /chat/whatsapp-status */
export interface WhatsappStatusData {
  /** 'connected' | 'connecting' | 'disconnected' */
  status: string
  qrRequired: boolean
  /** El string raw del QR de Baileys (para renderizarlo como imagen en el front) */
  qrData?: string | null
}
