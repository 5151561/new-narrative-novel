import type { ReactNode } from 'react'

import { EmptyState } from '@/components/ui/EmptyState'
import { Pane } from '@/components/ui/Pane'
import { PaneHeader } from '@/components/ui/PaneHeader'

interface WorkbenchShellProps {
  topBar: ReactNode
  modeRail: ReactNode
  navigator: ReactNode
  mainStage: ReactNode
  inspector?: ReactNode
  bottomDock?: ReactNode
}

export function WorkbenchShell({
  topBar,
  modeRail,
  navigator,
  mainStage,
  inspector,
  bottomDock,
}: WorkbenchShellProps) {
  return (
    <div className="grid min-h-screen grid-rows-[auto_minmax(0,1fr)_220px] bg-app p-4 text-text-main">
      <Pane className="mb-4 overflow-visible">{topBar}</Pane>
      <div className="grid min-h-0 grid-cols-[72px_280px_minmax(0,1fr)_320px] gap-4">
        <Pane className="min-h-0">{modeRail}</Pane>
        <Pane className="min-h-0">{navigator}</Pane>
        <Pane className="min-h-0">{mainStage}</Pane>
        <Pane className="min-h-0">
          {inspector ?? (
            <>
              <PaneHeader title="Inspector" description="Batch 2 will hydrate Context, Versions, and Runtime." />
              <div className="p-4">
                <EmptyState
                  title="Inspector holds its place"
                  message="This column is present now so Scene execution lands inside the final workbench layout instead of a standalone page."
                />
              </div>
            </>
          )}
        </Pane>
      </div>
      <Pane className="mt-4 min-h-0">
        {bottomDock ?? (
          <>
            <PaneHeader title="Bottom Dock" description="Events, trace, consistency, problems, and cost move here in batch 2." />
            <div className="p-4">
              <EmptyState
                title="Diagnostic dock reserved"
                message="Execution stays focused on goals, beats, proposals, and accepted state. Runtime noise lands here later."
              />
            </div>
          </>
        )}
      </Pane>
    </div>
  )
}
