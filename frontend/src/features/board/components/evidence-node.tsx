import { memo } from 'react'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import { FileSearch } from 'lucide-react'
import { cn } from '@/lib/utils'

export const EvidenceNode = memo(function EvidenceNode({ data }: NodeProps) {
  const title = (data.label as string) || 'Evidence'
  const evidenceType = (data.evidenceType as string) || 'other'

  return (
    <div
      className={cn(
        'min-w-[160px] rounded-lg border-2 border-primary/30 bg-card px-4 py-3 shadow-md',
        'hover:border-primary/50'
      )}
    >
      <Handle type='target' position={Position.Top} className='!h-2 !w-2' />
      <div className='flex items-start gap-2'>
        <FileSearch className='mt-0.5 h-4 w-4 shrink-0 text-muted-foreground' />
        <div className='min-w-0 flex-1'>
          <p className='truncate font-medium text-sm'>{title}</p>
          <p className='text-xs text-muted-foreground capitalize'>{evidenceType}</p>
        </div>
      </div>
      <Handle type='source' position={Position.Bottom} className='!h-2 !w-2' />
    </div>
  )
})
