import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { PageLayout } from '@/components/layout/page-layout'
import { Button } from '@/components/ui/button'
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
import { getEvidence } from '@/api/evidence'
import { EvidenceCreateDialog } from './components/evidence-create-dialog'
import { format } from 'date-fns'

export function EvidencePage() {
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: evidence, isLoading, error } = useQuery({
    queryKey: ['evidence'],
    queryFn: getEvidence,
  })

  return (
    <PageLayout
      title='Evidence'
      description='Register and review evidence for cases.'
    >
      <div className='space-y-4'>
        <div className='flex justify-end'>
          <Button size='sm' onClick={() => setDialogOpen(true)}>
            <Plus className='mr-2 h-4 w-4' />
            Register Evidence
          </Button>
        </div>

        {isLoading ? (
          <Skeleton className='h-[200px] w-full' />
        ) : error ? (
          <p className='text-sm text-destructive'>Failed to load evidence.</p>
        ) : !evidence?.length ? (
          <p className='text-sm text-muted-foreground'>No evidence yet. Register some to get started.</p>
        ) : (
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Storage</TableHead>
                  <TableHead>Collected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evidence.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.title}</TableCell>
                    <TableCell>{e.evidence_type}</TableCell>
                    <TableCell>
                      <Badge variant='secondary'>{e.status}</Badge>
                    </TableCell>
                    <TableCell>{e.storage_location || '—'}</TableCell>
                    <TableCell className='text-muted-foreground'>
                      {e.collected_at ? format(new Date(e.collected_at), 'MMM d, yyyy') : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <EvidenceCreateDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </PageLayout>
  )
}
