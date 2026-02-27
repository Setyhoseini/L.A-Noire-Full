import { createFileRoute } from '@tanstack/react-router'
import { TipsPage } from '@/features/tips'

export const Route = createFileRoute('/_authenticated/tips/')({
  component: TipsPage,
})
