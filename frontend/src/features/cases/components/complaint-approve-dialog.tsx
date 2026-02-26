import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approveCrimeReport } from '@/api/cases'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'

type ComplaintApproveDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportId: string | null
  reportTitle: string
}

export function ComplaintApproveDialog({
  open,
  onOpenChange,
  reportId,
  reportTitle,
}: ComplaintApproveDialogProps) {
  const queryClient = useQueryClient()

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveCrimeReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crime-reports'] })
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      toast.success('Complaint approved. Case created.')
      onOpenChange(false)
    },
    onError: (err) => {
      handleServerError(err)
    },
  })

  const handleApprove = () => {
    if (reportId) approveMutation.mutate(reportId)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Approve Complaint</AlertDialogTitle>
          <AlertDialogDescription>
            Approve &quot;{reportTitle}&quot;? This will create a new case and link it to the complaint.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleApprove()
            }}
            disabled={approveMutation.isPending}
          >
            {approveMutation.isPending ? 'Approving...' : 'Approve'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
