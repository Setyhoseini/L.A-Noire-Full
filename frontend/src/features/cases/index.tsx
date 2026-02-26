import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Check, Undo2, Eye, Pencil, UserPlus } from 'lucide-react'
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
import { getCases, getCrimeReports, type Case } from '@/api/cases'
import { getSuspects } from '@/api/suspects'
import { CaseCreateDialog } from './components/case-create-dialog'
import { ComplaintCreateDialog } from './components/complaint-create-dialog'
import { ComplaintApproveDialog } from './components/complaint-approve-dialog'
import { ComplaintReturnDialog } from './components/complaint-return-dialog'
import { CaseDetailSheet } from './components/case-detail-sheet'
import { CaseEditDialog } from './components/case-edit-dialog'
import { SuspectCreateDialog } from './components/suspect-create-dialog'
import { SuspectStatusDialog } from './components/suspect-status-dialog'
import { PersonCreateDialog } from './components/person-create-dialog'
import type { Suspect } from '@/api/suspects'
import { useAuthStore } from '@/stores/auth-store'
import { ErrorWithRetry } from '@/components/error-with-retry'
import { format } from 'date-fns'

function canApproveComplaints(roles: string[]): boolean {
  const names = ['sergeant', 'captain', 'chief', 'detective']
  return roles.some((r) => names.includes(r.trim().toLowerCase()))
}

function canAccessSurveillance(roles: string[]): boolean {
  const names = ['detective', 'sergeant', 'captain', 'chief', 'police officer', 'patrol officer', 'officer']
  return roles.some((r) => names.includes(r.trim().toLowerCase()))
}

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
  const [approveDialog, setApproveDialog] = useState<{ id: string; title: string } | null>(null)
  const [returnDialog, setReturnDialog] = useState<{ id: string; title: string } | null>(null)
  const [detailCaseId, setDetailCaseId] = useState<string | null>(null)
  const [editCase, setEditCase] = useState<Case | null>(null)
  const [suspectDialogOpen, setSuspectDialogOpen] = useState(false)
  const [personDialogOpen, setPersonDialogOpen] = useState(false)
  const [statusSuspect, setStatusSuspect] = useState<Suspect | null>(null)

  const user = useAuthStore((s) => s.user)
  const roles = user?.roles ?? []
  const canApprove = canApproveComplaints(roles)
  const canSeeSuspects = canAccessSurveillance(roles)

  const {
    data: cases,
    isLoading: casesLoading,
    error: casesError,
    refetch: refetchCases,
    isFetching: casesFetching,
  } = useQuery({
    queryKey: ['cases'],
    queryFn: getCases,
  })

  const {
    data: crimeReports,
    isLoading: reportsLoading,
    error: reportsError,
    refetch: refetchReports,
    isFetching: reportsFetching,
  } = useQuery({
    queryKey: ['crime-reports'],
    queryFn: getCrimeReports,
  })

  const {
    data: suspects,
    isLoading: suspectsLoading,
    error: suspectsError,
    refetch: refetchSuspects,
    isFetching: suspectsFetching,
  } = useQuery({
    queryKey: ['suspects'],
    queryFn: getSuspects,
    enabled: canSeeSuspects,
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
            {canSeeSuspects && <TabsTrigger value='suspects'>Suspects</TabsTrigger>}
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
            {canSeeSuspects && (
              <>
                <Button size='sm' variant='outline' onClick={() => setPersonDialogOpen(true)}>
                  <UserPlus className='mr-2 h-4 w-4' />
                  New Person
                </Button>
                <Button size='sm' variant='outline' onClick={() => setSuspectDialogOpen(true)}>
                  <Plus className='mr-2 h-4 w-4' />
                  Add Suspect
                </Button>
              </>
            )}
          </div>
        </div>

        <TabsContent value='cases' className='space-y-4'>
          {casesLoading ? (
            <Skeleton className='h-[200px] w-full' />
          ) : casesError ? (
            <ErrorWithRetry
              message='Failed to load cases.'
              onRetry={() => refetchCases()}
              isRetrying={casesFetching}
            />
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
                    <TableHead className='w-[100px]'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((c) => (
                    <TableRow
                      key={c.id}
                      className='cursor-pointer hover:bg-muted/50'
                      onClick={() => setDetailCaseId(c.id)}
                    >
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
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className='flex gap-2'>
                          <Button
                            size='sm'
                            variant='ghost'
                            className='h-8 px-2'
                            onClick={() => setDetailCaseId(c.id)}
                          >
                            <Eye className='h-4 w-4' />
                          </Button>
                          <Button
                            size='sm'
                            variant='ghost'
                            className='h-8 px-2'
                            onClick={() => setEditCase(c)}
                          >
                            <Pencil className='h-4 w-4' />
                          </Button>
                        </div>
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
            <ErrorWithRetry
              message='Failed to load complaints.'
              onRetry={() => refetchReports()}
              isRetrying={reportsFetching}
            />
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
                    {canApprove && <TableHead className='w-[120px]'>Actions</TableHead>}
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
                      {canApprove && (
                        <TableCell>
                          {r.status === 'pending_superior' && (
                            <div className='flex gap-2'>
                              <Button
                                size='sm'
                                variant='ghost'
                                className='h-8 px-2'
                                onClick={() => setApproveDialog({ id: r.id, title: r.title })}
                              >
                                <Check className='h-4 w-4' />
                              </Button>
                              <Button
                                size='sm'
                                variant='ghost'
                                className='h-8 px-2'
                                onClick={() => setReturnDialog({ id: r.id, title: r.title })}
                              >
                                <Undo2 className='h-4 w-4' />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {canSeeSuspects && (
        <TabsContent value='suspects' className='space-y-4'>
          {suspectsLoading ? (
            <Skeleton className='h-[200px] w-full' />
          ) : suspectsError ? (
            <ErrorWithRetry
              message='Failed to load suspects.'
              onRetry={() => refetchSuspects()}
              isRetrying={suspectsFetching}
            />
          ) : !suspects?.length ? (
            <p className='text-sm text-muted-foreground'>
              No suspects yet. Create a person first, then add them as a suspect to a case.
            </p>
          ) : (
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Case</TableHead>
                    <TableHead>Days at Large</TableHead>
                    <TableHead>Crime Degree</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead className='w-[100px]'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suspects.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className='font-medium'>{s.person_name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            s.status === 'HOT_PURSUIT'
                              ? 'destructive'
                              : s.status === 'CAPTURED'
                                ? 'outline'
                                : 'secondary'
                          }
                        >
                          {s.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className='font-mono text-sm'>{s.case_number}</TableCell>
                      <TableCell>{s.days_under_pursuit ?? '—'}</TableCell>
                      <TableCell>{s.crime_degree ?? '—'}</TableCell>
                      <TableCell className='text-muted-foreground'>
                        {s.start_date ? format(new Date(s.start_date), 'MMM d, yyyy') : '—'}
                      </TableCell>
                      <TableCell>
                        <Button
                          size='sm'
                          variant='ghost'
                          className='h-8 px-2'
                          onClick={() => setStatusSuspect(s)}
                        >
                          <Pencil className='h-4 w-4' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        )}
      </Tabs>

      <CaseCreateDialog open={caseDialogOpen} onOpenChange={setCaseDialogOpen} />
      <ComplaintCreateDialog open={complaintDialogOpen} onOpenChange={setComplaintDialogOpen} />
      <ComplaintApproveDialog
        open={!!approveDialog}
        onOpenChange={(open) => !open && setApproveDialog(null)}
        reportId={approveDialog?.id ?? null}
        reportTitle={approveDialog?.title ?? ''}
      />
      <ComplaintReturnDialog
        open={!!returnDialog}
        onOpenChange={(open) => !open && setReturnDialog(null)}
        reportId={returnDialog?.id ?? null}
        reportTitle={returnDialog?.title ?? ''}
      />
      <CaseDetailSheet
        open={!!detailCaseId}
        onOpenChange={(open) => !open && setDetailCaseId(null)}
        caseId={detailCaseId}
        onEdit={setEditCase}
      />
      <CaseEditDialog
        open={!!editCase}
        onOpenChange={(open) => !open && setEditCase(null)}
        caseData={editCase}
      />
      <PersonCreateDialog open={personDialogOpen} onOpenChange={setPersonDialogOpen} />
      <SuspectCreateDialog open={suspectDialogOpen} onOpenChange={setSuspectDialogOpen} />
      <SuspectStatusDialog
        open={!!statusSuspect}
        onOpenChange={(open) => !open && setStatusSuspect(null)}
        suspect={statusSuspect}
      />
    </PageLayout>
  )
}
