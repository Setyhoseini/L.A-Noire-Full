import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { PageLayout } from '@/components/layout/page-layout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { getCases, getCrimeReports } from '@/api/cases'
import { CaseCreateDialog } from './components/case-create-dialog'
import { ComplaintCreateDialog } from './components/complaint-create-dialog'
import { format } from 'date-fns'

const STATUS_COLORS: Record<string, string> = {
  new: 'secondary',
  open: 'default',
  investigation: 'default',
  closed: 'outline',
  cold: 'secondary',
  archived: 'secondary',
  pending_superior: 'secondary',
  approved: 'default',
  returned: 'destructive',
}

export function CasesPage() {
  const [caseDialogOpen, setCaseDialogOpen] = useState(false)
  const [complaintDialogOpen, setComplaintDialogOpen] = useState(false)

  const { data: cases, isLoading: casesLoading, error: casesError } = useQuery({
    queryKey: ['cases'],
    queryFn: getCases,
  })

  const { data: crimeReports, isLoading: reportsLoading, error: reportsError } = useQuery({
    queryKey: ['crime-reports'],
    queryFn: getCrimeReports,
  })

  return (
    <PageLayout
      title='Cases & Complaints'
      description='View and manage cases and complaints.'
    >
      <Tabs defaultValue='cases' className='space-y-4'>
        <div className='flex items-center justify-between'>
          <TabsList>
            <TabsTrigger value='cases'>Cases</TabsTrigger>
            <TabsTrigger value='complaints'>Complaints</TabsTrigger>
          </TabsList>
          <div className='flex gap-2'>
            <Button size='sm' onClick={() => setCaseDialogOpen(true)}>
              <Plus className='mr-2 h-4 w-4' />
              New Case
            </Button>
            <Button size='sm' variant='outline' onClick={() => setComplaintDialogOpen(true)}>
              <Plus className='mr-2 h-4 w-4' />
              Submit Complaint
            </Button>
          </div>
        </div>

        <TabsContent value='cases' className='space-y-4'>
          {casesLoading ? (
            <Skeleton className='h-[200px] w-full' />
          ) : casesError ? (
            <p className='text-sm text-destructive'>Failed to load cases.</p>
          ) : !cases?.length ? (
            <p className='text-sm text-muted-foreground'>No cases yet. Create one to get started.</p>
          ) : (
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Precinct</TableHead>
                    <TableHead>Opened</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className='font-mono text-sm'>{c.case_number}</TableCell>
                      <TableCell>{c.title}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_COLORS[c.status] as 'default' | 'secondary' | 'outline' | 'destructive' ?? 'secondary'}>
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{c.priority}</TableCell>
                      <TableCell>{c.precinct || '—'}</TableCell>
                      <TableCell className='text-muted-foreground'>
                        {format(new Date(c.opened_at), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value='complaints' className='space-y-4'>
          {reportsLoading ? (
            <Skeleton className='h-[200px] w-full' />
          ) : reportsError ? (
            <p className='text-sm text-destructive'>Failed to load complaints.</p>
          ) : !crimeReports?.length ? (
            <p className='text-sm text-muted-foreground'>No complaints yet. Submit one to get started.</p>
          ) : (
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {crimeReports.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.title}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_COLORS[r.status] as 'default' | 'secondary' | 'outline' | 'destructive' ?? 'secondary'}>
                          {r.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{r.location || '—'}</TableCell>
                      <TableCell className='text-muted-foreground'>
                        {format(new Date(r.created_at), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CaseCreateDialog open={caseDialogOpen} onOpenChange={setCaseDialogOpen} />
      <ComplaintCreateDialog open={complaintDialogOpen} onOpenChange={setComplaintDialogOpen} />
    </PageLayout>
  )
}
