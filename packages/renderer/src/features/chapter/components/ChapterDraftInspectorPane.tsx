import { useI18n } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FactList } from '@/components/ui/FactList'
import { PaneHeader } from '@/components/ui/PaneHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { TraceabilityAssetChips } from '@/features/traceability/components/TraceabilityAssetChips'

import type { ChapterDraftInspectorViewModel } from '../types/chapter-draft-view-models'

interface ChapterDraftInspectorPaneProps {
  chapterTitle: string
  chapterSummary: string
  inspector: ChapterDraftInspectorViewModel
  selectedSceneTraceabilityLoading?: boolean
  chapterCoverageLoading?: boolean
  traceabilityError?: Error | null
  onOpenAsset?: (assetId: string) => void
}

function formatMetric(locale: 'en' | 'zh-CN', label: string, value?: number) {
  if (value === undefined) {
    return locale === 'zh-CN' ? `${label}：无` : `${label}: n/a`
  }

  return locale === 'zh-CN' ? `${label}：${value}` : `${label}: ${value}`
}

export function ChapterDraftInspectorPane({
  chapterTitle,
  chapterSummary,
  inspector,
  selectedSceneTraceabilityLoading = false,
  chapterCoverageLoading = false,
  traceabilityError = null,
  onOpenAsset,
}: ChapterDraftInspectorPaneProps) {
  const { locale, dictionary } = useI18n()
  const selectedScene = inspector.selectedScene
  const selectedTrace = inspector.selectedSceneTraceability ?? null
  const traceCoverage = inspector.chapterTraceCoverage ?? null

  const renderTraceLoadingState = (title: string, message: string) => (
    <EmptyState title={title} message={message} />
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PaneHeader title={selectedScene?.title ?? chapterTitle} description={chapterSummary} />
      <div className="min-h-0 flex-1 space-y-3 overflow-auto p-4">
        <SectionCard title={locale === 'zh-CN' ? '选中章节段落' : 'Selected section'} eyebrow={locale === 'zh-CN' ? '当前焦点' : 'Current Focus'}>
          {selectedScene ? (
            <div className="space-y-4">
              <div className="rounded-md border border-line-soft bg-surface-2 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-text-main">{selectedScene.title}</p>
                    <p className="mt-2 text-sm leading-6 text-text-muted">{selectedScene.summary}</p>
                  </div>
                  <Badge tone={selectedScene.warningsCount > 0 ? 'warn' : 'success'}>{selectedScene.proseStatusLabel}</Badge>
                </div>
              </div>
              <FactList
                items={[
                  {
                    id: 'draft-word-count',
                    label: locale === 'zh-CN' ? '字数' : 'Draft words',
                    value: formatMetric(locale, locale === 'zh-CN' ? '章节稿' : 'Draft', selectedScene.draftWordCount),
                  },
                  {
                    id: 'queued-revisions',
                    label: locale === 'zh-CN' ? '待处理修订' : 'Queued revisions',
                    value: `${selectedScene.revisionQueueCount ?? 0}`,
                  },
                  {
                    id: 'warnings',
                    label: locale === 'zh-CN' ? '警告' : 'Warnings',
                    value: `${selectedScene.warningsCount}`,
                  },
                  {
                    id: 'prose-status',
                    label: locale === 'zh-CN' ? '正文状态' : 'Prose status',
                    value: selectedScene.proseStatusLabel,
                  },
                ]}
              />
              {selectedScene.latestDiffSummary ? (
                <div className="rounded-md border border-line-soft bg-surface-2 p-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{locale === 'zh-CN' ? '最近差异' : 'Latest diff'}</p>
                  <p className="mt-2 text-sm leading-6 text-text-muted">{selectedScene.latestDiffSummary}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </SectionCard>
        <SectionCard title={locale === 'zh-CN' ? '来源事实' : 'Source facts'} eyebrow={locale === 'zh-CN' ? 'Traceability' : 'Traceability'}>
          {traceabilityError ? (
            <EmptyState title={locale === 'zh-CN' ? '来源链不可用' : 'Traceability unavailable'} message={traceabilityError.message} />
          ) : selectedSceneTraceabilityLoading ? (
            renderTraceLoadingState(
              locale === 'zh-CN' ? '正在加载来源事实' : 'Loading source facts',
              locale === 'zh-CN'
                ? '正在组合 accepted facts、proposal count 和 latest patch。'
                : 'Combining accepted facts, proposal counts, and the latest patch.',
            )
          ) : selectedTrace ? (
            <div className="space-y-3">
              {selectedTrace.acceptedFacts.length > 0 ? (
                <div className="space-y-2">
                  {selectedTrace.acceptedFacts.map((fact) => (
                    <div key={fact.id} className="rounded-md border border-line-soft bg-surface-2 p-3">
                      <p className="text-sm font-medium text-text-main">{fact.label}</p>
                      <p className="mt-1 text-sm leading-6 text-text-muted">{fact.value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={locale === 'zh-CN' ? '还没有来源事实' : 'No source facts yet'}
                  message={
                    locale === 'zh-CN'
                      ? '当前 section 还没有可展示的 accepted facts。'
                      : 'No accepted facts are linked to this section yet.'
                  }
                />
              )}
              <FactList
                items={[
                  {
                    id: 'source-proposal-count',
                    label: locale === 'zh-CN' ? '来源 proposals' : 'Source proposals',
                    value: `${selectedTrace.sourceProposalCount}`,
                  },
                  {
                    id: 'latest-patch-summary',
                    label: locale === 'zh-CN' ? '最新 patch' : 'Latest patch',
                    value: selectedTrace.latestPatchSummary ?? (locale === 'zh-CN' ? '暂无' : 'n/a'),
                  },
                ]}
              />
              {selectedTrace.latestDiffSummary ? (
                <div className="rounded-md border border-line-soft bg-surface-2 p-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{locale === 'zh-CN' ? '最近差异' : 'Latest diff'}</p>
                  <p className="mt-2 text-sm leading-6 text-text-muted">{selectedTrace.latestDiffSummary}</p>
                </div>
              ) : null}
              {selectedTrace.missingLinks.length > 0 ? (
                <div className="rounded-md border border-dashed border-line-strong bg-surface-2 p-3">
                  <p className="text-sm leading-6 text-text-muted">
                    {locale === 'zh-CN'
                      ? `缺少 trace links: ${selectedTrace.missingLinks.join(', ')}`
                      : `Missing trace links: ${selectedTrace.missingLinks.join(', ')}`}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyState
              title={locale === 'zh-CN' ? '选中段落还没有来源链' : 'No traceability for this section yet'}
              message={
                locale === 'zh-CN'
                  ? '当前 section 还没有完整的 traceability metadata。'
                  : 'This section does not have complete traceability metadata yet.'
              }
            />
          )}
        </SectionCard>
        <SectionCard title={locale === 'zh-CN' ? '关联资产' : 'Related assets'} eyebrow={locale === 'zh-CN' ? 'Asset handoff' : 'Asset handoff'}>
          {traceabilityError ? (
            <EmptyState title={locale === 'zh-CN' ? '资产跳转不可用' : 'Asset handoff unavailable'} message={traceabilityError.message} />
          ) : selectedSceneTraceabilityLoading ? (
            renderTraceLoadingState(
              locale === 'zh-CN' ? '正在加载关联资产' : 'Loading related assets',
              locale === 'zh-CN'
                ? '正在准备 asset profile handoff。'
                : 'Preparing the asset profile handoff.',
            )
          ) : selectedTrace ? (
            <TraceabilityAssetChips assets={selectedTrace.relatedAssets} onOpenAsset={(assetId) => onOpenAsset?.(assetId)} />
          ) : (
            <EmptyState
              title={locale === 'zh-CN' ? '还没有关联资产' : 'No related assets yet'}
              message={
                locale === 'zh-CN'
                  ? '当前 section 还没有 asset trace links。'
                  : 'This section does not have asset trace links yet.'
              }
            />
          )}
        </SectionCard>
        <SectionCard title={locale === 'zh-CN' ? '章节 trace 覆盖' : 'Chapter trace coverage'} eyebrow={locale === 'zh-CN' ? '阅读支持' : 'Reading Support'}>
          {traceabilityError ? (
            <EmptyState title={locale === 'zh-CN' ? '覆盖摘要不可用' : 'Coverage unavailable'} message={traceabilityError.message} />
          ) : chapterCoverageLoading ? (
            renderTraceLoadingState(
              locale === 'zh-CN' ? '正在统计覆盖情况' : 'Loading coverage',
              locale === 'zh-CN'
                ? '正在统计 traced scenes、missing trace 和 asset link 缺口。'
                : 'Counting traced scenes, missing trace, and asset-link gaps.',
            )
          ) : traceCoverage ? (
            <div className="space-y-3">
              <FactList
                items={[
                  {
                    id: 'traced-scenes',
                    label: locale === 'zh-CN' ? '已追踪场景' : 'Traced scenes',
                    value: `${traceCoverage.tracedSceneCount}`,
                  },
                  {
                    id: 'missing-trace-scenes',
                    label: locale === 'zh-CN' ? '缺失来源链' : 'Missing trace',
                    value: `${traceCoverage.missingTraceSceneCount}`,
                  },
                  {
                    id: 'missing-asset-scenes',
                    label: locale === 'zh-CN' ? '缺失资产链接' : 'Missing asset links',
                    value: `${traceCoverage.sceneIdsMissingAssets.length}`,
                  },
                ]}
              />
              {traceCoverage.sceneIdsMissingTrace.length > 0 ? (
                <div className="rounded-md border border-line-soft bg-surface-2 p-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{locale === 'zh-CN' ? '缺失来源链的场景' : 'Scenes missing trace'}</p>
                  <p className="mt-2 text-sm leading-6 text-text-muted">{traceCoverage.sceneIdsMissingTrace.join(', ')}</p>
                </div>
              ) : null}
              {traceCoverage.sceneIdsMissingAssets.length > 0 ? (
                <div className="rounded-md border border-line-soft bg-surface-2 p-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{locale === 'zh-CN' ? '缺失资产链接的场景' : 'Scenes missing assets'}</p>
                  <p className="mt-2 text-sm leading-6 text-text-muted">{traceCoverage.sceneIdsMissingAssets.join(', ')}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyState
              title={locale === 'zh-CN' ? '还没有章节 trace 覆盖' : 'No chapter trace coverage yet'}
              message={
                locale === 'zh-CN'
                  ? '等 chapter traceability query 完成后，这里会显示 coverage 概览。'
                  : 'Coverage will appear here once the chapter traceability query completes.'
              }
            />
          )}
        </SectionCard>
        <SectionCard title={dictionary.app.chapterReadiness} eyebrow={locale === 'zh-CN' ? '阅读支持' : 'Reading Support'}>
          <FactList
            items={[
              {
                id: 'drafted-scenes',
                label: locale === 'zh-CN' ? '已起草场景' : 'Drafted scenes',
                value: `${inspector.chapterReadiness.draftedSceneCount}`,
              },
              {
                id: 'missing-drafts',
                label: locale === 'zh-CN' ? '缺稿场景' : 'Missing drafts',
                value: `${inspector.chapterReadiness.missingDraftCount}`,
              },
              {
                id: 'assembled-word-count',
                label: locale === 'zh-CN' ? '合计字数' : 'Assembled words',
                value: `${inspector.chapterReadiness.assembledWordCount}`,
              },
              {
                id: 'warnings-attention',
                label: locale === 'zh-CN' ? '警告 / 修订' : 'Warnings / Queue',
                value: `${inspector.chapterReadiness.warningsCount} / ${inspector.chapterReadiness.queuedRevisionCount}`,
              },
            ]}
          />
        </SectionCard>
      </div>
    </div>
  )
}
