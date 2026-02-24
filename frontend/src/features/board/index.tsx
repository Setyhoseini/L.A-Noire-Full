import { PageLayout } from '@/components/layout/page-layout'

export function BoardPage() {
  return (
    <PageLayout
      title='Detective Board'
      description='Link evidence and documents to solve cases.'
    >
      <p className='text-sm text-muted-foreground'>
        Drag-and-drop board with evidence cards and connections will be implemented here.
      </p>
    </PageLayout>
  )
}
