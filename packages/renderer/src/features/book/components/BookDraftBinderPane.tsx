import { Badge } from '@/components/ui/Badge'
import { PaneHeader } from '@/components/ui/PaneHeader'

import type { BookDraftWorkspaceViewModel } from '../types/book-draft-view-models'
import { useI18n } from '@/app/i18n'

interface BookDraftBinderPaneProps {
  workspace: BookDraftWorkspaceViewModel
  onSelectChapter?: (chapterId: string) => void
  onOpenChapter?: (chapterId: string, lens: 'structure' | 'draft') => void
}

function getChapterLabel(locale: 'en' | 'zh-CN', order: number) {
  return locale === 'zh-CN' ? `第 ${order} 章` : `Chapter ${order}`
}

function getWordCountLabel(locale: 'en' | 'zh-CN', count: number) {
  return locale === 'zh-CN' ? `${count} 词` : `${count} words`
}

export function BookDraftBinderPane({ workspace, onSelectChapter, onOpenChapter }: BookDraftBinderPaneProps) {
  const { locale } = useI18n()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PaneHeader
        title={locale === 'zh-CN' ? '章节' : 'Chapters'}
        description={
          locale === 'zh-CN'
            ? '保持 route.selectedChapterId 作为唯一章节焦点真源。'
            : 'Keep route.selectedChapterId as the single selected chapter truth.'
        }
      />
      <div className="min-h-0 flex-1 space-y-3 overflow-auto p-3">
        <ul className="space-y-2">
          {workspace.chapters.map((chapter) => {
            const active = chapter.chapterId === workspace.selectedChapterId

            return (
              <li key={chapter.chapterId}>
                <div
                  className={`rounded-md border px-3 py-3 transition-colors ${
                    active ? 'border-line-strong bg-surface-1 shadow-sm' : 'border-line-soft bg-surface-2/80'
                  }`}
                >
                  <button
                    type="button"
                    aria-pressed={active}
                    aria-label={`${getChapterLabel(locale, chapter.order)} ${chapter.title}`}
                    onClick={() => onSelectChapter?.(chapter.chapterId)}
                    className="w-full rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                  >
                    <span className="block text-[11px] uppercase tracking-[0.08em] text-text-soft">
                      {getChapterLabel(locale, chapter.order)}
                    </span>
                    <span className="mt-1 block text-base text-text-main">{chapter.title}</span>
                    <span className="mt-2 block text-sm leading-6 text-text-muted">{chapter.summary}</span>
                    <span className="mt-3 flex flex-wrap gap-2">
                      <Badge tone="neutral">{getWordCountLabel(locale, chapter.assembledWordCount)}</Badge>
                      <Badge tone={chapter.missingDraftCount > 0 ? 'warn' : 'success'}>
                        {locale === 'zh-CN' ? `缺稿 ${chapter.missingDraftCount}` : `Missing ${chapter.missingDraftCount}`}
                      </Badge>
                      <Badge tone={chapter.missingTraceSceneCount > 0 ? 'warn' : 'success'}>
                        {locale === 'zh-CN' ? `缺溯源 ${chapter.missingTraceSceneCount}` : `Missing trace ${chapter.missingTraceSceneCount}`}
                      </Badge>
                      {chapter.warningsCount > 0 ? (
                        <Badge tone="warn">{locale === 'zh-CN' ? `警告 ${chapter.warningsCount}` : `Warn ${chapter.warningsCount}`}</Badge>
                      ) : null}
                      {chapter.queuedRevisionCount > 0 ? (
                        <Badge tone="accent">{locale === 'zh-CN' ? `修订 ${chapter.queuedRevisionCount}` : `Queue ${chapter.queuedRevisionCount}`}</Badge>
                      ) : null}
                    </span>
                  </button>
                  <div className="mt-3 flex flex-wrap justify-end gap-1.5 border-t border-line-soft pt-2">
                    <button
                      type="button"
                      aria-label={`${locale === 'zh-CN' ? '在 Draft 中打开' : 'Open in Draft'}: ${chapter.title}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        onOpenChapter?.(chapter.chapterId, 'draft')
                      }}
                      className="rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-1 hover:text-text-main"
                    >
                      {locale === 'zh-CN' ? '在 Draft 中打开' : 'Open in Draft'}
                    </button>
                    <button
                      type="button"
                      aria-label={`${locale === 'zh-CN' ? '在 Structure 中打开' : 'Open in Structure'}: ${chapter.title}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        onOpenChapter?.(chapter.chapterId, 'structure')
                      }}
                      className="rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-1 hover:text-text-main"
                    >
                      {locale === 'zh-CN' ? '在 Structure 中打开' : 'Open in Structure'}
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
