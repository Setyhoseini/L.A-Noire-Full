import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createCrimeReport, type CreateCrimeReportPayload } from '@/api/cases'
import { handleServerError } from '@/lib/handle-server-error'

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  occurred_at: z.string().optional(),
  location: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

type ComplaintCreateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ComplaintCreateDialog({ open, onOpenChange }: ComplaintCreateDialogProps) {
  const queryClient = useQueryClient()
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      occurred_at: '',
      location: '',
    },
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateCrimeReportPayload) => createCrimeReport(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crime-reports'] })
      toast.success('Complaint submitted successfully')
      form.reset()
      onOpenChange(false)
    },
    onError: (err) => {
      toast.error(handleServerError(err))
    },
  })

  const onSubmit = (values: FormValues) => {
    const payload: CreateCrimeReportPayload = {
      title: values.title,
      description: values.description || undefined,
      location: values.location || undefined,
    }
    if (values.occurred_at) {
      payload.occurred_at = values.occurred_at
    }
    createMutation.mutate(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Complaint</DialogTitle>
          <DialogDescription>
            File a crime report or complaint. It will be reviewed by a superior.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder='Complaint title' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder='Details of the incident' className='min-h-[80px]' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='occurred_at'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date & Time (optional)</FormLabel>
                  <FormControl>
                    <Input type='datetime-local' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='location'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder='Where did it occur?' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit' disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Submitting...' : 'Submit'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
