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
    <div className="grid min-h-screen grid-rows-[72px_minmax(0,1fr)_196px] bg-app text-text-main">
      <header className="border-b border-line-soft bg-surface-1/90 px-5 py-3 backdrop-blur">
        {topBar}
      </header>
      <div className="grid min-h-0 grid-cols-[68px_240px_minmax(0,1fr)_280px] gap-3 px-3 py-3">
        <Pane muted className="min-h-0">{modeRail}</Pane>
        <Pane muted className="min-h-0">{navigator}</Pane>
        <Pane className="min-h-0">{mainStage}</Pane>
        <Pane muted className="min-h-0">
          {inspector ?? (
            <>
              <PaneHeader title="Inspector" description="Context, versions, and runtime stay close without taking over the run." />
              <div className="p-4">
                <EmptyState
                  title="Inspector ready"
                  message="Accepted state, versions, and local overrides stay one step away from the stage."
                />
              </div>
            </>
          )}
        </Pane>
      </div>
      <Pane muted className="mx-3 mb-3 min-h-0">
        {bottomDock ?? (
          <>
            <PaneHeader title="Bottom Dock" description="Events, trace, consistency, problems, and cost stay docked below the run." />
            <div className="p-4">
              <EmptyState
                title="Dock ready"
                message="Trace, warnings, and cost stay visible without pulling attention off the run."
              />
            </div>
          </>
        )}
      </Pane>
    </div>
  )
}
