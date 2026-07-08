import { apiClient } from './client'
import type {
  ApiResponse,
  ChatDraftResponseData,
  ChatSendRequest,
  ChatSendResponseData,
  SendDraftRequest,
  WhatsappStatusData,
} from './types'

// POST /chat/draft — genera el borrador con IA (no lo despacha).
// Devuelve { historyId, message, subject } para poder editarlo y enviarlo luego.
export async function draftMessage(req: ChatSendRequest): Promise<ChatDraftResponseData> {
  const res = await apiClient.post<ApiResponse<ChatDraftResponseData>>('/chat/draft', req)
  return res.data.data
}

// POST /chat/send-draft — despacha el borrador (con el texto posiblemente editado).
export async function sendDraft(req: SendDraftRequest): Promise<ChatSendResponseData> {
  const res = await apiClient.post<ApiResponse<ChatSendResponseData>>('/chat/send-draft', req)
  return res.data.data
}

// POST /chat/send — genera y despacha en un solo paso.
export async function sendMessage(req: ChatSendRequest): Promise<ChatSendResponseData> {
  const res = await apiClient.post<ApiResponse<ChatSendResponseData>>('/chat/send', req)
  return res.data.data
}

// GET /chat/whatsapp-status — estado de conexión de Baileys.
export async function getWhatsappStatus(): Promise<WhatsappStatusData> {
  const res = await apiClient.get<ApiResponse<WhatsappStatusData>>('/chat/whatsapp-status')
  return res.data.data
}

// POST /chat/whatsapp-pair — solicita código de emparejamiento de 8 dígitos.
export async function requestWhatsappPairCode(phoneNumber: string): Promise<{ code: string }> {
  const res = await apiClient.post<ApiResponse<{ code: string }>>('/chat/whatsapp-pair', { phoneNumber })
  return res.data.data
}
