import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useState, useEffect } from 'react'
import { updateSuspectStatus } from '@/api/suspects'
import { handleServerError } from '@/lib/handle-server-error'
import type { Suspect } from '@/api/suspects'

const STATUS_OPTIONS = [
  { value: 'UNDER_PURSUIT', label: 'Under Pursuit' },
  { value: 'HOT_PURSUIT', label: 'Hot Pursuit' },
  { value: 'CAPTURED', label: 'Captured' },
  { value: 'RELEASED', label: 'Released' },
]

type SuspectStatusDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  suspect: Suspect | null
}

export function SuspectStatusDialog({
  open,
  onOpenChange,
  suspect,
}: SuspectStatusDialogProps) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState(suspect?.status ?? 'UNDER_PURSUIT')

  useEffect(() => {
    if (suspect) setStatus(suspect.status)
  }, [suspect])

  const updateMutation = useMutation({
    mutationFn: ({ id, status: s }: { id: string; status: string }) =>
      updateSuspectStatus(id, s),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suspects'] })
      queryClient.invalidateQueries({ queryKey: ['most-wanted'] })
      onOpenChange(false)
    },
    onError: (err) => {
      handleServerError(err)
    },
  })

  const handleSubmit = () => {
    if (suspect) updateMutation.mutate({ id: suspect.id, status })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Suspect Status</DialogTitle>
          <DialogDescription>
            Change status for {suspect?.person_name ?? 'suspect'} (Case {suspect?.case_number ?? '—'}).
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div>
            <label className='text-sm font-medium'>Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className='mt-2'>
                <SelectValue placeholder='Select status' />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Updating...' : 'Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
