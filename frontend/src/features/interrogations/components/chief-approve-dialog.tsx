import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Interrogation } from '@/api/interrogations'

type ChiefApproveDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  interrogation: Interrogation | null
  onSubmit: (approved: boolean) => void
  isLoading?: boolean
}

export function ChiefApproveDialog({
  open,
  onOpenChange,
  interrogation,
  onSubmit,
  isLoading,
}: ChiefApproveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chief Approval</DialogTitle>
          <DialogDescription>
            Approve or reject the Captain&apos;s verdict for {interrogation?.suspect_name} - Case{' '}
            {interrogation?.case_number}. This is a critical-level case.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => onSubmit(false)}
            disabled={isLoading}
          >
            Reject
          </Button>
          <Button onClick={() => onSubmit(true)} disabled={isLoading}>
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
