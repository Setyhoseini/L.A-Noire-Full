import { useQuery } from '@tanstack/react-query'
import { ErrorWithRetry } from '@/components/error-with-retry'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { getMostWanted } from '@/api/most-wanted'
import { format } from 'date-fns'
import { AlertTriangle } from 'lucide-react'

function formatRewardRial(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(0)}M ریال`
  }
  return `${amount.toLocaleString()} ریال`
}

export function MostWantedPage() {
  const {
    data: items,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['most-wanted'],
    queryFn: getMostWanted,
  })

  return (
    <PageLayout
      title='Most Wanted'
      description='Suspects under pursuit or hot pursuit. Visible to all users. Reward in Rial.'
    >
      {isLoading ? (
        <Skeleton className='h-[200px] w-full' />
      ) : error ? (
        <ErrorWithRetry
          message='Failed to load suspects.'
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
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
                <TableHead>Photo</TableHead>
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
                  <TableCell>
                    <Avatar className='h-10 w-10'>
                      <AvatarImage src={item.photo_url ?? undefined} alt={item.person_name} />
                      <AvatarFallback>
                        {item.person_name?.substring(0, 2).toUpperCase() ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
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
                  <TableCell>{formatRewardRial(item.reward)}</TableCell>
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
