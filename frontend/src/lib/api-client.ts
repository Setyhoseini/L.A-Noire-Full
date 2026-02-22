/**
 * Axios API client for backend communication.
 * - Base URL from env
 * - Attaches JWT to requests
 * - Handles 401 (logout + redirect to sign-in)
 */
import axios, { type AxiosError } from 'axios'
import { useAuthStore } from '@/stores/auth-store'

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request: attach Bearer token from auth store
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response: on 401, clear auth and redirect to sign-in
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().reset()
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/'
      if (!currentPath.startsWith('/sign-in') && !currentPath.startsWith('/sign-up')) {
        window.location.href = `/sign-in?redirect=${encodeURIComponent(currentPath)}`
      }
    }
    return Promise.reject(error)
  }
)
