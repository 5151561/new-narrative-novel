import { getAssetKnowledgeViewLabel, useI18n } from '@/app/i18n'
import { PaneHeader } from '@/components/ui/PaneHeader'
import type {
  AssetKnowledgeView,
  ChapterLens,
  SceneLens,
} from '@/features/workbench/types/workbench-route'

import type {
  AssetContextPolicyViewModel,
  AssetMentionViewModel,
  AssetProfileViewModel,
  AssetRelationViewModel,
  AssetStoryBibleViewModel,
} from '../types/asset-view-models'
import { AssetContextPolicyView } from './AssetContextPolicyView'
import { AssetMentionsView } from './AssetMentionsView'
import { AssetProfileView } from './AssetProfileView'
import { AssetRelationsView } from './AssetRelationsView'

interface AssetKnowledgeStageProps {
  assetTitle: string
  assetSummary: string
  activeView: AssetKnowledgeView
  availableViews: AssetKnowledgeView[]
  profile: AssetProfileViewModel
  storyBible: AssetStoryBibleViewModel
  mentions: AssetMentionViewModel[]
  relations: AssetRelationViewModel[]
  contextPolicy: AssetContextPolicyViewModel
  onViewChange: (view: AssetKnowledgeView) => void
  onOpenScene: (sceneId: string, lens: Extract<SceneLens, 'draft' | 'orchestrate'>) => void
  onOpenChapter: (chapterId: string, lens: Extract<ChapterLens, 'structure' | 'draft'>) => void
  onSelectAsset: (assetId: string) => void
}

export function AssetKnowledgeStage({
  assetTitle,
  assetSummary,
  activeView,
  availableViews,
  profile,
  storyBible,
  mentions,
  relations,
  contextPolicy,
  onViewChange,
  onOpenScene,
  onOpenChapter,
  onSelectAsset,
}: AssetKnowledgeStageProps) {
  const { locale } = useI18n()

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PaneHeader
        title={assetTitle}
        description={assetSummary}
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
                    : 'border-line-soft text-text-muted hover:bg-surface-2'
                }`}
              >
                {getAssetKnowledgeViewLabel(locale, view)}
              </button>
            ))}
          </div>
        }
      />
      <div className="min-h-0 flex-1 overflow-auto">
        {activeView === 'profile' ? (
          <AssetProfileView
            profile={profile}
            storyBible={storyBible}
            onOpenScene={onOpenScene}
            onOpenChapter={onOpenChapter}
          />
        ) : null}
        {activeView === 'mentions' ? (
          <AssetMentionsView mentions={mentions} onOpenScene={onOpenScene} onOpenChapter={onOpenChapter} />
        ) : null}
        {activeView === 'relations' ? (
          <AssetRelationsView relations={relations} onSelectAsset={onSelectAsset} />
        ) : null}
        {activeView === 'context' ? <AssetContextPolicyView policy={contextPolicy} /> : null}
      </div>
    </div>
  )
}
