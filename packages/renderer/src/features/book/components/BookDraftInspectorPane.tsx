import { Badge } from '@/components/ui/Badge'
import { FactList } from '@/components/ui/FactList'
import { PaneHeader } from '@/components/ui/PaneHeader'

import { useI18n } from '@/app/i18n'
import type { BookDraftView } from '@/features/workbench/types/workbench-route'

import { buildCompareReviewAttention } from '../lib/book-draft-compare-presentation'
import type { BookManuscriptCompareWorkspaceViewModel } from '../types/book-compare-view-models'
import type { BookDraftInspectorViewModel } from '../types/book-draft-view-models'

interface BookDraftInspectorPaneProps {
  bookTitle: string
  inspector: BookDraftInspectorViewModel
  activeDraftView?: BookDraftView
  compare?: BookManuscriptCompareWorkspaceViewModel | null
  checkpointMeta?: {
    title: string
    createdAtLabel: string
    summary: string
  } | null
}

export function BookDraftInspectorPane({
  bookTitle,
  inspector,
  activeDraftView = 'read',
  compare = null,
  checkpointMeta = null,
}: BookDraftInspectorPaneProps) {
  const { locale } = useI18n()
  const selectedChapter = inspector.selectedChapter
  const compareSelectedChapter = compare?.selectedChapter ?? null
  const compareAttention = buildCompareReviewAttention(compareSelectedChapter)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PaneHeader title={selectedChapter?.title ?? bookTitle} description={bookTitle} />
      <div className="min-h-0 flex-1 space-y-3 overflow-auto p-4">
        <section className="rounded-md border border-line-soft bg-surface-2 p-4">
          <h4 className="text-base text-text-main">{locale === 'zh-CN' ? '选中章节' : 'Selected Chapter'}</h4>
          <div className="mt-3 space-y-3">
            <div className="rounded-md border border-line-soft bg-surface-1 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-text-main">{selectedChapter?.title ?? bookTitle}</p>
                {selectedChapter ? (
                  <Badge tone={selectedChapter.missingDraftCount > 0 || selectedChapter.missingTraceSceneCount > 0 ? 'warn' : 'success'}>
                    {selectedChapter.missingDraftCount > 0 || selectedChapter.missingTraceSceneCount > 0
                      ? locale === 'zh-CN'
                        ? '需关注'
                        : 'Attention'
                      : locale === 'zh-CN'
                        ? '已就绪'
                        : 'Ready'}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                {selectedChapter?.summary ??
                  (locale === 'zh-CN' ? '当前还没有选中章节。' : 'No chapter is selected yet.')}
              </p>
              {selectedChapter?.topLatestDiffSummary ? (
                <p className="mt-2 text-sm text-text-main">{selectedChapter.topLatestDiffSummary}</p>
              ) : null}
            </div>
            {selectedChapter ? (
              <FactList
                items={[
                  { id: 'drafted-scenes', label: locale === 'zh-CN' ? '已起草场景' : 'Drafted scenes', value: `${selectedChapter.draftedSceneCount}` },
                  { id: 'missing-scenes', label: locale === 'zh-CN' ? '缺稿场景' : 'Missing drafts', value: `${selectedChapter.missingDraftCount}` },
                  { id: 'trace-scenes', label: locale === 'zh-CN' ? '缺溯源场景' : 'Missing trace', value: `${selectedChapter.missingTraceSceneCount}` },
                  { id: 'words', label: locale === 'zh-CN' ? '装配字数' : 'Assembled words', value: `${selectedChapter.assembledWordCount}` },
                ]}
              />
            ) : null}
          </div>
        </section>
        {activeDraftView === 'compare' && compareSelectedChapter ? (
          <>
            <section className="rounded-md border border-line-soft bg-surface-2 p-4">
              <h4 className="text-base text-text-main">{locale === 'zh-CN' ? '选中章节 Compare 摘要' : 'Selected chapter compare summary'}</h4>
              <div className="mt-3">
                <FactList
                  items={[
                    { id: 'compare-changed-scenes', label: locale === 'zh-CN' ? '变更场景' : 'Changed scenes', value: `${compareSelectedChapter.totals.changedCount}` },
                    { id: 'compare-added-scenes', label: locale === 'zh-CN' ? '新增场景' : 'Added scenes', value: `${compareSelectedChapter.totals.addedCount}` },
                    { id: 'compare-missing-scenes', label: locale === 'zh-CN' ? '缺失场景' : 'Missing scenes', value: `${compareSelectedChapter.totals.missingCount}` },
                    { id: 'compare-word-delta', label: locale === 'zh-CN' ? '字数变化' : 'Word delta', value: `${compareSelectedChapter.wordDelta > 0 ? '+' : ''}${compareSelectedChapter.wordDelta}` },
                    { id: 'compare-trace-regression', label: locale === 'zh-CN' ? '溯源回退' : 'Trace regressions', value: `${compareSelectedChapter.traceRegressionCount}` },
                    { id: 'compare-warnings-delta', label: locale === 'zh-CN' ? '警告变化' : 'Warnings delta', value: `${compareSelectedChapter.warningsDelta > 0 ? '+' : ''}${compareSelectedChapter.warningsDelta}` },
                  ]}
                />
              </div>
            </section>
            <section className="rounded-md border border-line-soft bg-surface-2 p-4">
              <h4 className="text-base text-text-main">{locale === 'zh-CN' ? 'Checkpoint' : 'Checkpoint'}</h4>
              <div className="mt-3 rounded-md border border-line-soft bg-surface-1 p-3">
                <p className="text-sm font-medium text-text-main">{checkpointMeta?.title ?? compare.checkpoint.title}</p>
                <p className="mt-2 text-sm text-text-muted">{checkpointMeta?.createdAtLabel ?? compare.checkpoint.createdAtLabel}</p>
                <p className="mt-2 text-sm leading-6 text-text-muted">{checkpointMeta?.summary ?? compare.checkpoint.summary}</p>
              </div>
            </section>
            <section className="rounded-md border border-line-soft bg-surface-2 p-4">
              <h4 className="text-base text-text-main">{locale === 'zh-CN' ? '复核关注点' : 'Review attention'}</h4>
              <div className="mt-3 space-y-3">
                <div className="rounded-md border border-line-soft bg-surface-1 p-3">
                  <p className="text-sm font-medium text-text-main">{locale === 'zh-CN' ? '主要变化场景' : 'Top changed scenes'}</p>
                  <p className="mt-2 text-sm leading-6 text-text-muted">
                    {compareAttention.topChangedScenes.length
                      ? compareAttention.topChangedScenes.join(locale === 'zh-CN' ? '、' : ', ')
                      : locale === 'zh-CN'
                        ? '当前没有突出变化场景。'
                        : 'No standout changed scenes are visible right now.'}
                  </p>
                </div>
                <div className="rounded-md border border-line-soft bg-surface-1 p-3">
                  <p className="text-sm font-medium text-text-main">{locale === 'zh-CN' ? '缺稿 / 缺失场景' : 'Missing draft scenes'}</p>
                  <p className="mt-2 text-sm leading-6 text-text-muted">
                    {compareAttention.missingScenes.length
                      ? compareAttention.missingScenes.join(locale === 'zh-CN' ? '、' : ', ')
                      : locale === 'zh-CN'
                        ? '当前没有缺稿或缺失场景。'
                        : 'No missing or draft-missing scenes are visible right now.'}
                  </p>
                </div>
                <div className="rounded-md border border-line-soft bg-surface-1 p-3">
                  <p className="text-sm font-medium text-text-main">{locale === 'zh-CN' ? '溯源回退提示' : 'Trace regression hints'}</p>
                  <p className="mt-2 text-sm leading-6 text-text-muted">
                    {compareAttention.traceRegressionHints.length
                      ? compareAttention.traceRegressionHints.join(locale === 'zh-CN' ? '、' : ', ')
                      : locale === 'zh-CN'
                        ? '当前没有溯源回退提示。'
                        : 'No trace regressions are currently visible.'}
                  </p>
                </div>
              </div>
            </section>
          </>
        ) : null}
        <section className="rounded-md border border-line-soft bg-surface-2 p-4">
          <h4 className="text-base text-text-main">{locale === 'zh-CN' ? '手稿准备度' : 'Manuscript Readiness'}</h4>
          <div className="mt-3">
            <FactList
              items={[
                { id: 'drafted-chapters', label: locale === 'zh-CN' ? '已起草章节' : 'Drafted chapters', value: `${inspector.readiness.draftedChapterCount}` },
                { id: 'missing-draft-chapters', label: locale === 'zh-CN' ? '缺稿章节' : 'Missing draft chapters', value: `${inspector.readiness.missingDraftChapterCount}` },
                { id: 'warnings', label: locale === 'zh-CN' ? '警告章节' : 'Warning-heavy chapters', value: `${inspector.readiness.warningHeavyChapterCount}` },
                { id: 'words-total', label: locale === 'zh-CN' ? '总字数' : 'Total words', value: `${inspector.readiness.assembledWordCount}` },
              ]}
            />
          </div>
        </section>
        <section className="rounded-md border border-line-soft bg-surface-2 p-4">
          <h4 className="text-base text-text-main">{locale === 'zh-CN' ? '章节信号' : 'Chapter Signals'}</h4>
          <div className="mt-3 space-y-3">
            <div className="rounded-md border border-line-soft bg-surface-1 p-3">
              <p className="text-sm font-medium text-text-main">{locale === 'zh-CN' ? '缺口' : 'Gaps'}</p>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                {inspector.signals.topMissingScenes.length > 0
                  ? inspector.signals.topMissingScenes.join(locale === 'zh-CN' ? '、' : ', ')
                  : locale === 'zh-CN'
                    ? '当前选中章节没有显式缺口。'
                    : 'No explicit chapter gaps are visible right now.'}
              </p>
            </div>
            <div className="rounded-md border border-line-soft bg-surface-1 p-3">
              <p className="text-sm font-medium text-text-main">{locale === 'zh-CN' ? '最近差异' : 'Latest diffs'}</p>
              <ul className="mt-2 space-y-2">
                {inspector.signals.latestDiffSummaries.length > 0 ? (
                  inspector.signals.latestDiffSummaries.map((summary, index) => (
                    <li key={`${index}-${summary}`} className="text-sm leading-6 text-text-muted">
                      {summary}
                    </li>
                  ))
                ) : (
                  <li className="text-sm leading-6 text-text-muted">
                    {locale === 'zh-CN' ? '当前没有额外差异摘要。' : 'No extra diff summaries are visible.'}
                  </li>
                )}
              </ul>
            </div>
            <div className="rounded-md border border-line-soft bg-surface-1 p-3">
              <p className="text-sm font-medium text-text-main">{locale === 'zh-CN' ? '溯源说明' : 'Trace note'}</p>
              <p className="mt-2 text-sm leading-6 text-text-muted">{inspector.signals.traceCoverageNote}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
