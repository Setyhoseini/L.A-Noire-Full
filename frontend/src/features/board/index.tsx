import { useQuery } from '@tanstack/react-query'
import { PageLayout } from '@/components/layout/page-layout'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getBoardOverview } from '@/api/board'
import { Link2 } from 'lucide-react'

export function BoardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['board'],
    queryFn: getBoardOverview,
  })

  return (
    <PageLayout
      title='Detective Board'
      description='Link evidence and documents to solve cases.'
    >
      {isLoading ? (
        <Skeleton className='h-[300px] w-full' />
      ) : error ? (
        <p className='text-sm text-destructive'>Failed to load board data.</p>
      ) : (
        <div className='grid gap-6 md:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>Open Cases</CardTitle>
              <CardDescription>
                Cases under investigation. Link evidence to build your case.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!data?.cases?.length ? (
                <p className='text-sm text-muted-foreground'>No open cases.</p>
              ) : (
                <ul className='space-y-2'>
                  {data.cases.map((c) => (
                    <li
                      key={c.id}
                      className='flex items-center justify-between rounded-md border p-3'
                    >
                      <div>
                        <span className='font-mono text-sm'>{c.case_number}</span>
                        <p className='text-sm font-medium'>{c.title}</p>
                      </div>
                      <Badge variant='secondary'>{c.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Evidence</CardTitle>
              <CardDescription>
                Evidence items. Associate with cases via the Evidence page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!data?.evidence?.length ? (
                <p className='text-sm text-muted-foreground'>No evidence logged.</p>
              ) : (
                <ul className='space-y-2'>
                  {data.evidence.map((e) => (
                    <li
                      key={e.id}
                      className='flex items-center justify-between rounded-md border p-3'
                    >
                      <div>
                        <p className='text-sm font-medium'>{e.title}</p>
                        <span className='text-xs text-muted-foreground'>
                          {e.evidence_type}
                          {e.case_id ? ' · Linked' : ' · Unlinked'}
                        </span>
                      </div>
                      {!e.case_id && (
                        <Link2 className='h-4 w-4 text-muted-foreground' />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PageLayout>
  )
}
