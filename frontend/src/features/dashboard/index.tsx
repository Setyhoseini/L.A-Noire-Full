import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'

/**
 * Home page per PDF: intro + 3 stats.
 * Stats: solved cases, employees, active cases.
 */
export function Dashboard() {
  return (
    <>
      <Header />
      <Main>
        <div className='space-y-6'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              L.A. Noire Police System
            </h1>
            <p className='mt-2 text-muted-foreground'>
              Police management system for case tracking, evidence, and investigations.
              Manage complaints, form cases, register evidence, and follow cases through
              to trial.
            </p>
          </div>

          <div className='grid gap-4 sm:grid-cols-3'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Solved Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>—</div>
                <CardDescription>Total resolved cases</CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Employees
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>—</div>
                <CardDescription>Total organization staff</CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Active Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>—</div>
                <CardDescription>Cases under investigation</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </Main>
    </>
  )
}
