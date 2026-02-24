import { PageLayout } from '@/components/layout/page-layout'

export function MostWantedPage() {
  return (
    <PageLayout
      title='Under Surveillance'
      description='Suspects and criminals under intensive surveillance.'
    >
      <p className='text-sm text-muted-foreground'>
        Most wanted list with photos and details will be implemented here.
      </p>
    </PageLayout>
  )
}
