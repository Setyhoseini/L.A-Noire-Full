import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getMyTips,
  getMySubmittedTips,
  createTip,
  officerReviewTip,
  detectiveConfirmTip,
  rewardLookup,
} from '@/api/tips'
import { getCases } from '@/api/cases'
import { getSuspects } from '@/api/suspects'
import { useAuthStore } from '@/stores/auth-store'
import { ErrorWithRetry } from '@/components/error-with-retry'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

function hasRole(roles: string[], role: string): boolean {
  return roles.some((r) => r.toLowerCase().trim() === role.toLowerCase())
}

const submitSchema = z.object({
  case: z.string().optional(),
  suspect: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
})

type SubmitFormValues = z.infer<typeof submitSchema>

export function TipsPage() {
  const [lookupNationalId, setLookupNationalId] = useState('')
  const [lookupCode, setLookupCode] = useState('')
  const [lookupResult, setLookupResult] = useState<{
    reward: number
    user: { first_name: string; last_name: string; national_id: string }
    unique_code: string
  } | null>(null)

  const user = useAuthStore((s) => s.user)
  const roles = user?.roles ?? []

  const isOfficer = hasRole(roles, 'Police Officer') || hasRole(roles, 'Patrol Officer')
  const isDetective = hasRole(roles, 'Detective')
  const isPolice = isOfficer || isDetective || hasRole(roles, 'Sergeant') || hasRole(roles, 'Captain') || hasRole(roles, 'Chief') || hasRole(roles, 'Cadet')

  const queryClient = useQueryClient()
  const form = useForm<SubmitFormValues>({
    resolver: zodResolver(submitSchema),
    defaultValues: { case: '', suspect: '', content: '' },
  })
  const caseId = form.watch('case')

  const { data: tips, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['reward-tips'],
    queryFn: getMyTips,
  })

  const { data: myTips } = useQuery({
    queryKey: ['reward-tips', 'mine'],
    queryFn: getMySubmittedTips,
  })

  const { data: cases } = useQuery({ queryKey: ['cases'], queryFn: getCases })
  const { data: suspects } = useQuery({
    queryKey: ['suspects', caseId],
    queryFn: getSuspects,
    enabled: !!caseId,
  })
  const caseSuspects = caseId ? (suspects ?? []).filter((s) => s.case === caseId) : suspects ?? []

  const createMutation = useMutation({
    mutationFn: createTip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward-tips'] })
      queryClient.invalidateQueries({ queryKey: ['reward-tips', 'mine'] })
      toast.success('Tip submitted')
      form.reset()
    },
  })

  const officerReviewMutation = useMutation({
    mutationFn: ({
      id,
      action,
      notes,
      detective,
    }: {
      id: string
      action: 'reject' | 'forward'
      notes?: string
      detective?: string
    }) => officerReviewTip(id, action, { notes, detective }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward-tips'] })
      toast.success('Review submitted')
    },
  })

  const detectiveConfirmMutation = useMutation({
    mutationFn: detectiveConfirmTip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward-tips'] })
      toast.success('Tip confirmed')
    },
  })

  const handleLookup = async () => {
    if (!lookupNationalId || !lookupCode) {
      toast.error('Enter national ID and code')
      return
    }
    try {
      const result = await rewardLookup(lookupNationalId, lookupCode)
      setLookupResult(result)
    } catch {
      setLookupResult(null)
      toast.error('No matching reward found')
    }
  }

  const submitTip = (values: SubmitFormValues) => {
    createMutation.mutate({
      content: values.content,
      case: values.case || undefined,
      suspect: values.suspect || undefined,
    })
  }

  return (
    <PageLayout
      title="Reward Tips"
      description="Submit tips, review as officer, confirm as detective, or lookup rewards."
    >
      <Tabs defaultValue="submit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="submit">Submit Tip</TabsTrigger>
          {isOfficer && <TabsTrigger value="review">Officer Review</TabsTrigger>}
          {isDetective && <TabsTrigger value="confirm">Detective Confirm</TabsTrigger>}
          {isPolice && <TabsTrigger value="lookup">Reward Lookup</TabsTrigger>}
        </TabsList>

        <TabsContent value="submit" className="space-y-4">
          <form onSubmit={form.handleSubmit(submitTip)} className="max-w-md space-y-4">
            <div>
              <Label>Case (optional)</Label>
              <Select onValueChange={form.setValue.bind(null, 'case')} value={form.watch('case')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select case" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {cases?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.case_number} – {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Suspect (optional)</Label>
              <Select onValueChange={form.setValue.bind(null, 'suspect')} value={form.watch('suspect')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select suspect" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {caseSuspects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.person_name} – {s.case_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tip content</Label>
              <Textarea
                placeholder="Describe your tip..."
                className="min-h-[120px]"
                {...form.register('content')}
              />
              {form.formState.errors.content && (
                <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>
              )}
            </div>
            <Button type="submit" disabled={createMutation.isPending}>
              Submit Tip
            </Button>
          </form>
        </TabsContent>

        {isOfficer && (
          <TabsContent value="review" className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : error ? (
              <ErrorWithRetry
                message="Failed to load tips"
                onRetry={() => refetch()}
                isRetrying={isFetching}
              />
            ) : !tips?.length ? (
              <p className="text-sm text-muted-foreground">No tips to review.</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content</TableHead>
                      <TableHead>Case</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tips.map((tip) => (
                      <TableRow key={tip.id}>
                        <TableCell className="max-w-[200px] truncate">{tip.content}</TableCell>
                        <TableCell className="font-mono text-sm">{tip.case_number ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{tip.status.replace('_', ' ')}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(tip.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        {tip.status === 'pending_review' && (
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  officerReviewMutation.mutate({
                                    id: tip.id,
                                    action: 'reject',
                                  })
                                }
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  officerReviewMutation.mutate({
                                    id: tip.id,
                                    action: 'forward',
                                  })
                                }
                              >
                                Forward
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        )}

        {isDetective && (
          <TabsContent value="confirm" className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : error ? (
              <ErrorWithRetry
                message="Failed to load tips"
                onRetry={() => refetch()}
                isRetrying={isFetching}
              />
            ) : !tips?.length ? (
              <p className="text-sm text-muted-foreground">No forwarded tips to confirm.</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content</TableHead>
                      <TableHead>Case</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Confirm</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tips.map((tip) => (
                      <TableRow key={tip.id}>
                        <TableCell className="max-w-[200px] truncate">{tip.content}</TableCell>
                        <TableCell className="font-mono text-sm">{tip.case_number ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{tip.status.replace('_', ' ')}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(tip.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        {tip.status === 'forwarded' && (
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => detectiveConfirmMutation.mutate(tip.id)}
                            >
                              Confirm
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        )}

        {isPolice && (
          <TabsContent value="lookup" className="space-y-4">
            <div className="max-w-md space-y-4">
              <div>
                <Label>National ID</Label>
                <Input
                  value={lookupNationalId}
                  onChange={(e) => setLookupNationalId(e.target.value)}
                  placeholder="National ID"
                />
              </div>
              <div>
                <Label>Unique Code</Label>
                <Input
                  value={lookupCode}
                  onChange={(e) => setLookupCode(e.target.value)}
                  placeholder="Unique code from confirmed tip"
                />
              </div>
              <Button onClick={handleLookup}>Lookup</Button>
              {lookupResult && (
                <div className="rounded-md border p-4">
                  <p className="font-medium">Reward: {lookupResult.reward.toLocaleString()} ریال</p>
                  <p className="text-sm text-muted-foreground">
                    {lookupResult.user.first_name} {lookupResult.user.last_name} –{' '}
                    {lookupResult.user.national_id}
                  </p>
                  <p className="text-sm">Code: {lookupResult.unique_code}</p>
                </div>
              )}
            </div>
          </TabsContent>
        )}

      </Tabs>

      <div className="mt-6">
        <h3 className="mb-2 font-semibold">My Tips</h3>
        {myTips?.length ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Unique Code</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myTips.map((tip) => (
                  <TableRow key={tip.id}>
                    <TableCell className="max-w-[200px] truncate">{tip.content}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{tip.status.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell className="font-mono">{tip.unique_code ?? '—'}</TableCell>
                    <TableCell>{format(new Date(tip.created_at), 'MMM d, yyyy')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Your submitted tips will appear here.</p>
        )}
      </div>
    </PageLayout>
  )
}
