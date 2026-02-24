import { PageLayout } from '@/components/layout/page-layout'

export function EvidencePage() {
  return (
    <PageLayout
      title='Evidence'
      description='Register and review evidence for cases.'
    >
      <p className='text-sm text-muted-foreground'>
        Evidence registration (witness, biological, vehicle, ID documents) will be implemented here.
      </p>
    </PageLayout>
  )
}
