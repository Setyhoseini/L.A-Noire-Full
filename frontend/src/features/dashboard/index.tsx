import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Skeleton } from '@/components/ui/skeleton'
import { getDashboardStats } from '@/api/dashboard'
import { useAuthStore } from '@/stores/auth-store'
import { getNavGroupsForRoles } from '@/config/nav-roles'
import {
  ClipboardList,
  FileSearch,
  KanbanSquare,
  Eye,
  FileText,
  Shield,
  ChevronRight,
} from 'lucide-react'

const MODULE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Submit Complaint': ClipboardList,
  'Cases & Complaints': ClipboardList,
  'Detective Board': KanbanSquare,
  'Under Surveillance': Eye,
  'General Report': FileText,
  Evidence: FileSearch,
  'Admin Panel': Shield,
}

/**
 * Home page per PDF: intro + 3 stats + role-based quick links to modules.
 * Stats: solved cases, employees, active cases.
 */
export function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const roles = user?.roles ?? []
  const permissions = user?.permissions ?? []
  const navGroups = getNavGroupsForRoles(roles, permissions)
  const moduleItems = navGroups.flatMap((g) => g.items).filter((i) => i.url && i.url !== '/')

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  })

  return (
    <>
      <Header />
      <Main>
        <div className='space-y-6'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              L.A. Noire Police System
            </h1>
            <p className='mt-2 text-muted-foreground'>
              Police management system for case tracking, evidence, and investigations.
              Manage complaints, form cases, register evidence, and follow cases through
              to trial.
            </p>
          </div>

          {moduleItems.length > 0 && (
            <div>
              <h2 className='mb-4 text-lg font-semibold'>Your Modules</h2>
              <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                {moduleItems.map((item) => {
                  const Icon = MODULE_ICONS[item.title]
                  return (
                    <Link key={item.url} to={item.url}>
                      <Card className='transition-colors hover:bg-muted/50'>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                          <CardTitle className='flex items-center gap-2 text-base'>
                            {Icon && <Icon className='h-4 w-4' />}
                            {item.title}
                          </CardTitle>
                          <ChevronRight className='h-4 w-4 text-muted-foreground' />
                        </CardHeader>
                        <CardContent>
                          <CardDescription>
                            {item.title === 'Submit Complaint' && 'File a crime report or complaint for review.'}
                            {item.title === 'Cases & Complaints' && 'View and manage cases, complaints, suspects.'}
                            {item.title === 'Detective Board' && 'Link evidence and documents to solve cases.'}
                            {item.title === 'Under Surveillance' && 'Track suspects under pursuit.'}
                            {item.title === 'General Report' && 'Trials and case statistics.'}
                            {item.title === 'Evidence' && 'Register and review evidence.'}
                            {item.title === 'Admin Panel' && 'System administration.'}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <h2 className='mb-4 text-lg font-semibold'>Overview</h2>
            <div className='grid gap-4 sm:grid-cols-3'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Solved Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className='h-8 w-16' />
                ) : error ? (
                  <div className='text-2xl font-bold text-destructive'>—</div>
                ) : (
                  <div className='text-2xl font-bold'>{stats?.solved_cases ?? 0}</div>
                )}
                <CardDescription>Total resolved cases</CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Employees
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className='h-8 w-16' />
                ) : error ? (
                  <div className='text-2xl font-bold text-destructive'>—</div>
                ) : (
                  <div className='text-2xl font-bold'>{stats?.employees ?? 0}</div>
                )}
                <CardDescription>Total organization staff</CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Active Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className='h-8 w-16' />
                ) : error ? (
                  <div className='text-2xl font-bold text-destructive'>—</div>
                ) : (
                  <div className='text-2xl font-bold'>{stats?.active_cases ?? 0}</div>
                )}
                <CardDescription>Cases under investigation</CardDescription>
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
      </Main>
    </>
  )
}
