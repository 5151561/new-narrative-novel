import { PaneHeader } from '@/components/ui/PaneHeader'
import type { ChapterSceneStructurePatch } from '../api/chapter-record-mutations'
import type { ChapterStructureView, ChapterStructureWorkspaceViewModel } from '../types/chapter-view-models'
import { ChapterAssemblyView } from './ChapterAssemblyView'
import { ChapterBacklogPlannerView } from './ChapterBacklogPlannerView'
import { ChapterOutlinerView } from './ChapterOutlinerView'
import { ChapterSequenceView } from './ChapterSequenceView'

const defaultAvailableViews: ChapterStructureView[] = ['sequence', 'outliner', 'assembly', 'backlog']

interface ChapterStructureStageProps {
  activeView: ChapterStructureView
  labels: Record<ChapterStructureView, string>
  workspace: ChapterStructureWorkspaceViewModel
  title: string
  onViewChange: (view: ChapterStructureView) => void
  onSelectScene?: (sceneId: string) => void
  onSaveScenePatch?: (sceneId: string, patch: ChapterSceneStructurePatch) => Promise<void> | void
  savingSceneId?: string | null
  onOpenScene?: (sceneId: string, lens: 'orchestrate' | 'draft') => void
  availableViews?: ChapterStructureView[]
  onSavePlanningInput?: (input: { goal: string; constraints: string[] }) => Promise<void> | void
  onGenerateProposal?: () => Promise<void> | void
  onUpdateProposalScene?: (
    proposalId: string,
    proposalSceneId: string,
    input: {
      patch?: Partial<Record<'title' | 'summary' | 'purpose' | 'pov' | 'location' | 'conflict' | 'reveal' | 'plannerNotes', string>>
      order?: number
      backlogStatus?: 'planned' | 'running' | 'needs_review' | 'drafted' | 'revised'
    },
  ) => Promise<void> | void
  onAcceptProposal?: (proposalId: string) => Promise<void> | void
  savingPlanning?: boolean
  generatingProposal?: boolean
  updatingProposalSceneId?: string | null
  acceptingProposalId?: string | null
}

export function ChapterStructureStage({
  activeView,
  labels,
  workspace,
  title,
  onViewChange,
  onSelectScene,
  onSaveScenePatch,
  savingSceneId,
  onOpenScene,
  availableViews = defaultAvailableViews,
  onSavePlanningInput,
  onGenerateProposal,
  onUpdateProposalScene,
  onAcceptProposal,
  savingPlanning = false,
  generatingProposal = false,
  updatingProposalSceneId = null,
  acceptingProposalId = null,
}: ChapterStructureStageProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PaneHeader
        title={title}
        description={workspace.title}
        actions={
          <div className="flex flex-wrap gap-2">
            {availableViews.map((view) => (
              <button
                key={view}
                type="button"
                aria-pressed={activeView === view}
                onClick={() => onViewChange(view)}
                className={`rounded-md border px-3 py-2 text-sm ${
                  activeView === view
                    ? 'border-line-strong bg-surface-1 text-text-main'
                    : 'border-line-soft bg-surface-2 text-text-muted'
                }`}
              >
                {labels[view]}
              </button>
            ))}
          </div>
        }
      />
      <div className="min-h-0 flex-1 overflow-auto p-4">
        {activeView === 'sequence' ? (
          <ChapterSequenceView workspace={workspace} onSelectScene={onSelectScene} onOpenScene={onOpenScene} />
        ) : null}
        {activeView === 'outliner' ? (
          <ChapterOutlinerView
            workspace={workspace}
            onSelectScene={onSelectScene}
            onSaveScenePatch={onSaveScenePatch}
            savingSceneId={savingSceneId}
            onOpenScene={onOpenScene}
          />
        ) : null}
        {activeView === 'assembly' ? (
          <ChapterAssemblyView workspace={workspace} onSelectScene={onSelectScene} onOpenScene={onOpenScene} />
        ) : null}
        {activeView === 'backlog' ? (
          <ChapterBacklogPlannerView
            workspace={workspace}
            onSelectScene={onSelectScene}
            onSavePlanningInput={onSavePlanningInput}
            onGenerateProposal={onGenerateProposal}
            onUpdateProposalScene={onUpdateProposalScene}
            onAcceptProposal={onAcceptProposal}
            savingPlanning={savingPlanning}
            generatingProposal={generatingProposal}
            updatingProposalSceneId={updatingProposalSceneId}
            acceptingProposalId={acceptingProposalId}
          />
        ) : null}
      </div>
    </div>
  )
}
