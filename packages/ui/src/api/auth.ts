import { apiClient } from './client'
import type { AuthLoginRequest } from './types'

// POST /auth/login — establece la cookie de sesión HTTP-Only.
export async function login(req: AuthLoginRequest): Promise<void> {
  await apiClient.post('/auth/login', req)
}

// POST /auth/refresh — refresca la sesión con la cookie existente.
export async function refresh(): Promise<void> {
  await apiClient.post('/auth/refresh')
}

// POST /auth/logout — destruye la cookie de sesión.
export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}
