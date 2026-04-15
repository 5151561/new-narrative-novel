import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FactList } from '@/components/ui/FactList'
import { PaneHeader } from '@/components/ui/PaneHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { TimelineList } from '@/components/ui/TimelineList'

import { cn } from '@/lib/cn'

import type { SceneInspectorViewModel } from '../types/scene-view-models'

export type InspectorTabId = 'context' | 'versions' | 'runtime'

const inspectorTabs: Array<{ id: InspectorTabId; label: string }> = [
  { id: 'context', label: 'Context' },
  { id: 'versions', label: 'Versions' },
  { id: 'runtime', label: 'Runtime' },
]

function InspectorTabs({
  activeTab,
  onChange,
}: {
  activeTab: InspectorTabId
  onChange: (tab: InspectorTabId) => void
}) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-line-soft px-4 py-3">
      {inspectorTabs.map((tab) => (
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

function ContextTab({ context }: { context: SceneInspectorViewModel['context'] }) {
  return (
    <div className="grid gap-4 p-4">
      <SectionCard eyebrow="Accepted" title="Accepted Facts">
        {context.acceptedFacts.length > 0 ? (
          <FactList items={context.acceptedFacts} />
        ) : (
          <EmptyState title="No accepted facts" message="Accepted state will appear here once execution review clears a candidate." />
        )}
      </SectionCard>
      <SectionCard eyebrow="Guard" title="Private Info Guard">
        <div className="space-y-3">
          <p className="text-sm leading-6 text-text-muted">{context.privateInfoGuard.summary}</p>
          {context.privateInfoGuard.items.length > 0 ? (
            <div className="grid gap-2">
              {context.privateInfoGuard.items.map((item) => (
                <div key={item.id} className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-text-main">{item.label}</p>
                    <Badge tone={item.status === 'guarded' ? 'warn' : item.status === 'watching' ? 'accent' : 'success'}>
                      {item.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-text-muted">{item.summary}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No guarded reveals" message="Private-info guardrails will appear here when the scene needs reveal protection." />
          )}
        </div>
      </SectionCard>
      <SectionCard eyebrow="Boundaries" title="Actor Knowledge Boundaries">
        {context.actorKnowledgeBoundaries.length > 0 ? (
          <div className="grid gap-3">
            {context.actorKnowledgeBoundaries.map((entry) => (
              <div key={entry.actor.id} className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-text-main">{entry.actor.name}</p>
                  {entry.actor.role ? <Badge>{entry.actor.role}</Badge> : null}
                </div>
                <ul className="mt-3 space-y-2">
                  {entry.boundaries.map((boundary) => (
                    <li key={boundary.id} className="rounded-md border border-line-soft bg-surface-1 px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-text-main">{boundary.label}</p>
                        <Badge tone={boundary.status === 'guarded' ? 'warn' : boundary.status === 'known' ? 'success' : 'accent'}>
                          {boundary.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-text-muted">{boundary.summary}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No actor boundaries yet" message="Actor-specific knowledge boundaries will appear here once setup defines them." />
        )}
      </SectionCard>
      <SectionCard eyebrow="Local" title="State And Overrides">
        <div className="space-y-3">
          <FactList items={context.localState} />
          {context.overrides.length > 0 ? (
            <div className="grid gap-2">
              {context.overrides.map((override) => (
                <div key={override.id} className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-text-main">{override.label}</p>
                    <Badge tone={override.status === 'active' ? 'accent' : override.status === 'watching' ? 'warn' : 'neutral'}>
                      {override.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-text-muted">{override.summary}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </SectionCard>
    </div>
  )
}

function VersionsTab({ versions }: { versions: SceneInspectorViewModel['versions'] }) {
  return (
    <div className="grid gap-4 p-4">
      <SectionCard eyebrow="Checkpoints" title="Version Checkpoints">
        {versions.checkpoints.length > 0 ? (
          <div className="grid gap-2">
            {versions.checkpoints.map((checkpoint) => (
              <div key={checkpoint.id} className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-text-main">{checkpoint.label}</p>
                  <Badge tone={checkpoint.status === 'accepted' ? 'success' : checkpoint.status === 'review' ? 'accent' : 'warn'}>
                    {checkpoint.status}
                  </Badge>
                </div>
                <p className="mt-1 text-sm leading-6 text-text-muted">{checkpoint.summary}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No checkpoints yet" message="Version checkpoints will appear once execution produces accepted state." />
        )}
      </SectionCard>
      <SectionCard eyebrow="Timeline" title="Acceptance Timeline">
        {versions.acceptanceTimeline.length > 0 ? (
          <TimelineList items={versions.acceptanceTimeline} />
        ) : (
          <EmptyState title="No timeline events" message="Acceptance history is still empty for this scene." />
        )}
      </SectionCard>
      <SectionCard eyebrow="Patch Candidates" title="Commit Summary">
        {versions.patchCandidates.length > 0 ? (
          <div className="grid gap-2">
            {versions.patchCandidates.map((candidate) => (
              <div key={candidate.id} className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-text-main">{candidate.label}</p>
                  <Badge tone={candidate.status === 'ready_for_commit' ? 'success' : candidate.status === 'needs_review' ? 'warn' : 'neutral'}>
                    {candidate.status}
                  </Badge>
                </div>
                <p className="mt-1 text-sm leading-6 text-text-muted">{candidate.summary}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No patch candidates" message="Accept and Commit remain separated, so commit-ready summaries only appear here." />
        )}
      </SectionCard>
    </div>
  )
}

function RuntimeTab({ runtime }: { runtime: SceneInspectorViewModel['runtime'] }) {
  return (
    <div className="grid gap-4 p-4">
      <SectionCard eyebrow="Profile" title="Runtime Profile">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge tone={runtime.runHealth === 'stable' ? 'success' : runtime.runHealth === 'attention' ? 'warn' : 'danger'}>
              {runtime.runHealth}
            </Badge>
            <p className="text-sm font-medium text-text-main">{runtime.profile.label}</p>
          </div>
          <p className="text-sm leading-6 text-text-muted">{runtime.profile.summary}</p>
        </div>
      </SectionCard>
      <SectionCard eyebrow="Metrics" title="Latency / Tokens / Cost">
        <FactList
          items={[
            { id: 'metric-latency', label: 'Latency', value: runtime.metrics.latencyLabel },
            { id: 'metric-tokens', label: 'Tokens', value: runtime.metrics.tokenLabel },
            { id: 'metric-cost', label: 'Cost', value: runtime.metrics.costLabel },
          ]}
        />
      </SectionCard>
      <SectionCard eyebrow="Failure" title="Latest Failure">
        <p className="text-sm leading-6 text-text-muted">
          {runtime.latestFailure ?? 'No runtime failures recorded for this scene.'}
        </p>
      </SectionCard>
    </div>
  )
}

interface SceneInspectorPanelProps {
  data: SceneInspectorViewModel
  activeTab: InspectorTabId
  onTabChange: (tab: InspectorTabId) => void
}

export function SceneInspectorPanel({ data, activeTab, onTabChange }: SceneInspectorPanelProps) {
  return (
    <>
      <PaneHeader
        title="Context / Versions / Runtime"
        description="Inspect context, version checkpoints, and runtime summaries here. Raw trace stays docked below the main stage."
      />
      <InspectorTabs activeTab={activeTab} onChange={onTabChange} />
      <div className="min-h-0 overflow-y-auto">
        {activeTab === 'context' ? <ContextTab context={data.context} /> : null}
        {activeTab === 'versions' ? <VersionsTab versions={data.versions} /> : null}
        {activeTab === 'runtime' ? <RuntimeTab runtime={data.runtime} /> : null}
      </div>
    </>
  )
}
