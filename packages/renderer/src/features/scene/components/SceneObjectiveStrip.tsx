import { Badge } from '@/components/ui/Badge'
import { SectionCard } from '@/components/ui/SectionCard'

import type { SceneObjectiveModel } from '../types/scene-view-models'

interface SceneObjectiveStripProps {
  objective: SceneObjectiveModel
}

export function SceneObjectiveStrip({ objective }: SceneObjectiveStripProps) {
  return (
    <SectionCard className="mx-5 mt-5" eyebrow="Objective" title={objective.goal}>
      <div className="flex flex-wrap items-center gap-2">
        {objective.tensionLabel ? <Badge tone="accent">Tension: {objective.tensionLabel}</Badge> : null}
        {objective.pacingLabel ? <Badge>Pacing: {objective.pacingLabel}</Badge> : null}
        {objective.location ? <Badge>Location: {objective.location.name}</Badge> : null}
        <Badge tone={objective.warningsCount > 0 ? 'warn' : 'neutral'}>
          Warnings: {objective.warningsCount}
        </Badge>
        <Badge tone={objective.unresolvedCount > 0 ? 'warn' : 'neutral'}>
          Unresolved: {objective.unresolvedCount}
        </Badge>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <p className="text-xs uppercase tracking-[0.05em] text-text-soft">Cast in play</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {objective.cast.map((member) => (
              <li key={member.id} className="rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm text-text-muted">
                <span className="font-medium text-text-main">{member.name}</span>
                {member.role ? <span> · {member.role}</span> : null}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2 rounded-md border border-line-soft bg-surface-2 px-3 py-3">
          <p className="text-xs uppercase tracking-[0.05em] text-text-soft">Constraint anchors</p>
          <ul className="space-y-2 text-sm leading-6 text-text-muted">
            {objective.constraintSummary.map((constraint) => (
              <li key={constraint}>{constraint}</li>
            ))}
          </ul>
        </div>
      </div>
    </SectionCard>
  )
}
