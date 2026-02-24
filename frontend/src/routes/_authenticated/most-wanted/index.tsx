import { createFileRoute } from '@tanstack/react-router'
import { MostWantedPage } from '@/features/most-wanted'

export const Route = createFileRoute('/_authenticated/most-wanted/')({
  component: MostWantedPage,
})
