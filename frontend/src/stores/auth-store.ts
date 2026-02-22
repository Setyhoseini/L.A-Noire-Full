/**
 * Auth state: user and JWT access token.
 * Token persisted in cookie. User in memory (or re-fetched from profile).
 */
import { create } from 'zustand'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'
import type { User } from '@/api/auth'

const ACCESS_TOKEN_COOKIE = 'access_token'

interface AuthState {
  user: User | null
  accessToken: string
  setUser: (user: User | null) => void
  setAccessToken: (token: string) => void
  resetAccessToken: () => void
  reset: () => void
}

export const useAuthStore = create<AuthState>()((set) => {
  const stored = getCookie(ACCESS_TOKEN_COOKIE)
  const initToken = stored ?? ''

  return {
    user: null,
    accessToken: initToken,
    setUser: (user) => set((state) => ({ ...state, user })),
    setAccessToken: (token) =>
      set((state) => {
        setCookie(ACCESS_TOKEN_COOKIE, token)
        return { ...state, accessToken: token }
      }),
    resetAccessToken: () =>
      set((state) => {
        removeCookie(ACCESS_TOKEN_COOKIE)
        return { ...state, accessToken: '' }
      }),
    reset: () =>
      set(() => {
        removeCookie(ACCESS_TOKEN_COOKIE)
        return { user: null, accessToken: '' }
      }),
  }
})
