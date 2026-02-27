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
  guilt_score: z.number().min(1).max(10),
})

type FormValues = z.infer<typeof formSchema>

type GuiltScoreDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  interrogation: Interrogation | null
  userRole: 'sergeant' | 'detective'
  onSubmit: (score: number) => void
  isLoading?: boolean
}

export function GuiltScoreDialog({
  open,
  onOpenChange,
  interrogation,
  userRole,
  onSubmit,
  isLoading,
}: GuiltScoreDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { guilt_score: 5 },
  })

  const handleSubmit = (values: FormValues) => {
    onSubmit(values.guilt_score)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Guilt Score</DialogTitle>
          <DialogDescription>
            {interrogation?.suspect_name} - Case {interrogation?.case_number}. Assign a guilt
            probability from 1 (least likely) to 10 (most likely).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="guilt_score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guilt Score (1-10)</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(parseInt(v, 10))}
                    value={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select score" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
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
