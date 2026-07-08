import { apiClient } from './client'
import { mapContact } from './mappers'
import type { ApiResponse, BackendContact, CreateContactRequest, UpdateContactRequest } from './types'
import type { Contact } from '../types'

// GET /contacts (paginado). Tolera data como array o { items }.
export async function getContacts(params?: { page?: number; limit?: number }): Promise<Contact[]> {
  const res = await apiClient.get<ApiResponse<BackendContact[] | { items: BackendContact[] }>>('/contacts', { params })
  const raw = res.data?.data
  const list = Array.isArray(raw) ? raw : (raw?.items ?? [])
  return list.map(mapContact)
}

// GET /contacts/:id
export async function getContact(id: string): Promise<Contact> {
  const res = await apiClient.get<ApiResponse<BackendContact>>(`/contacts/${id}`)
  return mapContact(res.data.data)
}

// POST /contacts
export async function createContact(input: CreateContactRequest): Promise<Contact> {
  const res = await apiClient.post<ApiResponse<BackendContact>>('/contacts', input)
  return mapContact(res.data.data)
}

// PATCH /contacts/:id
export async function updateContact(id: string, input: UpdateContactRequest): Promise<Contact> {
  const res = await apiClient.patch<ApiResponse<BackendContact>>(`/contacts/${id}`, input)
  return mapContact(res.data.data)
}

// DELETE /contacts/:id
export async function deleteContact(id: string): Promise<void> {
  await apiClient.delete(`/contacts/${id}`)
}
