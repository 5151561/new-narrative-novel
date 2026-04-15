import type { ReactNode } from 'react'

import { useI18n } from '@/app/i18n'
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
  const { dictionary } = useI18n()

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
              <PaneHeader title={dictionary.shell.inspectorTitle} description={dictionary.shell.inspectorDescription} />
              <div className="p-4">
                <EmptyState
                  title={dictionary.shell.inspectorReadyTitle}
                  message={dictionary.shell.inspectorReadyMessage}
                />
              </div>
            </>
          )}
        </Pane>
      </div>
      <Pane muted className="mx-3 mb-3 min-h-0">
        {bottomDock ?? (
          <>
            <PaneHeader title={dictionary.shell.bottomDockTitle} description={dictionary.shell.bottomDockDescription} />
            <div className="p-4">
              <EmptyState
                title={dictionary.shell.dockReadyTitle}
                message={dictionary.shell.dockReadyMessage}
              />
            </div>
          </>
        )}
      </Pane>
    </div>
  )
}
