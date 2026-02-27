import { memo } from 'react'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import { StickyNote } from 'lucide-react'
import { cn } from '@/lib/utils'

export const NoteNode = memo(function NoteNode({ data }: NodeProps) {
  const content = (data.content as string) || 'Note'

  return (
    <div
      className={cn(
        'min-w-[140px] max-w-[220px] rounded-lg border-2 border-amber-500/40 bg-amber-50 px-4 py-3 shadow-md dark:bg-amber-950/30 dark:border-amber-500/30',
        'hover:border-amber-500/60'
      )}
    >
      <Handle type='target' position={Position.Top} className='!h-2 !w-2' />
      <div className='flex items-start gap-2'>
        <StickyNote className='mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400' />
        <p className='min-h-[1.5rem] flex-1 whitespace-pre-wrap break-words text-sm text-foreground'>
          {content}
        </p>
      </div>
      <Handle type='source' position={Position.Bottom} className='!h-2 !w-2' />
    </div>
  )
})
