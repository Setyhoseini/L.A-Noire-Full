import { useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { toSvg } from 'html-to-image'
import { EvidenceNode } from './evidence-node'
import { NoteNode } from './note-node'
import { Button } from '@/components/ui/button'
import { Download, StickyNote } from 'lucide-react'

const nodeTypes = { evidence: EvidenceNode, note: NoteNode }

type CaseBoardFlowProps = {
  caseId: string
  initialNodes: Node[]
  initialEdges: Edge[]
  onSave: (caseId: string, nodes: Node[], edges: Edge[]) => void
  flowRef: React.RefObject<HTMLDivElement | null>
}

export function CaseBoardFlow({
  caseId,
  initialNodes,
  initialEdges,
  onSave,
  flowRef,
}: CaseBoardFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onAddNote = useCallback(() => {
    setNodes((nds) => {
      const noteIds = nds
        .filter((n) => n.id.startsWith('note-'))
        .map((n) => {
          const num = parseInt(n.id.replace('note-', ''), 10)
          return isNaN(num) ? 0 : num
        })
      const nextId = noteIds.length ? Math.max(...noteIds) + 1 : 1
      const id = `note-${nextId}`
      return [
        ...nds,
        {
          id,
          type: 'note',
          position: { x: 250 + (nds.length % 3) * 180, y: 100 + Math.floor(nds.length / 3) * 120 },
          data: { content: 'New note' },
          deletable: true,
        },
      ]
    })
  }, [setNodes])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const handleSave = useCallback(() => {
    onSave(caseId, nodes, edges)
  }, [caseId, nodes, edges, onSave])

  const handleExportSvg = useCallback(async () => {
    const pane =
      flowRef.current?.querySelector('.react-flow__renderer') ??
      flowRef.current?.querySelector('.react-flow__viewport') ??
      flowRef.current?.querySelector('.react-flow')
    if (!pane) return

    try {
      const dataUrl = await toSvg(pane as HTMLElement, {
        filter: (node) => {
          if (!(node instanceof HTMLElement)) return true
          if (node.classList.contains('react-flow__controls')) return false
          if (node.classList.contains('react-flow__minimap')) return false
          return true
        },
        backgroundColor: 'white',
      })
      const link = document.createElement('a')
      link.download = `board-export-${Date.now()}.svg`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Export failed:', err)
    }
  }, [flowRef])

  const handleExportPng = useCallback(async () => {
    const { toPng } = await import('html-to-image')
    const pane =
      flowRef.current?.querySelector('.react-flow__renderer') ??
      flowRef.current?.querySelector('.react-flow__viewport') ??
      flowRef.current?.querySelector('.react-flow')
    if (!pane) return

    try {
      const dataUrl = await toPng(pane as HTMLElement, {
        filter: (node) => {
          if (!(node instanceof HTMLElement)) return true
          if (node.classList.contains('react-flow__controls')) return false
          if (node.classList.contains('react-flow__minimap')) return false
          return true
        },
        backgroundColor: 'white',
      })
      const link = document.createElement('a')
      link.download = `board-export-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Export failed:', err)
    }
  }, [flowRef])

  return (
    <div className='flex h-full flex-col'>
      <div className='flex gap-2 border-b px-4 py-2'>
        <Button size='sm' variant='outline' onClick={onAddNote}>
          <StickyNote className='mr-2 h-4 w-4' />
          Add Note
        </Button>
        <Button size='sm' onClick={handleSave}>
          Save Board
        </Button>
        <Button size='sm' variant='outline' onClick={handleExportSvg}>
          <Download className='mr-2 h-4 w-4' />
          Export SVG
        </Button>
        <Button size='sm' variant='outline' onClick={handleExportPng}>
          <Download className='mr-2 h-4 w-4' />
          Export PNG
        </Button>
      </div>
      <div ref={flowRef} className='h-[calc(100%-52px)]'>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={(_ev, node) => {
            if (node.type === 'note') {
              const content = window.prompt('Edit note:', (node.data?.content as string) || '')
              if (content !== null) {
                setNodes((nds) =>
                  nds.map((n) =>
                    n.id === node.id ? { ...n, data: { ...n.data, content } } : n
                  )
                )
              }
            }
          }}
          nodeTypes={nodeTypes}
          fitView
          deleteKeyCode={['Backspace', 'Delete']}
          connectionLineStyle={{ stroke: 'red' }}
          defaultEdgeOptions={{ style: { stroke: 'red' } }}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  )
}
