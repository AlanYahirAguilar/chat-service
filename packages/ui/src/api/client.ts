'use client'

import axios from 'axios'

// Gateway del ecosistema Chat Service. Configurable por env en despliegue.
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

export const apiClient = axios.create({
  baseURL,
  withCredentials: true, // CRÍTICO: envía la cookie de sesión HTTP-Only
  headers: { 'Content-Type': 'application/json' },
})

// Interceptor global: ante 401 purga la sesión y va a login (sin bucle).
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error?.response?.status === 401) {
      if (!window.location.pathname.endsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)
