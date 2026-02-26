import { useQuery } from '@tanstack/react-query'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import { getCase, type Case } from '@/api/cases'
import { format } from 'date-fns'

const STATUS_COLORS: Record<string, string> = {
  new: 'secondary',
  open: 'default',
  investigation: 'default',
  closed: 'outline',
  cold: 'secondary',
  archived: 'secondary',
}

type CaseDetailSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  caseId: string | null
  onEdit: (c: Case) => void
}

export function CaseDetailSheet({
  open,
  onOpenChange,
  caseId,
  onEdit,
}: CaseDetailSheetProps) {
  const { data: caseData, isLoading, error } = useQuery({
    queryKey: ['case', caseId],
    queryFn: () => getCase(caseId!),
    enabled: !!caseId && open,
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>Case Details</SheetTitle>
          <SheetDescription>View case information</SheetDescription>
        </SheetHeader>
        <div className='space-y-6 py-4'>
          {isLoading ? (
            <Skeleton className='h-[200px] w-full' />
          ) : error ? (
            <p className='text-sm text-destructive'>Failed to load case.</p>
          ) : caseData ? (
            <>
              <div className='flex items-start justify-between gap-2'>
                <div>
                  <p className='font-mono text-sm text-muted-foreground'>{caseData.case_number}</p>
                  <h3 className='text-lg font-semibold'>{caseData.title}</h3>
                </div>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => {
                    onEdit(caseData)
                    onOpenChange(false)
                  }}
                >
                  <Pencil className='h-4 w-4' />
                </Button>
              </div>
              <div className='grid gap-4'>
                <div>
                  <p className='text-xs font-medium text-muted-foreground uppercase'>Status</p>
                  <Badge
                    variant={
                      (STATUS_COLORS[caseData.status] as 'default' | 'secondary' | 'outline') ??
                      'secondary'
                    }
                  >
                    {caseData.status}
                  </Badge>
                </div>
                <div>
                  <p className='text-xs font-medium text-muted-foreground uppercase'>Priority</p>
                  <p className='text-sm'>{caseData.priority}</p>
                </div>
                <div>
                  <p className='text-xs font-medium text-muted-foreground uppercase'>Precinct</p>
                  <p className='text-sm'>{caseData.precinct || '—'}</p>
                </div>
                <div>
                  <p className='text-xs font-medium text-muted-foreground uppercase'>Description</p>
                  <p className='text-sm text-muted-foreground'>
                    {caseData.description || 'No description'}
                  </p>
                </div>
                <div>
                  <p className='text-xs font-medium text-muted-foreground uppercase'>Opened</p>
                  <p className='text-sm'>
                    {format(new Date(caseData.opened_at), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
                {caseData.closed_at && (
                  <div>
                    <p className='text-xs font-medium text-muted-foreground uppercase'>Closed</p>
                    <p className='text-sm'>
                      {format(new Date(caseData.closed_at), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                )}
                <div>
                  <p className='text-xs font-medium text-muted-foreground uppercase'>Archived</p>
                  <p className='text-sm'>{caseData.is_archived ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
