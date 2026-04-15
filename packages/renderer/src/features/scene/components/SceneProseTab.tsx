import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionCard } from '@/components/ui/SectionCard'
import { StickyFooter } from '@/components/ui/StickyFooter'
import { Toolbar } from '@/components/ui/Toolbar'

import type { SceneProseViewModel } from '../types/scene-view-models'

interface SceneProseTabProps {
  prose: SceneProseViewModel
  selectedMode: SceneProseViewModel['revisionModes'][number]
  isFocusModeActive: boolean
  isRevising: boolean
  onSelectMode: (mode: SceneProseViewModel['revisionModes'][number]) => void
  onToggleFocusMode: () => void
  onRevise: () => void
}

const revisionLabels: Record<SceneProseViewModel['revisionModes'][number], string> = {
  rewrite: 'Rewrite',
  compress: 'Compress',
  expand: 'Expand',
  tone_adjust: 'Tone Adjust',
  continuity_fix: 'Continuity Fix',
}

export function ProseDraftReader({ proseDraft }: Pick<SceneProseViewModel, 'proseDraft'>) {
  if (!proseDraft) {
    return (
      <EmptyState
        title="No draft prose yet"
        message="Execution can still continue, but prose stays empty until a local draft is generated."
      />
    )
  }

  return (
    <SectionCard eyebrow="Read Only" title="Current Draft">
      <div className="space-y-4">
        <p className="rounded-md border border-line-soft bg-surface-2 px-4 py-4 text-[15px] leading-7 text-text-main">
          {proseDraft}
        </p>
      </div>
    </SectionCard>
  )
}

export function RevisionActionBar({
  revisionModes,
  selectedMode,
  isRevising,
  onSelectMode,
  onRevise,
}: Pick<SceneProseTabProps, 'selectedMode' | 'isRevising' | 'onSelectMode' | 'onRevise'> &
  Pick<SceneProseViewModel, 'revisionModes'>) {
  return (
    <SectionCard eyebrow="Revision" title="Revision Actions">
      <div className="flex flex-wrap gap-2">
        {revisionModes.map((mode) => {
          const isSelected = selectedMode === mode

          return (
            <button
              key={mode}
              type="button"
              onClick={() => onSelectMode(mode)}
              className={`rounded-md px-3 py-2 text-sm ${
                isSelected ? 'bg-accent text-white' : 'border border-line-soft bg-surface-2 text-text-main'
              }`}
            >
              {revisionLabels[mode]}
            </button>
          )
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-text-main">Selected pass</p>
          <p className="text-sm text-text-muted">
            {revisionLabels[selectedMode]} prepares the next revision pass against this scene draft without leaving the workbench.
          </p>
        </div>
        <button
          type="button"
          onClick={onRevise}
          disabled={isRevising}
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Revise Draft
        </button>
      </div>
    </SectionCard>
  )
}

export function ProseToolbar({
  prose,
  selectedMode,
  isFocusModeActive,
  onToggleFocusMode,
}: Pick<SceneProseTabProps, 'prose' | 'selectedMode' | 'isFocusModeActive' | 'onToggleFocusMode'>) {
  return (
    <Toolbar className="justify-between border-b border-line-soft bg-surface-1 px-4 py-3 shadow-ringwarm">
      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.05em] text-text-soft">Prose Toolbar</p>
        <p className="text-sm font-medium text-text-main">Scene Prose Workbench</p>
        <p className="text-sm text-text-muted">Read the accepted draft, choose a revision pass, and stay inside the scene cockpit.</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">{revisionLabels[selectedMode]}</Badge>
          <Badge tone={prose.focusModeAvailable ? 'success' : 'neutral'}>
            {prose.focusModeAvailable ? 'Focus available' : 'Focus unavailable'}
          </Badge>
          {isFocusModeActive ? <Badge tone="accent">Focus mode active</Badge> : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {prose.focusModeAvailable ? (
          <button
            type="button"
            onClick={onToggleFocusMode}
            className="rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm"
          >
            {isFocusModeActive ? 'Exit Focus Mode' : 'Focus Mode'}
          </button>
        ) : null}
      </div>
    </Toolbar>
  )
}

export function ProseStatusFooter({ prose, selectedMode }: Pick<SceneProseTabProps, 'prose' | 'selectedMode'>) {
  return (
    <StickyFooter>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={prose.warningsCount > 0 ? 'warn' : 'success'}>{prose.warningsCount} warnings</Badge>
          <Badge tone="neutral">{prose.draftWordCount ?? 0} words</Badge>
          <Badge tone="accent">{revisionLabels[selectedMode]}</Badge>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-sm text-text-main">{prose.statusLabel ?? 'Ready for revision pass'}</p>
          <p className="text-sm text-text-muted">{prose.latestDiffSummary ?? 'No prose revision requested yet.'}</p>
        </div>
      </div>
    </StickyFooter>
  )
}

export function SceneProseTab({
  prose,
  selectedMode,
  isFocusModeActive,
  isRevising,
  onSelectMode,
  onToggleFocusMode,
  onRevise,
}: SceneProseTabProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-5 pt-5">
        <ProseToolbar
          prose={prose}
          selectedMode={selectedMode}
          isFocusModeActive={isFocusModeActive}
          onToggleFocusMode={onToggleFocusMode}
        />
      </div>
      <div className="grid flex-1 gap-4 overflow-y-auto px-5 py-5 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <ProseDraftReader proseDraft={prose.proseDraft} />
        <div className="grid content-start gap-4">
          <RevisionActionBar
            revisionModes={prose.revisionModes}
            selectedMode={selectedMode}
            isRevising={isRevising}
            onSelectMode={onSelectMode}
            onRevise={onRevise}
          />
          <SectionCard eyebrow="Diff Summary" title="Latest Revision">
            <p className="text-sm leading-6 text-text-muted">
              {prose.latestDiffSummary ?? 'No prose revision requested yet.'}
            </p>
          </SectionCard>
        </div>
      </div>
      <ProseStatusFooter prose={prose} selectedMode={selectedMode} />
    </div>
  )
}
