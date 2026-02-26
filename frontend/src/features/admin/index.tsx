import { ExternalLink, Shield, Users, Settings } from 'lucide-react'
import { PageLayout } from '@/components/layout/page-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const backendBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api').replace(
  /\/api\/?$/,
  ''
) || 'http://localhost:8000'

const adminUrl = `${backendBase}/admin/`

export function AdminPage() {
  return (
    <PageLayout
      title='Admin Panel'
      description='System administration. Manage users, roles, and configuration.'
    >
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Shield className='h-5 w-5' />
              Django Admin
            </CardTitle>
            <CardDescription>
              Full administrative access to the backend. Manage users, roles, cases, evidence, and all data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href={adminUrl} target='_blank' rel='noopener noreferrer'>
                <ExternalLink className='mr-2 h-4 w-4' />
                Open Django Admin
              </a>
            </Button>
          </CardContent>
        </Card>

        <div className='grid gap-4 sm:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Users className='h-5 w-5' />
                User Management
              </CardTitle>
              <CardDescription>
                Assign roles and manage user accounts via Django Admin.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Settings className='h-5 w-5' />
                API Documentation
              </CardTitle>
              <CardDescription>
                Swagger and ReDoc docs for the REST API.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex gap-2'>
                <Button variant='outline' size='sm' asChild>
                  <a href={`${backendBase}/api/docs/`} target='_blank' rel='noopener noreferrer'>
                    Swagger
                  </a>
                </Button>
                <Button variant='outline' size='sm' asChild>
                  <a href={`${backendBase}/api/redoc/`} target='_blank' rel='noopener noreferrer'>
                    ReDoc
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
