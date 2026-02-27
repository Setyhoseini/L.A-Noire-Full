import { createFileRoute } from '@tanstack/react-router'
import { InterrogationsPage } from '@/features/interrogations'

export const Route = createFileRoute('/_authenticated/interrogations/')({
  component: InterrogationsPage,
})
