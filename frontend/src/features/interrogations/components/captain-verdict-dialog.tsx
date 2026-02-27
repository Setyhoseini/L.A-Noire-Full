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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Interrogation } from '@/api/interrogations'

const formSchema = z.object({
  verdict: z.enum(['guilty', 'suspected', 'cleared']),
})

type FormValues = z.infer<typeof formSchema>

type CaptainVerdictDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  interrogation: Interrogation | null
  onSubmit: (verdict: 'guilty' | 'suspected' | 'cleared') => void
  isLoading?: boolean
}

export function CaptainVerdictDialog({
  open,
  onOpenChange,
  interrogation,
  onSubmit,
  isLoading,
}: CaptainVerdictDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { verdict: 'suspected' },
  })

  const handleSubmit = (values: FormValues) => {
    onSubmit(values.verdict)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Captain Verdict</DialogTitle>
          <DialogDescription>
            Rate how guilty the suspect is: {interrogation?.suspect_name} – Case{' '}
            {interrogation?.case_number}. For critical cases, Chief approval will be required
            after this verdict.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="verdict"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guilt rating</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select verdict" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="guilty">Guilty (most culpable)</SelectItem>
                      <SelectItem value="suspected">Suspected (some evidence)</SelectItem>
                      <SelectItem value="cleared">Cleared (not guilty)</SelectItem>
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
              <Button type="submit" disabled={isLoading}>
                Submit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
