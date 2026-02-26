import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { returnCrimeReport } from '@/api/cases'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'

const formSchema = z.object({
  reason: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

type ComplaintReturnDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportId: string | null
  reportTitle: string
}

export function ComplaintReturnDialog({
  open,
  onOpenChange,
  reportId,
  reportTitle,
}: ComplaintReturnDialogProps) {
  const queryClient = useQueryClient()
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { reason: '' },
  })

  const returnMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      returnCrimeReport(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crime-reports'] })
      toast.success('Complaint returned to reporter.')
      form.reset()
      onOpenChange(false)
    },
    onError: (err) => {
      handleServerError(err)
    },
  })

  const onSubmit = (values: FormValues) => {
    if (reportId) returnMutation.mutate({ id: reportId, reason: values.reason ?? '' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Return Complaint</DialogTitle>
          <DialogDescription>
            Return &quot;{reportTitle}&quot; to the reporter. Provide a reason (optional).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='reason'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Reason for returning (e.g. incomplete information)'
                      className='min-h-[80px]'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit' disabled={returnMutation.isPending}>
                {returnMutation.isPending ? 'Returning...' : 'Return'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
