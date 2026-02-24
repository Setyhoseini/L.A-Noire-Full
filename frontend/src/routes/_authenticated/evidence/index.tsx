import { createFileRoute } from '@tanstack/react-router'
import { EvidencePage } from '@/features/evidence'

export const Route = createFileRoute('/_authenticated/evidence/')({
  component: EvidencePage,
})
