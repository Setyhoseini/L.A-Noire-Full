import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Gavel, Check, X } from 'lucide-react'
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
import {
  getInterrogations,
  submitGuiltScore,
  submitCaptainVerdict,
  chiefApprove,
  type Interrogation,
} from '@/api/interrogations'
import { useAuthStore } from '@/stores/auth-store'
import { ErrorWithRetry } from '@/components/error-with-retry'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { InterrogationCreateDialog } from './components/interrogation-create-dialog'
import { GuiltScoreDialog } from './components/guilt-score-dialog'
import { CaptainVerdictDialog } from './components/captain-verdict-dialog'
import { ChiefApproveDialog } from './components/chief-approve-dialog'

function hasRole(userRoles: string[], role: string): boolean {
  return userRoles.some((r) => r.toLowerCase().trim() === role.toLowerCase())
}

function hasPermission(permissions: string[], code: string): boolean {
  return permissions.includes(code)
}

export function InterrogationsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [guiltScoreInterrogation, setGuiltScoreInterrogation] = useState<Interrogation | null>(null)
  const [captainVerdictInterrogation, setCaptainVerdictInterrogation] =
    useState<Interrogation | null>(null)
  const [chiefApproveInterrogation, setChiefApproveInterrogation] =
    useState<Interrogation | null>(null)

  const user = useAuthStore((s) => s.user)
  const roles = user?.roles ?? []
  const permissions = user?.permissions ?? []

  const isSergeant = hasRole(roles, 'Sergeant')
  const isDetective = hasRole(roles, 'Detective')
  const isCaptain = hasRole(roles, 'Captain')
  const isChief = hasRole(roles, 'Chief')
  const canSubmitGuiltScore = (isSergeant || isDetective) || hasPermission(permissions, 'interrogation.access')
  const canSubmitCaptainVerdict = isCaptain || hasPermission(permissions, 'interrogation.captain_verdict')
  const canChiefApprove = isChief || hasPermission(permissions, 'interrogation.chief_approve')

  const queryClient = useQueryClient()

  const { data: interrogations, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['interrogations'],
    queryFn: () => getInterrogations(),
  })

  const guiltScoreMutation = useMutation({
    mutationFn: ({ id, score }: { id: string; score: number }) => submitGuiltScore(id, score),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interrogations'] })
      toast.success('Guilt score submitted')
      setGuiltScoreInterrogation(null)
    },
  })

  const captainVerdictMutation = useMutation({
    mutationFn: ({
      id,
      verdict,
    }: {
      id: string
      verdict: 'guilty' | 'suspected' | 'cleared'
    }) => submitCaptainVerdict(id, verdict),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interrogations'] })
      toast.success('Captain verdict submitted')
      setCaptainVerdictInterrogation(null)
    },
  })

  const chiefApproveMutation = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      chiefApprove(id, approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interrogations'] })
      toast.success('Chief decision recorded')
      setChiefApproveInterrogation(null)
    },
  })

  const verdictBadge = (v: string) => {
    const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      guilty: 'destructive',
      suspected: 'default',
      cleared: 'outline',
    }
    return map[v] ?? 'secondary'
  }

  return (
    <PageLayout
      title="Interrogations"
      description="Manage interrogations, guilt scores, and verdicts."
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Interrogation
          </Button>
        </div>

        {isLoading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : error ? (
          <ErrorWithRetry
            message="Failed to load interrogations."
            onRetry={() => refetch()}
            isRetrying={isFetching}
          />
        ) : !interrogations?.length ? (
          <p className="text-sm text-muted-foreground">
            No interrogations yet. Create one to get started.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case</TableHead>
                  <TableHead>Suspect</TableHead>
                  <TableHead>Crime Level</TableHead>
                  <TableHead>Sgt Score</TableHead>
                  <TableHead>Det Score</TableHead>
                  <TableHead>Verdict</TableHead>
                  <TableHead>Chief</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {interrogations.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-mono text-sm">{i.case_number ?? '—'}</TableCell>
                    <TableCell>{i.suspect_name ?? '—'}</TableCell>
                    <TableCell>{i.crime_level ?? '—'}</TableCell>
                    <TableCell>{i.guilt_score_sergeant ?? '—'}</TableCell>
                    <TableCell>{i.guilt_score_detective ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={verdictBadge(i.captain_verdict)}>
                        {i.captain_verdict}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {i.case && i.crime_level === 'critical' ? (
                        i.chief_approved === null ? (
                          <Badge variant="secondary">Pending</Badge>
                        ) : i.chief_approved ? (
                          <Badge variant="outline">Approved</Badge>
                        ) : (
                          <Badge variant="destructive">Rejected</Badge>
                        )
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {i.start_time ? format(new Date(i.start_time), 'MMM d, yyyy') : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {canSubmitGuiltScore &&
                          (isSergeant ? i.guilt_score_sergeant == null : i.guilt_score_detective == null) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2"
                              onClick={() => setGuiltScoreInterrogation(i)}
                            >
                              Score
                            </Button>
                          )}
                        {canSubmitCaptainVerdict &&
                          i.captain_verdict === 'pending' &&
                          (i.guilt_score_sergeant != null || i.guilt_score_detective != null) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2"
                              onClick={() => setCaptainVerdictInterrogation(i)}
                            >
                              <Gavel className="h-4 w-4" />
                            </Button>
                          )}
                        {canChiefApprove &&
                          i.crime_level === 'critical' &&
                          i.captain_verdict !== 'pending' &&
                          i.chief_approved === null && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2"
                              onClick={() => setChiefApproveInterrogation(i)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <InterrogationCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <GuiltScoreDialog
        open={!!guiltScoreInterrogation}
        onOpenChange={(o) => !o && setGuiltScoreInterrogation(null)}
        interrogation={guiltScoreInterrogation}
        userRole={isSergeant ? 'sergeant' : 'detective'}
        onSubmit={(score) =>
          guiltScoreInterrogation &&
          guiltScoreMutation.mutate({ id: guiltScoreInterrogation.id, score })
        }
        isLoading={guiltScoreMutation.isPending}
      />
      <CaptainVerdictDialog
        open={!!captainVerdictInterrogation}
        onOpenChange={(o) => !o && setCaptainVerdictInterrogation(null)}
        interrogation={captainVerdictInterrogation}
        onSubmit={(verdict) =>
          captainVerdictInterrogation &&
          captainVerdictMutation.mutate({
            id: captainVerdictInterrogation.id,
            verdict,
          })
        }
        isLoading={captainVerdictMutation.isPending}
      />
      <ChiefApproveDialog
        open={!!chiefApproveInterrogation}
        onOpenChange={(o) => !o && setChiefApproveInterrogation(null)}
        interrogation={chiefApproveInterrogation}
        onSubmit={(approved) =>
          chiefApproveInterrogation &&
          chiefApproveMutation.mutate({
            id: chiefApproveInterrogation.id,
            approved,
          })
        }
        isLoading={chiefApproveMutation.isPending}
      />
    </PageLayout>
  )
}
