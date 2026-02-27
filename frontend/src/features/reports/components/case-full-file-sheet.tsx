import { useQuery } from '@tanstack/react-query'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getCaseFullFile } from '@/api/cases'
import { ErrorWithRetry } from '@/components/error-with-retry'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'

type CaseFullFileSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  caseId: string | null
  onCreateTrial?: (caseId: string) => void
}

export function CaseFullFileSheet({
  open,
  onOpenChange,
  caseId,
  onCreateTrial,
}: CaseFullFileSheetProps) {
  const {
    data: file,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['case-full-file', caseId],
    queryFn: () => getCaseFullFile(caseId!),
    enabled: open && !!caseId,
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Full Case File</SheetTitle>
          <SheetDescription>
            Complete case file for Judge: reports, evidence, interrogations, officers, suspects.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {isLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : error ? (
            <ErrorWithRetry
              message="Failed to load case file."
              onRetry={() => refetch()}
              isRetrying={isFetching}
            />
          ) : file ? (
            <>
              <div>
                <h3 className="mb-2 font-semibold">Case</h3>
                <p className="text-sm text-muted-foreground">
                  {file.case.case_number} – {file.case.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Opened: {format(new Date(file.case.opened_at), 'MMM d, yyyy')}
                </p>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Crime Reports</h3>
                {file.crime_reports.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No reports</p>
                ) : (
                  <ul className="space-y-2">
                    {file.crime_reports.map((r) => (
                      <li key={r.id} className="rounded border p-2 text-sm">
                        <span className="font-medium">{r.title}</span>
                        <Badge variant="secondary" className="ml-2">
                          {r.status}
                        </Badge>
                        {r.location && (
                          <p className="mt-1 text-muted-foreground">Location: {r.location}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Evidence</h3>
                {file.evidence.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No evidence</p>
                ) : (
                  <ul className="space-y-1">
                    {file.evidence.map((e) => (
                      <li key={e.id} className="text-sm">
                        {e.title} ({e.evidence_type}) – {e.status}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Interrogations</h3>
                {file.interrogations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No interrogations</p>
                ) : (
                  <ul className="space-y-2">
                    {file.interrogations.map((i) => (
                      <li key={i.id} className="rounded border p-2 text-sm">
                        <span className="font-medium">{i.suspect_name ?? 'Unknown'}</span>
                        <span className="ml-2 text-muted-foreground">
                          Sgt: {i.guilt_score_sergeant ?? '—'} / Det: {i.guilt_score_detective ?? '—'}
                        </span>
                        <Badge variant="secondary" className="ml-2">
                          {i.captain_verdict}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Officers Involved</h3>
                {file.officers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {file.officers.map((o) => (
                      <li key={o.id}>
                        {o.first_name} {o.last_name} ({o.username})
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Suspects</h3>
                {file.suspects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No suspects</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {file.suspects.map((s) => (
                      <li key={s.id}>
                        {s.person_name} – {s.status}
                        {s.crime_degree != null && ` (degree: ${s.crime_degree})`}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {onCreateTrial && caseId && (
                <Button
                  className="w-full"
                  onClick={() => {
                    onCreateTrial(caseId)
                    onOpenChange(false)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Trial
                </Button>
              )}
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
