/**
 * Fetches current user profile when we have a token but no user (e.g. page refresh).
 * Renders children once user is loaded or confirmed missing.
 */
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { getProfile } from '@/api/auth'

export function AuthUserLoader({ children }: { children: React.ReactNode }) {
  const { accessToken, user, setUser, reset } = useAuthStore()

  useEffect(() => {
    if (!accessToken) return
    if (user) return

    getProfile()
      .then(setUser)
      .catch(() => {
        reset()
      })
  }, [accessToken, user, setUser, reset])

  return <>{children}</>
}
