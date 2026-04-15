import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FactList } from '@/components/ui/FactList'
import { PaneHeader } from '@/components/ui/PaneHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { TimelineList } from '@/components/ui/TimelineList'

import { cn } from '@/lib/cn'

import type { SceneDockTabId, SceneDockViewModel } from '../types/scene-view-models'

const dockTabs: Array<{ id: SceneDockTabId; label: string }> = [
  { id: 'events', label: 'Events' },
  { id: 'trace', label: 'Trace' },
  { id: 'consistency', label: 'Consistency' },
  { id: 'problems', label: 'Problems' },
  { id: 'cost', label: 'Cost' },
]

function DockTabs({
  activeTab,
  onChange,
}: {
  activeTab: SceneDockTabId
  onChange: (tab: SceneDockTabId) => void
}) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-line-soft px-4 py-3">
      {dockTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'rounded-md px-3 py-2 text-sm',
            activeTab === tab.id ? 'bg-surface-2 text-text-main shadow-ringwarm' : 'text-text-muted hover:bg-surface-2',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function EventsTab({ items }: { items: SceneDockViewModel['events'] }) {
  return items.length > 0 ? (
    <TimelineList items={items} />
  ) : (
    <div className="p-4">
      <EmptyState title="No events yet" message="Structured event summaries will appear here when execution emits them." />
    </div>
  )
}

function TraceTab({ items }: { items: SceneDockViewModel['trace'] }) {
  return items.length > 0 ? (
    <div className="grid gap-3 p-4 md:grid-cols-2">
      {items.map((item) => (
        <SectionCard key={item.id} eyebrow={item.meta} title={item.title}>
          <p className="text-sm leading-6 text-text-muted">{item.detail}</p>
        </SectionCard>
      ))}
    </div>
  ) : (
    <div className="p-4">
      <EmptyState title="No trace summaries" message="Trace stays structured here and never turns the stage into a log wall." />
    </div>
  )
}

function ConsistencyTab({ consistency }: { consistency: SceneDockViewModel['consistency'] }) {
  return (
    <div className="grid gap-4 p-4">
      <SectionCard eyebrow="Summary" title="Consistency Checks">
        <p className="text-sm leading-6 text-text-muted">{consistency.summary}</p>
      </SectionCard>
      {consistency.checks.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-3">
          {consistency.checks.map((check) => (
            <SectionCard key={check.id} eyebrow={check.status.toUpperCase()} title={check.label}>
              <p className="text-sm leading-6 text-text-muted">{check.detail}</p>
            </SectionCard>
          ))}
        </div>
      ) : (
        <EmptyState title="No checks yet" message="Consistency summaries will appear once runtime passes begin." />
      )}
    </div>
  )
}

function ProblemsTab({ problems }: { problems: SceneDockViewModel['problems'] }) {
  return (
    <div className="grid gap-4 p-4">
      <SectionCard eyebrow="Summary" title="Problems">
        <p className="text-sm leading-6 text-text-muted">{problems.summary}</p>
      </SectionCard>
      {problems.items.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {problems.items.map((problem) => (
            <SectionCard key={problem.id} eyebrow={problem.severity.toUpperCase()} title={problem.title}>
              <p className="text-sm leading-6 text-text-muted">{problem.recommendation}</p>
            </SectionCard>
          ))}
        </div>
      ) : (
        <EmptyState title="No problems recorded" message="When problems do appear, they stay summarized here rather than flooding the main canvas." />
      )}
    </div>
  )
}

function CostTab({ cost }: { cost: SceneDockViewModel['cost'] }) {
  return (
    <div className="grid gap-4 p-4 md:grid-cols-[320px_minmax(0,1fr)]">
      <SectionCard eyebrow="Current Window" title="Cost Overview">
        <div className="space-y-2">
          <Badge tone="accent">{cost.currentWindowLabel}</Badge>
          <p className="text-sm leading-6 text-text-muted">{cost.trendLabel}</p>
        </div>
      </SectionCard>
      {cost.breakdown.length > 0 ? (
        <SectionCard eyebrow="Breakdown" title="Usage Snapshot">
          <FactList items={cost.breakdown} />
        </SectionCard>
      ) : (
        <EmptyState title="No cost data" message="Usage stays empty until execution actually runs." />
      )}
    </div>
  )
}

interface SceneBottomDockProps {
  data: SceneDockViewModel
  activeTab: SceneDockTabId
  isHydratingTab?: boolean
  onTabChange: (tab: SceneDockTabId) => void
}

export function SceneBottomDock({ data, activeTab, isHydratingTab = false, onTabChange }: SceneBottomDockProps) {
  return (
    <>
      <PaneHeader
        title="Bottom Dock"
        description="Events, trace, consistency, problems, and cost stay docked here so the stage remains editorial."
      />
      <DockTabs activeTab={activeTab} onChange={onTabChange} />
      <div className="min-h-0 overflow-y-auto">
        {isHydratingTab ? (
          <div className="p-4">
            <EmptyState title={`Loading ${activeTab}`} message="Hydrating the active dock tab without pulling every detail up front." />
          </div>
        ) : activeTab === 'events' ? (
          <EventsTab items={data.events} />
        ) : activeTab === 'trace' ? (
          <TraceTab items={data.trace} />
        ) : activeTab === 'consistency' ? (
          <ConsistencyTab consistency={data.consistency} />
        ) : activeTab === 'problems' ? (
          <ProblemsTab problems={data.problems} />
        ) : (
          <CostTab cost={data.cost} />
        )}
      </div>
    </>
  )
}
