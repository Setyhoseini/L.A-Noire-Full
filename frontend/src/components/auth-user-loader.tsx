/**
 * Fetches current user profile when we have a token but no user (e.g. page refresh).
 * Refetches on window focus so role changes made in admin are picked up.
 */
import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { getProfile } from '@/api/auth'

export function AuthUserLoader({ children }: { children: React.ReactNode }) {
  const { accessToken, user, setUser, reset } = useAuthStore()
  const fetchingRef = useRef(false)

  // Initial load: fetch when we have token but no user
  useEffect(() => {
    if (!accessToken) return
    if (user) return

    if (fetchingRef.current) return
    fetchingRef.current = true
    getProfile()
      .then(setUser)
      .catch(() => reset())
      .finally(() => {
        fetchingRef.current = false
      })
  }, [accessToken, user, setUser, reset])

  // Refetch on window focus (e.g. after changing roles in admin)
  useEffect(() => {
    if (!accessToken || !user) return

    const onFocus = () => {
      if (fetchingRef.current) return
      fetchingRef.current = true
      getProfile()
        .then(setUser)
        .catch(() => {})
        .finally(() => {
          fetchingRef.current = false
        })
    }

    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [accessToken, user, setUser])

  return <>{children}</>
}
