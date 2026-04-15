import { Badge } from '@/components/ui/Badge'

import type { SceneObjectiveModel } from '../types/scene-view-models'

interface SceneObjectiveStripProps {
  objective: SceneObjectiveModel
  onOpenSetup?: () => void
}

export function SceneObjectiveStrip({ objective, onOpenSetup }: SceneObjectiveStripProps) {
  return (
    <section className="mx-5 mt-5 border-b border-line-soft pb-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-4xl space-y-3">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.05em] text-text-soft">Directing Brief</p>
            <h2 className="text-xl leading-tight text-text-main">{objective.goal}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {objective.tensionLabel ? <Badge tone="accent">Tension: {objective.tensionLabel}</Badge> : null}
            {objective.pacingLabel ? <Badge>Pacing: {objective.pacingLabel}</Badge> : null}
            {objective.location ? <Badge>Location: {objective.location.name}</Badge> : null}
            <Badge tone={objective.warningsCount > 0 ? 'warn' : 'neutral'}>Warnings: {objective.warningsCount}</Badge>
            <Badge tone={objective.unresolvedCount > 0 ? 'warn' : 'neutral'}>Unresolved: {objective.unresolvedCount}</Badge>
          </div>
        </div>
        {onOpenSetup ? (
          <button
            type="button"
            onClick={onOpenSetup}
            className="rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main"
          >
            Edit Setup
          </button>
        ) : null}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.05em] text-text-soft">Cast in play</p>
          <ul className="flex flex-wrap gap-2">
            {objective.cast.map((member) => (
              <li key={member.id} className="rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm text-text-muted">
                <span className="font-medium text-text-main">{member.name}</span>
                {member.role ? <span> · {member.role}</span> : null}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.05em] text-text-soft">Constraint anchors</p>
          <ul className="space-y-2 text-sm leading-6 text-text-muted">
            {objective.constraintSummary.map((constraint) => (
              <li key={constraint} className="border-l border-line-soft pl-3">
                {constraint}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
