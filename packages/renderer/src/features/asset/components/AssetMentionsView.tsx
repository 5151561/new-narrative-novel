import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionCard } from '@/components/ui/SectionCard'
import { useI18n } from '@/app/i18n'
import type { ChapterLens, SceneLens } from '@/features/workbench/types/workbench-route'

import type { AssetMentionViewModel } from '../types/asset-view-models'

interface AssetMentionsViewProps {
  mentions: AssetMentionViewModel[]
  onOpenScene: (sceneId: string, lens: Extract<SceneLens, 'draft' | 'orchestrate'>) => void
  onOpenChapter: (chapterId: string, lens: Extract<ChapterLens, 'structure' | 'draft'>) => void
}

export function AssetMentionsView({ mentions, onOpenScene, onOpenChapter }: AssetMentionsViewProps) {
  const { dictionary } = useI18n()

  if (mentions.length === 0) {
    return (
      <div className="p-4">
        <EmptyState title={dictionary.app.assetMentions} message={dictionary.app.assetMentionsEmpty} />
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      {mentions.map((mention) => (
        <SectionCard
          key={mention.id}
          title={mention.title}
          eyebrow={mention.relationLabel}
          actions={
            <Badge tone={mention.targetScope === 'scene' ? 'accent' : 'neutral'}>
              {mention.targetScope === 'scene' ? dictionary.common.scene : dictionary.common.chapter}
            </Badge>
          }
        >
          <p className="text-sm leading-6 text-text-muted">{mention.excerpt}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {mention.handoffActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => {
                  if (action.targetScope === 'scene') {
                    onOpenScene(action.targetId, action.lens)
                    return
                  }

                  onOpenChapter(action.targetId, action.lens)
                }}
                className="rounded-md border border-line-soft px-3 py-2 text-sm text-text-main hover:bg-surface-2"
              >
                {action.label}
              </button>
            ))}
          </div>
        </SectionCard>
      ))}
    </div>
  )
}
