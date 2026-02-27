import { ExternalLink, Shield, Users, Settings } from 'lucide-react'
import { PageLayout } from '@/components/layout/page-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RolesManagement } from './roles-management'
import { UsersManagement } from './users-management'

const backendBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api').replace(
  /\/api\/?$/,
  ''
) || 'http://localhost:8000'

const adminUrl = `${backendBase}/admin/`

export function AdminPage() {
  return (
    <PageLayout
      title='Admin Panel'
      description='System administration. Manage users, roles, and permissions.'
    >
      <div className='space-y-6'>
        <Tabs defaultValue='roles' className='w-full'>
          <TabsList className='grid w-full max-w-md grid-cols-2'>
            <TabsTrigger value='roles' className='flex items-center gap-2'>
              <Shield className='h-4 w-4' />
              رول‌ها و پرمیشن‌ها
            </TabsTrigger>
            <TabsTrigger value='users' className='flex items-center gap-2'>
              <Users className='h-4 w-4' />
              کاربران
            </TabsTrigger>
          </TabsList>
          <TabsContent value='roles' className='mt-6'>
            <RolesManagement />
          </TabsContent>
          <TabsContent value='users' className='mt-6'>
            <UsersManagement />
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Settings className='h-5 w-5' />
              Django Admin
            </CardTitle>
            <CardDescription>
              دسترسی کامل به بک‌اند. مدیریت کاربران، رول‌ها، پرونده‌ها و تمام داده‌ها.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant='outline'>
              <a href={adminUrl} target='_blank' rel='noopener noreferrer'>
                <ExternalLink className='mr-2 h-4 w-4' />
                باز کردن Django Admin
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
