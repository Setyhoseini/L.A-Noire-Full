import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
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
import { createEvidence, type CreateEvidencePayload } from '@/api/evidence'
import { getCases } from '@/api/cases'
import { handleServerError } from '@/lib/handle-server-error'

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  evidence_type: z.string().default('other'),
  collected_at: z.string().optional(),
  storage_location: z.string().optional(),
  status: z.string().default('logged'),
  case: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

type EvidenceCreateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EvidenceCreateDialog({ open, onOpenChange }: EvidenceCreateDialogProps) {
  const queryClient = useQueryClient()
  const { data: casesData } = useQuery({
    queryKey: ['cases'],
    queryFn: getCases,
    enabled: open,
  })
  // Ensure cases is always an array (backend may return paginated or unexpected format)
  const cases = Array.isArray(casesData) ? casesData : []
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      evidence_type: 'other',
      collected_at: '',
      storage_location: '',
      status: 'logged',
      case: '__none__',
    },
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateEvidencePayload) => createEvidence(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence'] })
      toast.success('Evidence registered successfully')
      form.reset()
      onOpenChange(false)
    },
    onError: (err) => {
      handleServerError(err)
    },
  })

  const onSubmit = (values: FormValues) => {
    const payload: CreateEvidencePayload = {
      title: values.title,
      description: values.description || undefined,
      evidence_type: values.evidence_type,
      storage_location: values.storage_location || undefined,
      status: values.status,
    }
    if (values.collected_at) payload.collected_at = values.collected_at
    if (values.case && values.case !== '__none__') payload.case = values.case
    createMutation.mutate(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register Evidence</DialogTitle>
          <DialogDescription>
            Log new evidence. Link to a case or report later if needed.
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
                    <Input placeholder='Evidence title' {...field} />
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
                    <Textarea placeholder='Description' className='min-h-[60px]' {...field} />
                  </FormControl>
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
                  <Select onValueChange={field.onChange} value={field.value || '__none__'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select case (optional)' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='__none__'>None</SelectItem>
                      {cases.map((c) => (
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
              name='evidence_type'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select type' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='physical'>Physical</SelectItem>
                      <SelectItem value='digital'>Digital</SelectItem>
                      <SelectItem value='document'>Document</SelectItem>
                      <SelectItem value='photo'>Photo</SelectItem>
                      <SelectItem value='video'>Video</SelectItem>
                      <SelectItem value='audio'>Audio</SelectItem>
                      <SelectItem value='other'>Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='collected_at'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collected At</FormLabel>
                  <FormControl>
                    <Input type='datetime-local' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='storage_location'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storage Location</FormLabel>
                  <FormControl>
                    <Input placeholder='Where is it stored?' {...field} />
                  </FormControl>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select status' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='logged'>Logged</SelectItem>
                      <SelectItem value='submitted'>Submitted</SelectItem>
                      <SelectItem value='returned'>Returned</SelectItem>
                      <SelectItem value='released'>Released</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit' disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Registering...' : 'Register'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
