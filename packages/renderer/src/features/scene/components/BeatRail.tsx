import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'

import type { BeatRailItemModel } from '../types/scene-view-models'

interface BeatRailProps {
  beats: BeatRailItemModel[]
  selectedBeatId?: string
  onSelectBeat: (beatId: string) => void
}

function toneForBeat(status: BeatRailItemModel['status']): 'neutral' | 'accent' | 'success' | 'warn' | 'danger' {
  if (status === 'accepted') {
    return 'success'
  }
  if (status === 'review' || status === 'running') {
    return 'accent'
  }
  if (status === 'blocked') {
    return 'danger'
  }
  return 'neutral'
}

export function BeatRail({ beats, selectedBeatId, onSelectBeat }: BeatRailProps) {
  const activeCount = beats.filter((beat) => beat.status === 'running' || beat.status === 'review').length

  return (
    <aside className="flex min-h-0 flex-col border-r border-line-soft">
      <div className="border-b border-line-soft px-4 py-3">
        <p className="text-[11px] uppercase tracking-[0.05em] text-text-soft">Beat Rail</p>
        <h3 className="mt-1 text-lg">Beat Filters</h3>
        <p className="mt-1 text-sm text-text-muted">Switch the proposal stack by beat and keep review pressure structural.</p>
        <p className="mt-2 text-xs uppercase tracking-[0.05em] text-text-soft">{activeCount} active beats in play</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="space-y-3">
          {beats.map((beat) => (
            <button
              key={beat.id}
              type="button"
              onClick={() => onSelectBeat(beat.id)}
              className={cn(
                'w-full rounded-md border px-3 py-3 text-left transition-colors',
                selectedBeatId === beat.id
                  ? 'border-line-strong bg-surface-2 shadow-ringwarm'
                  : 'border-line-soft bg-surface-1 hover:bg-surface-2',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.05em] text-text-soft">Beat {beat.index}</p>
                  <p className="mt-1 text-sm font-medium text-text-main">{beat.title}</p>
                </div>
                <Badge tone={toneForBeat(beat.status)}>{beat.status}</Badge>
              </div>
              {beat.summary ? <p className="mt-2 text-sm leading-6 text-text-muted">{beat.summary}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-soft">
                <span>{beat.proposalCount} proposals</span>
                <span>{beat.warningCount} warnings</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
