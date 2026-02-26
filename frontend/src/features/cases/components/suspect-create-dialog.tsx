import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createSuspect, type CreateSuspectPayload } from '@/api/suspects'
import { getCases } from '@/api/cases'
import { getPersons } from '@/api/persons'
import { handleServerError } from '@/lib/handle-server-error'

const formSchema = z.object({
  person: z.string().min(1, 'Person is required'),
  case: z.string().min(1, 'Case is required'),
  status: z.string().default('UNDER_PURSUIT'),
  crime_degree: z.coerce.number().optional(),
})

type FormValues = z.infer<typeof formSchema>

type SuspectCreateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SuspectCreateDialog({ open, onOpenChange }: SuspectCreateDialogProps) {
  const queryClient = useQueryClient()
  const { data: cases } = useQuery({
    queryKey: ['cases'],
    queryFn: getCases,
    enabled: open,
  })
  const { data: persons } = useQuery({
    queryKey: ['persons'],
    queryFn: getPersons,
    enabled: open,
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      person: '',
      case: '',
      status: 'UNDER_PURSUIT',
      crime_degree: undefined,
    },
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateSuspectPayload) => createSuspect(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suspects'] })
      queryClient.invalidateQueries({ queryKey: ['most-wanted'] })
      form.reset()
      onOpenChange(false)
    },
    onError: (err) => {
      handleServerError(err)
    },
  })

  const onSubmit = (values: FormValues) => {
    const payload: CreateSuspectPayload = {
      person: values.person,
      case: values.case,
      status: values.status,
    }
    if (values.crime_degree != null && !Number.isNaN(values.crime_degree)) {
      payload.crime_degree = values.crime_degree
    }
    createMutation.mutate(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Suspect</DialogTitle>
          <DialogDescription>
            Link a person to a case as a suspect. Create the person first if needed.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='person'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Person</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select person' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {persons?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.first_name} {p.last_name}
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
              name='case'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Case</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select case' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cases?.map((c) => (
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
              name='status'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select status' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='UNDER_PURSUIT'>Under Pursuit</SelectItem>
                      <SelectItem value='HOT_PURSUIT'>Hot Pursuit</SelectItem>
                      <SelectItem value='CAPTURED'>Captured</SelectItem>
                      <SelectItem value='RELEASED'>Released</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='crime_degree'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Crime Degree</FormLabel>
                  <FormControl>
                    <Input type='number' placeholder='Optional' {...field} />
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
                {createMutation.isPending ? 'Adding...' : 'Add Suspect'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
