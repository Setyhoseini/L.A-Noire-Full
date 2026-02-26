import { useQuery } from '@tanstack/react-query'
import { PageLayout } from '@/components/layout/page-layout'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getTrials, getGeneralReportStats } from '@/api/reports'
import { format } from 'date-fns'
import { FileText } from 'lucide-react'

export function ReportsPage() {
  const { data: trials, isLoading: trialsLoading, error: trialsError } = useQuery({
    queryKey: ['trials'],
    queryFn: getTrials,
  })

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getGeneralReportStats,
  })

  return (
    <PageLayout
      title='General Report'
      description='Overview of trials and case statistics. For Judge, Captain, Chief, Prosecutor.'
    >
      <div className='space-y-6'>
        {statsLoading ? (
          <Skeleton className='h-24 w-full' />
        ) : stats && (
          <div className='grid gap-4 sm:grid-cols-3'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Solved Cases</CardTitle>
                <FileText className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stats.solved_cases}</div>
                <CardDescription>Total resolved cases</CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Employees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stats.employees}</div>
                <CardDescription>Total organization staff</CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Active Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stats.active_cases}</div>
                <CardDescription>Cases under investigation</CardDescription>
              </CardContent>
            </Card>
          </div>
        )}

        <div>
          <h2 className='mb-4 text-lg font-semibold'>Trials</h2>
          {trialsLoading ? (
            <Skeleton className='h-[200px] w-full' />
          ) : trialsError ? (
            <p className='text-sm text-destructive'>Failed to load trials.</p>
          ) : !trials?.length ? (
            <p className='text-sm text-muted-foreground'>No trials recorded.</p>
          ) : (
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case</TableHead>
                    <TableHead>Verdict</TableHead>
                    <TableHead>Court Room</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trials.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className='font-mono text-sm'>{t.case_number || t.case}</TableCell>
                      <TableCell>
                        <Badge variant='secondary'>{t.verdict.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>{t.court_room || '—'}</TableCell>
                      <TableCell className='text-muted-foreground'>
                        {t.start_date ? format(new Date(t.start_date), 'MMM d, yyyy') : '—'}
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        {t.end_date ? format(new Date(t.end_date), 'MMM d, yyyy') : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
