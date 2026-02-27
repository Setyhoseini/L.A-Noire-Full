import { useCallback, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageLayout } from '@/components/layout/page-layout'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getBoardOverview,
  getCaseBoard,
  saveCaseBoard,
  type BoardEvidence,
  type BoardNode,
  type BoardEdge,
} from '@/api/board'
import { CaseBoardFlow } from './components/case-board-flow'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
import type { Node, Edge } from '@xyflow/react'

function evidenceToNode(e: BoardEvidence, index: number): Node {
  return {
    id: `evidence-${e.id}`,
    type: 'evidence',
    position: { x: 50 + (index % 4) * 200, y: 50 + Math.floor(index / 4) * 120 },
    data: { label: e.title, evidenceType: e.evidence_type },
    deletable: false,
  }
}

function toFlowNode(n: BoardNode): Node {
  const nodeType = n.type || (n.id.startsWith('note-') ? 'note' : 'evidence')
  return {
    id: n.id,
    type: nodeType as 'evidence' | 'note',
    position: n.position,
    data: n.data || {},
    deletable: nodeType === 'note',
  }
}

function toFlowEdge(e: BoardEdge): Edge {
  return { id: e.id, source: e.source, target: e.target, style: { stroke: 'red' } }
}

function toBoardNode(n: Node): BoardNode {
  return {
    id: n.id,
    type: n.type || 'default',
    position: n.position,
    data: n.data || {},
  }
}

function toBoardEdge(e: Edge): BoardEdge {
  return { id: e.id, source: e.source, target: e.target }
}

export function BoardPage() {
  const queryClient = useQueryClient()
  const flowRef = useRef<HTMLDivElement>(null)
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['board'],
    queryFn: getBoardOverview,
  })

  const { data: caseData, isLoading: caseLoading } = useQuery({
    queryKey: ['board', 'case', selectedCaseId],
    queryFn: () => getCaseBoard(selectedCaseId!),
    enabled: !!selectedCaseId,
  })

  const saveMutation = useMutation({
    mutationFn: ({ caseId, nodes, edges }: { caseId: string; nodes: Node[]; edges: Edge[] }) =>
      saveCaseBoard(caseId, nodes.map(toBoardNode), edges.map(toBoardEdge)),
    onSuccess: (_, { caseId }) => {
      toast.success('Board saved')
      queryClient.invalidateQueries({ queryKey: ['board', 'case', caseId] })
    },
    onError: (err) => handleServerError(err),
  })

  const initialNodes = useCallback((): Node[] => {
    if (!caseData) return []
    const savedEvidenceNodes = caseData.nodes.filter((n) => n.id.startsWith('evidence-'))
    const savedNoteNodes = caseData.nodes.filter((n) => n.id.startsWith('note-'))

    const evidenceNodes: Node[] = caseData.evidence.map((e, i) => {
      const saved = savedEvidenceNodes.find((n) => n.id === `evidence-${e.id}`)
      if (saved) return toFlowNode(saved)
      return evidenceToNode(e, i)
    })

    const noteNodes: Node[] = savedNoteNodes.map(toFlowNode)
    return [...evidenceNodes, ...noteNodes]
  }, [caseData])

  const initialEdges = useCallback((): Edge[] => {
    if (!caseData) return []
    return caseData.edges.map(toFlowEdge)
  }, [caseData])

  const handleSave = useCallback(
    (caseId: string, nodes: Node[], edges: Edge[], options?: { silent?: boolean }) => {
      saveMutation.mutate({ caseId, nodes, edges, silent: options?.silent })
    },
    [saveMutation]
  )

  return (
    <PageLayout
      title='Detective Board'
      description='Select a case to view and link evidence. Add notes and connect items.'
    >
      <div className='flex h-[calc(100vh-12rem)] flex-col gap-4'>
        <div className='flex items-center gap-4'>
          <label className='text-sm font-medium'>Case</label>
          <Select
            value={selectedCaseId ?? ''}
            onValueChange={(v) => setSelectedCaseId(v || null)}
          >
            <SelectTrigger className='w-[280px]'>
              <SelectValue placeholder='Select a case...' />
            </SelectTrigger>
            <SelectContent>
              {overview?.cases?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.case_number} – {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {overviewLoading ? (
          <Skeleton className='h-full min-h-[400px] w-full' />
        ) : !selectedCaseId ? (
          <div className='flex flex-1 items-center justify-center rounded-lg border border-dashed bg-muted/30'>
            <p className='text-muted-foreground'>Select a case to view its board.</p>
          </div>
        ) : caseLoading ? (
          <Skeleton className='h-full min-h-[400px] w-full' />
        ) : caseData ? (
          <div className='flex-1 overflow-hidden rounded-lg border'>
            <CaseBoardFlow
              key={selectedCaseId}
              caseId={selectedCaseId}
              initialNodes={initialNodes()}
              initialEdges={initialEdges()}
              onSave={handleSave}
              flowRef={flowRef}
            />
          </div>
        ) : (
          <div className='flex flex-1 items-center justify-center rounded-lg border border-dashed bg-muted/30'>
            <p className='text-muted-foreground'>Failed to load board.</p>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
