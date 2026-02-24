import { createFileRoute } from '@tanstack/react-router'
import { AdminPage } from '@/features/admin'

export const Route = createFileRoute('/_authenticated/admin/')({
  component: AdminPage,
})
