import { Badge } from '@/components/ui/Badge'
import { FactList } from '@/components/ui/FactList'
import { PaneHeader } from '@/components/ui/PaneHeader'

import { useI18n } from '@/app/i18n'
import type { BookDraftInspectorViewModel } from '../types/book-draft-view-models'

interface BookDraftInspectorPaneProps {
  bookTitle: string
  inspector: BookDraftInspectorViewModel
}

export function BookDraftInspectorPane({ bookTitle, inspector }: BookDraftInspectorPaneProps) {
  const { locale } = useI18n()
  const selectedChapter = inspector.selectedChapter

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
