import { PageLayout } from '@/components/layout/page-layout'

export function AdminPage() {
  return (
    <PageLayout
      title='Admin Panel'
      description='Manage roles and users. Administrator only.'
    >
      <p className='text-sm text-muted-foreground'>
        Role CRUD and user role assignment will be implemented here.
      </p>
    </PageLayout>
  )
}
