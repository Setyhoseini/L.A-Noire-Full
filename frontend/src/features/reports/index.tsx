import { PageLayout } from '@/components/layout/page-layout'

export function ReportsPage() {
  return (
    <PageLayout
      title='General Report'
      description='Full case reports for Judge, Captain, and Chief.'
    >
      <p className='text-sm text-muted-foreground'>
        Case reports with evidence, witnesses, and verdicts will be implemented here.
      </p>
    </PageLayout>
  )
}
