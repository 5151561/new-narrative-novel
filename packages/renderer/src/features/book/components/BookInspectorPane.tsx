import { Badge } from '@/components/ui/Badge'
import { FactList } from '@/components/ui/FactList'
import { PaneHeader } from '@/components/ui/PaneHeader'

import { useI18n } from '@/app/i18n'
import type { BookStructureInspectorViewModel } from '../types/book-view-models'

interface BookInspectorPaneProps {
  bookTitle: string
  inspector: BookStructureInspectorViewModel
}

export function BookInspectorPane({ bookTitle, inspector }: BookInspectorPaneProps) {
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
                  <Badge tone={selectedChapter.coverageStatus === 'ready' ? 'success' : selectedChapter.coverageStatus === 'attention' ? 'warn' : 'danger'}>
                    {selectedChapter.coverageStatus}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                {selectedChapter?.summary ??
                  (locale === 'zh-CN'
                    ? '当前还没有选中章节。'
                    : 'No chapter is selected yet.')}
              </p>
              {selectedChapter?.primaryAssemblyHintLabel ? (
                <p className="mt-2 text-sm text-text-main">{selectedChapter.primaryAssemblyHintLabel}</p>
              ) : null}
            </div>
          </div>
        </section>
        <section className="rounded-md border border-line-soft bg-surface-2 p-4">
          <h4 className="text-base text-text-main">{locale === 'zh-CN' ? '书籍总览' : 'Book Overview'}</h4>
          <div className="mt-3">
            <FactList
              items={[
                { id: 'chapters', label: locale === 'zh-CN' ? '章节数' : 'Chapters', value: `${inspector.overview.chapterCount}` },
                { id: 'scenes', label: locale === 'zh-CN' ? '场景数' : 'Scenes', value: `${inspector.overview.sceneCount}` },
                { id: 'words', label: locale === 'zh-CN' ? '装配字数' : 'Assembled words', value: `${inspector.overview.assembledWordCount}` },
                { id: 'warnings', label: locale === 'zh-CN' ? '警告' : 'Warnings', value: `${inspector.overview.warningsCount}` },
              ]}
            />
          </div>
        </section>
        <section className="rounded-md border border-line-soft bg-surface-2 p-4">
          <h4 className="text-base text-text-main">{locale === 'zh-CN' ? '准备度信号' : 'Readiness Signals'}</h4>
          <ul className="mt-3 space-y-3">
            {inspector.riskHighlights.map((highlight) => (
              <li key={`${highlight.chapterId}-${highlight.kind}`} className="rounded-md border border-line-soft bg-surface-1 p-3">
                <p className="font-medium text-text-main">{highlight.label}</p>
                <p className="mt-1 text-sm leading-6 text-text-muted">{highlight.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
