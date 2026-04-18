import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FactList } from '@/components/ui/FactList'
import { SectionCard } from '@/components/ui/SectionCard'
import { useI18n } from '@/app/i18n'
import type { ChapterLens, SceneLens } from '@/features/workbench/types/workbench-route'

import type { AssetMentionViewModel } from '../types/asset-view-models'

interface AssetMentionsViewProps {
  mentions: AssetMentionViewModel[]
  onOpenScene: (sceneId: string, lens: Extract<SceneLens, 'draft' | 'orchestrate'>) => void
  onOpenChapter: (chapterId: string, lens: Extract<ChapterLens, 'structure' | 'draft'>) => void
}

function getBackingTone(backingKind: NonNullable<AssetMentionViewModel['traceDetail']>['backingKind']) {
  if (backingKind === 'canon') {
    return 'success' as const
  }
  if (backingKind === 'draft_context') {
    return 'warn' as const
  }
  return 'neutral' as const
}

export function AssetMentionsView({ mentions, onOpenScene, onOpenChapter }: AssetMentionsViewProps) {
  const { dictionary, locale } = useI18n()

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
        (() => {
          const backingKind = mention.traceDetail?.backingKind ?? mention.backing?.kind ?? 'unlinked'
          const traceDetail = mention.traceDetail
          const traceFacts =
            traceDetail && traceDetail.factLabels.length > 0
              ? traceDetail.factLabels.join(', ')
              : locale === 'zh-CN'
                ? '暂无'
                : 'None yet'
          const traceProposals =
            traceDetail && traceDetail.proposalTitles.length > 0
              ? traceDetail.proposalTitles.join(', ')
              : locale === 'zh-CN'
                ? '暂无'
                : 'None yet'

          return (
        <SectionCard
          key={mention.id}
          title={mention.title}
          eyebrow={mention.relationLabel}
          actions={
            <>
              <Badge tone={mention.targetScope === 'scene' ? 'accent' : 'neutral'}>
                {mention.targetScope === 'scene' ? dictionary.common.scene : dictionary.common.chapter}
              </Badge>
              <Badge tone={getBackingTone(backingKind)}>
                {backingKind === 'canon'
                  ? 'Canon-backed'
                  : backingKind === 'draft_context'
                    ? 'Draft-context'
                    : 'Unlinked'}
              </Badge>
            </>
          }
        >
          <p className="text-sm leading-6 text-text-muted">{mention.excerpt}</p>
          <div className="mt-4 rounded-md border border-line-soft bg-surface-2 p-3">
            <p className="text-[11px] uppercase tracking-[0.05em] text-text-soft">
              {locale === 'zh-CN' ? '来源细节' : 'Trace detail'}
            </p>
            <div className="mt-3">
              {traceDetail ? (
                <FactList
                  items={[
                    {
                      id: `${mention.id}-facts`,
                      label: locale === 'zh-CN' ? 'Accepted facts' : 'Accepted facts',
                      value: traceFacts,
                    },
                    {
                      id: `${mention.id}-proposals`,
                      label: locale === 'zh-CN' ? 'Source proposals' : 'Source proposals',
                      value: traceProposals,
                    },
                    {
                      id: `${mention.id}-patch`,
                      label: locale === 'zh-CN' ? 'Source patch' : 'Source patch',
                      value: traceDetail.patchId ?? (locale === 'zh-CN' ? '暂无' : 'None'),
                    },
                    {
                      id: `${mention.id}-scene-trace`,
                      label: locale === 'zh-CN' ? '缺失场景来源链' : 'Missing scene trace',
                      value: traceDetail.sceneTraceMissing ? (locale === 'zh-CN' ? '是' : 'Yes') : (locale === 'zh-CN' ? '否' : 'No'),
                    },
                  ]}
                />
              ) : mention.traceDetailStatus ? (
                <EmptyState title={mention.traceDetailStatus.title} message={mention.traceDetailStatus.message} className="min-h-0" />
              ) : null}
            </div>
          </div>
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
          )
        })()
      ))}
    </div>
  )
}
