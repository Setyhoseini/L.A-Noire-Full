import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useAuthStore } from '@/stores/auth-store'
import { canAccessRoute } from '@/config/route-roles'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    const token = useAuthStore.getState().accessToken
    if (!token) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.pathname },
      })
    }
    const user = useAuthStore.getState().user
    if (user) {
      const roles = user.roles ?? []
      const permissions = user.permissions ?? []
      if (!canAccessRoute(location.pathname, roles, permissions)) {
        throw redirect({ to: '/403' })
      }
    }
  },
  component: AuthenticatedLayout,
})
