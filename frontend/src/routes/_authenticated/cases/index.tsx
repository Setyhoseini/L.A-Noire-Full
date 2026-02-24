import { createFileRoute } from '@tanstack/react-router'
import { CasesPage } from '@/features/cases'

export const Route = createFileRoute('/_authenticated/cases/')({
  component: CasesPage,
})
