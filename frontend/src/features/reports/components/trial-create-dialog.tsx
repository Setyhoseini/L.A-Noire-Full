import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createTrial, type CreateTrialPayload } from '@/api/reports'
import { getCases } from '@/api/cases'
import { handleServerError } from '@/lib/handle-server-error'

const formSchema = z.object({
  case: z.string().min(1, 'Case is required'),
  verdict: z.string().default('other'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  court_room: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

type TrialCreateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TrialCreateDialog({ open, onOpenChange }: TrialCreateDialogProps) {
  const queryClient = useQueryClient()
  const { data: cases } = useQuery({
    queryKey: ['cases'],
    queryFn: getCases,
    enabled: open,
  })
  const casesList = Array.isArray(cases) ? cases : []

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      case: '',
      verdict: 'other',
      start_date: '',
      end_date: '',
      court_room: '',
      notes: '',
    },
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateTrialPayload) => createTrial(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trials'] })
      toast.success('Trial created successfully')
      form.reset()
      onOpenChange(false)
    },
    onError: (err) => {
      handleServerError(err)
    },
  })

  const onSubmit = (values: FormValues) => {
    const payload: CreateTrialPayload = {
      case: values.case,
      verdict: values.verdict,
      court_room: values.court_room || undefined,
      notes: values.notes || undefined,
    }
    if (values.start_date) payload.start_date = values.start_date
    if (values.end_date) payload.end_date = values.end_date
    createMutation.mutate(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Trial</DialogTitle>
          <DialogDescription>
            Record a new trial for a case. Link to the case and set verdict.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='case'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Case</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select case' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {casesList.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.case_number} – {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='verdict'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verdict</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select verdict' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='guilty'>Guilty</SelectItem>
                      <SelectItem value='not_guilty'>Not Guilty</SelectItem>
                      <SelectItem value='mistrial'>Mistrial</SelectItem>
                      <SelectItem value='other'>Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='start_date'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type='date' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='end_date'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input type='date' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='court_room'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Court Room</FormLabel>
                  <FormControl>
                    <Input placeholder='Court room' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder='Notes' className='min-h-[60px]' {...field} />
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
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
