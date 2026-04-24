import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'

import type { RunEventRefRecord } from '../api/run-records'

export interface RunArtifactRefListProps {
  refs?: RunEventRefRecord[]
  selectedArtifactId?: string | null
  onSelectArtifact?: (artifactId: string) => void
}

const clickableRefKinds = new Set<RunEventRefRecord['kind']>([
  'context-packet',
  'agent-invocation',
  'proposal-set',
  'canon-patch',
  'prose-draft',
  'artifact',
])

function getRefLabel(ref: RunEventRefRecord) {
  return ref.label ?? ref.kind
}

export function RunArtifactRefList({ refs, selectedArtifactId, onSelectArtifact }: RunArtifactRefListProps) {
  if (!refs?.length) {
    return null
  }

  return (
    <div className="flex max-w-[220px] flex-wrap justify-end gap-1">
      {refs.map((ref) => {
        const label = getRefLabel(ref)
        const clickable = clickableRefKinds.has(ref.kind) && Boolean(onSelectArtifact)
        const selected = selectedArtifactId === ref.id

        if (!clickable) {
          return (
            <Badge key={`${ref.kind}-${ref.id}`} title={label} tone={selected ? 'accent' : 'neutral'}>
              {label}
            </Badge>
          )
        }

        return (
          <button
            key={`${ref.kind}-${ref.id}`}
            type="button"
            aria-label={`Open ${label}`}
            aria-pressed={selected}
            title={label}
            onClick={(event) => {
              event.stopPropagation()
              onSelectArtifact?.(ref.id)
            }}
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium uppercase tracking-[0.04em] ring-1 ring-inset transition-colors',
              selected
                ? 'bg-accent-muted text-accent-strong ring-[rgba(201,100,66,0.22)]'
                : 'bg-surface-2 text-text-muted ring-line-soft hover:bg-surface-1 hover:text-text-main',
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
