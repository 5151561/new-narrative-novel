import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'

import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'

import { WorkbenchSurfaceBody } from './WorkbenchSurfaceBody'

type WorkbenchBottomDockFrameTabTone = 'neutral' | 'accent' | 'success' | 'warn' | 'danger'

export interface WorkbenchBottomDockFrameTab<TabId extends string = string> {
  id: TabId
  label: string
  badge?: string | number
  tone?: WorkbenchBottomDockFrameTabTone
}

interface WorkbenchBottomDockFrameProps<TabId extends string = string> {
  ariaLabel: string
  tabs: Array<WorkbenchBottomDockFrameTab<TabId>>
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  children: ReactNode
}

function toDomIdPart(value: string) {
  return value.replace(/[^A-Za-z0-9_-]/g, '-')
}

export function WorkbenchBottomDockFrame<TabId extends string = string>({
  ariaLabel,
  tabs,
  activeTab,
  onTabChange,
  children,
}: WorkbenchBottomDockFrameProps<TabId>) {
  const reactId = useId()
  const baseId = `workbench-bottom-dock-${toDomIdPart(reactId)}`
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const activeTabIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === activeTab),
  )
  const activeTabId = tabs[activeTabIndex]?.id ?? activeTab
  const activeTabDomId = `${baseId}-tab-${toDomIdPart(activeTabId)}`
  const activePanelDomId = `${baseId}-panel-${toDomIdPart(activeTabId)}`

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (tabs.length === 0) {
      return
    }

    const lastIndex = tabs.length - 1
    const nextIndex =
      event.key === 'ArrowRight'
        ? index === lastIndex
          ? 0
          : index + 1
        : event.key === 'ArrowLeft'
          ? index === 0
            ? lastIndex
            : index - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? lastIndex
              : null

    if (nextIndex == null) {
      return
    }

    event.preventDefault()
    onTabChange(tabs[nextIndex].id)
    tabRefs.current[nextIndex]?.focus()
  }

  return (
    <section
      aria-label={ariaLabel}
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      data-testid="workbench-bottom-dock-frame"
    >
      <div
        className="flex shrink-0 flex-wrap gap-2 border-b border-line-soft px-4 py-3"
        role="tablist"
        aria-label={`${ariaLabel} tabs`}
      >
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id
          const tabDomId = `${baseId}-tab-${toDomIdPart(tab.id)}`
          const panelDomId = `${baseId}-panel-${toDomIdPart(tab.id)}`

          return (
            <button
              key={tab.id}
              ref={(element) => {
                tabRefs.current[index] = element
              }}
              id={tabDomId}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={panelDomId}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className={cn(
                'flex min-h-9 items-center gap-2 rounded-md px-3 py-2 text-sm',
                isActive
                  ? 'bg-surface-2 text-text-main shadow-ringwarm'
                  : 'text-text-muted hover:bg-surface-2',
              )}
            >
              <span>{tab.label}</span>
              {tab.badge != null ? <Badge tone={tab.tone ?? 'neutral'}>{tab.badge}</Badge> : null}
            </button>
          )
        })}
      </div>
      <WorkbenchSurfaceBody
        id={activePanelDomId}
        role="tabpanel"
        aria-labelledby={activeTabDomId}
        data-testid="workbench-bottom-dock-frame-scroll-body"
      >
        {children}
      </WorkbenchSurfaceBody>
    </section>
  )
}
