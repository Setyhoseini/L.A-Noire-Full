import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  getBailPayments,
  createBailPayment,
  approveBailPayment,
  initiateBailPayment,
} from '@/api/bail'
import { getSuspects } from '@/api/suspects'
import { useAuthStore } from '@/stores/auth-store'
import { ErrorWithRetry } from '@/components/error-with-retry'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

function hasRole(roles: string[], role: string): boolean {
  return roles.some((r) => r.toLowerCase().trim() === role.toLowerCase())
}

export function BailPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedSuspect, setSelectedSuspect] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentType, setPaymentType] = useState<'bail' | 'fine'>('bail')

  const user = useAuthStore((s) => s.user)
  const roles = user?.roles ?? []
  const isSergeant = hasRole(roles, 'Sergeant')

  const queryClient = useQueryClient()

  const { data: payments, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['bail-payments'],
    queryFn: getBailPayments,
    enabled: isSergeant,
  })

  const { data: suspects } = useQuery({
    queryKey: ['suspects'],
    queryFn: getSuspects,
    enabled: isSergeant && createOpen,
  })

  const eligibleSuspects = suspects?.filter(
    (s) => s.crime_degree === 2 || s.crime_degree === 3
  ) ?? []

  const createMutation = useMutation({
    mutationFn: createBailPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bail-payments'] })
      toast.success('Bail request created')
      setCreateOpen(false)
      setSelectedSuspect('')
      setAmount('')
    },
  })

  const approveMutation = useMutation({
    mutationFn: approveBailPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bail-payments'] })
      toast.success('Payment approved')
    },
  })

  const initiateMutation = useMutation({
    mutationFn: initiateBailPayment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bail-payments'] })
      toast.success(data.message)
    },
  })

  const handleCreate = () => {
    const amt = parseFloat(amount)
    if (!selectedSuspect || isNaN(amt) || amt <= 0) {
      toast.error('Select suspect and enter valid amount')
      return
    }
    createMutation.mutate({
      suspect: selectedSuspect,
      amount: amt,
      payment_type: paymentType,
    })
  }

  const statusBadge = (s: string) => {
    const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending_approval: 'secondary',
      approved: 'default',
      pending_payment: 'default',
      paid: 'outline',
      rejected: 'destructive',
    }
    return map[s] ?? 'secondary'
  }

  if (!isSergeant) {
    return (
      <PageLayout title="Bail & Fines" description="Sergeant only.">
        <p className="text-sm text-muted-foreground">You do not have access to this page.</p>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="Bail & Fines"
      description="Manage bail and fine payments. Sergeant creates and approves."
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Bail/Fine Request
          </Button>
        </div>

        {isLoading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : error ? (
          <ErrorWithRetry
            message="Failed to load bail payments."
            onRetry={() => refetch()}
            isRetrying={isFetching}
          />
        ) : !payments?.length ? (
          <p className="text-sm text-muted-foreground">No bail/fine requests yet.</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Suspect</TableHead>
                  <TableHead>Case</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.suspect_name}</TableCell>
                    <TableCell className="font-mono text-sm">{p.case_number ?? '—'}</TableCell>
                    <TableCell>{p.payment_type}</TableCell>
                    <TableCell>{Number(p.amount).toLocaleString()} ریال</TableCell>
                    <TableCell>
                      <Badge variant={statusBadge(p.status)}>
                        {p.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(p.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {p.status === 'pending_approval' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => approveMutation.mutate(p.id)}
                        >
                          Approve
                        </Button>
                      )}
                      {p.status === 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => initiateMutation.mutate(p.id)}
                        >
                          Pay
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Bail/Fine Request</DialogTitle>
            <DialogDescription>
              Create a bail or fine request for a suspect. Only suspects with crime degree 2 or 3
              are eligible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Suspect</Label>
              <Select value={selectedSuspect} onValueChange={setSelectedSuspect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select suspect" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleSuspects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.person_name} – {s.case_number} (degree {s.crime_degree})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={paymentType}
                onValueChange={(v) => setPaymentType(v as 'bail' | 'fine')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bail">Bail</SelectItem>
                  <SelectItem value="fine">Fine</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount (Rial)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
