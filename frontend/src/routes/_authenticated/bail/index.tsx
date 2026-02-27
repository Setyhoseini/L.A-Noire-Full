import { createFileRoute } from '@tanstack/react-router'
import { BailPage } from '@/features/bail'

export const Route = createFileRoute('/_authenticated/bail/')({
  component: BailPage,
})
