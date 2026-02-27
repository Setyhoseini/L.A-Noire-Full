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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createInterrogation } from '@/api/interrogations'
import { getCases } from '@/api/cases'
import { getSuspects } from '@/api/suspects'
import { handleServerError } from '@/lib/handle-server-error'

const formSchema = z.object({
  case: z.string().min(1, 'Case is required'),
  suspect: z.string().min(1, 'Suspect is required'),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  location: z.string().optional(),
  transcript: z.string().optional(),
  outcome: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

type InterrogationCreateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InterrogationCreateDialog({ open, onOpenChange }: InterrogationCreateDialogProps) {
  const queryClient = useQueryClient()
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      case: '',
      suspect: '',
      start_time: '',
      end_time: '',
      location: '',
      transcript: '',
      outcome: 'other',
      notes: '',
    },
  })

  const caseId = form.watch('case')

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

  const caseSuspects = caseId
    ? suspects?.filter((s) => s.case === caseId) ?? []
    : suspects ?? []

  const createMutation = useMutation({
    mutationFn: createInterrogation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interrogations'] })
      toast.success('Interrogation created')
      form.reset()
      onOpenChange(false)
    },
    onError: (err) => {
      toast.error(handleServerError(err))
    },
  })

  const onSubmit = (values: FormValues) => {
    createMutation.mutate({
      case: values.case,
      suspect: values.suspect,
      start_time: values.start_time || undefined,
      end_time: values.end_time || undefined,
      location: values.location,
      transcript: values.transcript,
      outcome: values.outcome,
      notes: values.notes,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Interrogation</DialogTitle>
          <DialogDescription>
            Link a suspect to a case for interrogation. Guilt scores and verdicts can be submitted
            after creation.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="case"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Case</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select case" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cases?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.case_number} - {c.title}
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
              name="suspect"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Suspect</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select suspect" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {caseSuspects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.person_name} - {s.case_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
