import { createFileRoute } from '@tanstack/react-router'
import { SubmitComplaintPage } from '@/features/submit-complaint'

export const Route = createFileRoute('/_authenticated/submit-complaint')({
  component: SubmitComplaintPage,
})
