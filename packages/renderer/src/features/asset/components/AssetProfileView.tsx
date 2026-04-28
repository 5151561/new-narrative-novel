import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FactList } from '@/components/ui/FactList'
import { SectionCard } from '@/components/ui/SectionCard'
import { TimelineList } from '@/components/ui/TimelineList'
import { useI18n } from '@/app/i18n'
import type { ChapterLens, SceneLens } from '@/features/workbench/types/workbench-route'

import type { AssetProfileViewModel, AssetStoryBibleViewModel } from '../types/asset-view-models'

interface AssetProfileViewProps {
  profile: AssetProfileViewModel
  storyBible: AssetStoryBibleViewModel
  onOpenScene?: (sceneId: string, lens: Extract<SceneLens, 'draft' | 'orchestrate'>) => void
  onOpenChapter?: (chapterId: string, lens: Extract<ChapterLens, 'structure' | 'draft'>) => void
}

export function AssetProfileView({
  profile,
  storyBible,
  onOpenScene,
  onOpenChapter,
}: AssetProfileViewProps) {
  const { dictionary, locale } = useI18n()
  const canonFactsTitle = locale === 'zh-CN' ? '正典事实' : 'Canon Facts'
  const canonFactsEmpty = locale === 'zh-CN' ? '这个资产暂时没有正典事实。' : 'No canon facts are available for this asset.'
  const privateFactsTitle = locale === 'zh-CN' ? '私密事实' : 'Private Facts'
  const privateFactsEmpty =
    locale === 'zh-CN'
      ? '当前可见性上下文里，私密或剧透事实保持遮蔽。'
      : 'Private or spoiler facts are currently redacted in this visibility context.'
  const timelineTitle = locale === 'zh-CN' ? '状态时间线' : 'State Timeline'
  const timelineEyebrow = locale === 'zh-CN' ? '连续性' : 'Continuity'
  const timelineEmpty = locale === 'zh-CN' ? '这个资产暂时没有时间线条目。' : 'No timeline entries are available for this asset yet.'
  const sourceLabel = locale === 'zh-CN' ? '来源' : 'Source'
  const reviewedLabel = locale === 'zh-CN' ? '最近审阅' : 'Reviewed'

  return (
    <div className="space-y-4 p-4">
      {profile.sections.map((section) => (
        <SectionCard key={section.id} title={section.title} eyebrow={dictionary.app.assetProfileEyebrow}>
          <FactList
            items={section.facts.map((fact) => ({
              id: fact.id,
              label: fact.label,
              value: fact.value,
            }))}
          />
        </SectionCard>
      ))}
      <SectionCard title={canonFactsTitle} eyebrow={dictionary.app.assetProfileEyebrow}>
        {storyBible.canonFacts.length > 0 ? (
          <div className="space-y-3">
            {storyBible.canonFacts.map((fact) => (
              <article key={fact.id} className="rounded-md border border-line-soft bg-surface-2 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h5 className="text-sm font-medium text-text-main">{fact.label}</h5>
                    <p className="text-sm leading-6 text-text-muted">{fact.value}</p>
                  </div>
                  <Badge tone="neutral">{fact.visibilityLabel}</Badge>
                </div>
                <FactList
                  items={[
                    {
                      id: `${fact.id}-sources`,
                      label: sourceLabel,
                      value: fact.sourceRefs.map((sourceRef) => sourceRef.label).join(', '),
                    },
                    {
                      id: `${fact.id}-reviewed`,
                      label: reviewedLabel,
                      value: fact.lastReviewedAtLabel,
                    },
                  ]}
                />
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title={canonFactsTitle}
            message={canonFactsEmpty}
            className="min-h-0"
          />
        )}
      </SectionCard>
      <SectionCard title={privateFactsTitle} eyebrow={locale === 'zh-CN' ? '可见性' : 'Visibility'}>
        {storyBible.privateFacts.length > 0 ? (
          <div className="space-y-3">
            {storyBible.privateFacts.map((fact) => (
              <article key={fact.id} className="rounded-md border border-line-soft bg-surface-2 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h5 className="text-sm font-medium text-text-main">{fact.label}</h5>
                    <p className="text-sm leading-6 text-text-muted">{fact.value}</p>
                  </div>
                  <Badge tone="warn">{fact.visibilityLabel}</Badge>
                </div>
                <FactList
                  items={[
                    {
                      id: `${fact.id}-sources`,
                      label: sourceLabel,
                      value: fact.sourceRefs.map((sourceRef) => sourceRef.label).join(', '),
                    },
                    {
                      id: `${fact.id}-reviewed`,
                      label: reviewedLabel,
                      value: fact.lastReviewedAtLabel,
                    },
                  ]}
                />
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title={privateFactsTitle}
            message={privateFactsEmpty}
            className="min-h-0"
          />
        )}
      </SectionCard>
      <SectionCard title={timelineTitle} eyebrow={timelineEyebrow}>
        {storyBible.stateTimeline.length > 0 ? (
          <TimelineList
            items={storyBible.stateTimeline.map((entry) => ({
              id: entry.id,
              title: entry.label,
              detail: `${entry.summary} ${entry.sourceRefs.length > 0 ? `Sources: ${entry.sourceRefs.map((sourceRef) => sourceRef.label).join(', ')}` : ''}`.trim(),
              meta: entry.statusLabel,
              tone:
                entry.statusLabel.toLowerCase().includes('risk')
                  ? 'warn'
                  : entry.statusLabel.toLowerCase().includes('spoiler')
                    ? 'danger'
                    : entry.statusLabel.toLowerCase().includes('watch')
                      ? 'accent'
                      : 'success',
              trailing:
                onOpenScene || onOpenChapter ? (
                  <div className="flex flex-col items-end gap-2">
                    {onOpenScene ? (
                      <button
                        type="button"
                        onClick={() => onOpenScene(entry.sceneId, 'draft')}
                        className="rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-1 hover:text-text-main"
                      >
                        {dictionary.common.scene ?? 'Scene'}
                      </button>
                    ) : null}
                    {onOpenChapter ? (
                      <button
                        type="button"
                        onClick={() => onOpenChapter(entry.chapterId, 'draft')}
                        className="rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-1 hover:text-text-main"
                      >
                        {dictionary.common.chapter ?? 'Chapter'}
                      </button>
                    ) : null}
                  </div>
                ) : null,
            }))}
          />
        ) : (
          <EmptyState
            title={timelineTitle}
            message={timelineEmpty}
            className="min-h-0"
          />
        )}
      </SectionCard>
    </div>
  )
}
