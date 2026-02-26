import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { AppTitle } from './app-title'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { useAuthStore } from '@/stores/auth-store'
import { getNavGroupsForRoles } from '@/config/nav-roles'
import { getProfile } from '@/api/auth'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const refreshProfile = () => {
    getProfile().then(setUser)
  }

  const navUser = user
    ? {
        name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username,
        email: user.email,
        avatar: '',
        roles: user.roles ?? [],
        onRefreshProfile: refreshProfile,
      }
    : { name: 'Loading...', email: '', avatar: '' }

  const roles = user?.roles ?? []
  const navGroups = getNavGroupsForRoles(roles)

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <AppTitle />
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
