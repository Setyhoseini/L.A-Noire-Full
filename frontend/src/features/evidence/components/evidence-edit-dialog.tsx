import { useEffect } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateEvidence, type Evidence } from '@/api/evidence'
import { getCases } from '@/api/cases'
import { handleServerError } from '@/lib/handle-server-error'

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  evidence_type: z.string(),
  collected_at: z.string().optional(),
  storage_location: z.string().optional(),
  status: z.string(),
  case: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

type EvidenceEditDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  evidence: Evidence | null
}

export function EvidenceEditDialog({ open, onOpenChange, evidence }: EvidenceEditDialogProps) {
  const queryClient = useQueryClient()
  const { data: cases } = useQuery({
    queryKey: ['cases'],
    queryFn: getCases,
    enabled: open,
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      evidence_type: 'other',
      collected_at: '',
      storage_location: '',
      status: 'logged',
      case: '',
    },
  })

  useEffect(() => {
    if (evidence) {
      const collectedAt = evidence.collected_at
        ? new Date(evidence.collected_at).toISOString().slice(0, 16)
        : ''
      form.reset({
        title: evidence.title,
        description: evidence.description ?? '',
        evidence_type: evidence.evidence_type,
        collected_at: collectedAt,
        storage_location: evidence.storage_location ?? '',
        status: evidence.status,
        case: evidence.case ?? '',
      })
    }
  }, [evidence, form])

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: FormValues }) =>
      updateEvidence(id, {
        title: payload.title,
        description: payload.description,
        evidence_type: payload.evidence_type,
        collected_at: payload.collected_at || undefined,
        storage_location: payload.storage_location,
        status: payload.status,
        case: payload.case || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence'] })
      onOpenChange(false)
    },
    onError: (err) => {
      handleServerError(err)
    },
  })

  const onSubmit = (values: FormValues) => {
    if (evidence) updateMutation.mutate({ id: evidence.id, payload: values })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Evidence</DialogTitle>
          <DialogDescription>Update evidence details and link to a case.</DialogDescription>
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
                  <Select
                    onValueChange={(v) => field.onChange(v === '__none__' ? undefined : v)}
                    value={field.value || '__none__'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select case (optional)' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='__none__'>None</SelectItem>
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
              name='evidence_type'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
              <Button type='submit' disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
