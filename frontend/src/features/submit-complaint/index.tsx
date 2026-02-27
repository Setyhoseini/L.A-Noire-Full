import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { PageLayout } from '@/components/layout/page-layout'
import { Button } from '@/components/ui/button'
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
import { getCrimeReports } from '@/api/cases'
import { ComplaintCreateDialog } from '@/features/cases/components/complaint-create-dialog'
import { ErrorWithRetry } from '@/components/error-with-retry'
import { format } from 'date-fns'

const STATUS_COLORS: Record<string, string> = {
  pending_superior: 'secondary',
  approved: 'default',
  returned: 'destructive',
}

/**
 * Submit Complaint page for Base users.
 * They can submit new complaints and view the status of their submissions.
 * Backend restricts: Base users only see their own reports.
 */
export function SubmitComplaintPage() {
  const [complaintDialogOpen, setComplaintDialogOpen] = useState(false)

  const {
    data: crimeReports,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['crime-reports'],
    queryFn: getCrimeReports,
  })

  return (
    <PageLayout
      title='Submit Complaint'
      description='File a crime report or complaint. It will be reviewed and assigned to a cadet for processing.'
    >
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <p className='text-sm text-muted-foreground'>
            Submit a new complaint below. You can track the status of your submissions.
          </p>
          <Button onClick={() => setComplaintDialogOpen(true)}>
            <Plus className='mr-2 h-4 w-4' />
            Submit Complaint
          </Button>
        </div>

        <div>
          <h2 className='mb-4 text-lg font-semibold'>Your Submissions</h2>
          {isLoading ? (
            <Skeleton className='h-[200px] w-full' />
          ) : error ? (
            <ErrorWithRetry
              message='Failed to load your complaints.'
              onRetry={() => refetch()}
              isRetrying={isFetching}
            />
          ) : !crimeReports?.length ? (
            <p className='text-sm text-muted-foreground'>
              No complaints yet. Submit one to get started.
            </p>
          ) : (
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Assigned To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {crimeReports.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className='font-medium'>{r.title}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            STATUS_COLORS[r.status] as
                              | 'default'
                              | 'secondary'
                              | 'destructive'
                              ?? 'secondary'
                          }
                        >
                          {r.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{r.location || '—'}</TableCell>
                      <TableCell className='text-muted-foreground'>
                        {format(new Date(r.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        {r.assigned_cadet_name ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <ComplaintCreateDialog
        open={complaintDialogOpen}
        onOpenChange={setComplaintDialogOpen}
      />
    </PageLayout>
  )
}
