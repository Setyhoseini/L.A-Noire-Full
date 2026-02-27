import { useEffect } from 'react'
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
import { getSuspects } from '@/api/suspects'
import { handleServerError } from '@/lib/handle-server-error'

const formSchema = z.object({
  case: z.string().min(1, 'Case is required'),
  suspect: z.string().optional(),
  verdict: z.string().default('other'),
  verdict_details: z.string().optional(),
  punishment_title: z.string().optional(),
  punishment_description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  court_room: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

type TrialCreateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  preselectedCaseId?: string
}

export function TrialCreateDialog({ open, onOpenChange, preselectedCaseId }: TrialCreateDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      case: preselectedCaseId ?? '',
      suspect: '',
      verdict: 'other',
      verdict_details: '',
      punishment_title: '',
      punishment_description: '',
      start_date: '',
      end_date: '',
      court_room: '',
      notes: '',
    },
  })

  const caseId = form.watch('case') || preselectedCaseId

  useEffect(() => {
    if (open && preselectedCaseId) {
      form.setValue('case', preselectedCaseId)
    }
  }, [open, preselectedCaseId, form])

  const { data: cases } = useQuery({
    queryKey: ['cases'],
    queryFn: getCases,
    enabled: open,
  })
  const { data: suspects } = useQuery({
    queryKey: ['suspects', caseId],
    queryFn: getSuspects,
    enabled: open && !!caseId,
  })

  const casesList = Array.isArray(cases) ? cases : []
  const caseSuspects = caseId
    ? (suspects ?? []).filter((s) => s.case === caseId)
    : suspects ?? []

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
    if (values.suspect) payload.suspect = values.suspect
    if (values.verdict_details) payload.verdict_details = values.verdict_details
    if (values.punishment_title) payload.punishment_title = values.punishment_title
    if (values.punishment_description) payload.punishment_description = values.punishment_description
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
              name='suspect'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Suspect (person tried)</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === '__none__' ? undefined : v)}
                    value={field.value || '__none__'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select suspect (optional)' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='__none__'>None</SelectItem>
                      {caseSuspects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.person_name} – {s.case_number}
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
              name='verdict_details'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verdict Details (Judge notes)</FormLabel>
                  <FormControl>
                    <Textarea placeholder='Judge notes' className='min-h-[60px]' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='punishment_title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Punishment Title</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g. 5 years imprisonment' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='punishment_description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Punishment Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder='Punishment details' className='min-h-[60px]' {...field} />
                  </FormControl>
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
