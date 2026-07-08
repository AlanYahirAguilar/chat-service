import { apiClient } from './client'
import type { ApiResponse } from './types'

export async function getProfile<T = unknown>(id: string): Promise<T> {
  const res = await apiClient.get<ApiResponse<T>>(`/users/${id}/profile`)
  return res.data.data
}

export async function getUsers<T = unknown>(): Promise<T> {
  const res = await apiClient.get<ApiResponse<T>>('/users')
  return res.data.data
}
