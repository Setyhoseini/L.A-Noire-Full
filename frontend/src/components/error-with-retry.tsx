import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'

type ErrorWithRetryProps = {
  message?: string
  onRetry: () => void
  isRetrying?: boolean
}

export function ErrorWithRetry({
  message = 'Failed to load.',
  onRetry,
  isRetrying = false,
}: ErrorWithRetryProps) {
  return (
    <div className='flex flex-col items-center gap-3 rounded-lg border border-dashed p-6'>
      <p className='text-sm text-destructive'>{message}</p>
      <Button size='sm' variant='outline' onClick={onRetry} disabled={isRetrying}>
        <RotateCcw className='mr-2 h-4 w-4' />
        {isRetrying ? 'Retrying...' : 'Retry'}
      </Button>
    </div>
  )
}
