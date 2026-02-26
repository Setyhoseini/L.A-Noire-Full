import { useQuery } from '@tanstack/react-query'
import { PageLayout } from '@/components/layout/page-layout'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getMostWanted } from '@/api/most-wanted'
import { format } from 'date-fns'
import { AlertTriangle } from 'lucide-react'

export function MostWantedPage() {
  const { data: items, isLoading, error } = useQuery({
    queryKey: ['most-wanted'],
    queryFn: getMostWanted,
  })

  return (
    <PageLayout
      title='Under Surveillance'
      description='Suspects under pursuit or hot pursuit. Track days at large, crime degree, and reward.'
    >
      {isLoading ? (
        <Skeleton className='h-[200px] w-full' />
      ) : error ? (
        <p className='text-sm text-destructive'>Failed to load suspects.</p>
      ) : !items?.length ? (
        <div className='flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center'>
          <AlertTriangle className='h-12 w-12 text-muted-foreground' />
          <p className='mt-4 text-sm font-medium'>No suspects under surveillance</p>
          <p className='mt-1 text-sm text-muted-foreground'>
            Suspects with status Under Pursuit or Hot Pursuit will appear here.
          </p>
        </div>
      ) : (
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Case</TableHead>
                <TableHead>Days at Large</TableHead>
                <TableHead>Crime Degree</TableHead>
                <TableHead>Rank</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead>Start Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className='font-medium'>{item.person_name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={item.status === 'HOT_PURSUIT' ? 'destructive' : 'secondary'}
                    >
                      {item.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className='font-mono text-sm'>
                    {item.case_number || '—'}
                  </TableCell>
                  <TableCell>{item.days_under_pursuit}</TableCell>
                  <TableCell>{item.crime_degree ?? '—'}</TableCell>
                  <TableCell>{item.rank.toLocaleString()}</TableCell>
                  <TableCell>${item.reward.toLocaleString()}</TableCell>
                  <TableCell className='text-muted-foreground'>
                    {item.start_date
                      ? format(new Date(item.start_date), 'MMM d, yyyy')
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageLayout>
  )
}
