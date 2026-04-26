import { Badge } from '@/components/ui/Badge'
import { PaneHeader } from '@/components/ui/PaneHeader'

import { useI18n } from '@/app/i18n'
import type { BookStructureChapterViewModel } from '../types/book-view-models'

interface BookNavigatorPaneProps {
  chapters: BookStructureChapterViewModel[]
  selectedChapterId: string | null
  onSelectChapter?: (chapterId: string) => void
  onOpenChapter?: (chapterId: string, lens: 'structure' | 'draft') => void
}

function getChapterLabel(locale: 'en' | 'zh-CN', order: number) {
  return locale === 'zh-CN' ? `第 ${order} 章` : `Chapter ${order}`
}

function getMissingLabel(locale: 'en' | 'zh-CN', noun: 'draft' | 'trace', count: number) {
  if (locale === 'zh-CN') {
    return noun === 'draft' ? `缺正文 ${count}` : `缺溯源 ${count}`
  }

  return noun === 'draft' ? `Missing draft ${count}` : `Missing trace ${count}`
}

function getCoverageLabel(locale: 'en' | 'zh-CN', coverageStatus: BookStructureChapterViewModel['coverageStatus']) {
  if (locale === 'zh-CN') {
    return coverageStatus === 'ready' ? '已就绪' : coverageStatus === 'attention' ? '需关注' : '缺失'
  }

  return coverageStatus === 'ready' ? 'Ready' : coverageStatus === 'attention' ? 'Attention' : 'Missing'
}

export function BookNavigatorPane({
  chapters,
  selectedChapterId,
  onSelectChapter,
  onOpenChapter,
}: BookNavigatorPaneProps) {
  const { locale } = useI18n()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PaneHeader
        title={locale === 'zh-CN' ? '章节' : 'Chapters'}
      />
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <ul className="space-y-3">
          {chapters.map((chapter) => {
            const active = chapter.chapterId === selectedChapterId

            return (
              <li key={chapter.chapterId}>
                <div
                  className={`rounded-md border p-3 transition-colors ${
                    active ? 'border-line-strong bg-surface-1' : 'border-line-soft bg-surface-2'
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
                      <Badge tone={chapter.unresolvedCount > 0 ? 'warn' : 'success'}>
                        {locale === 'zh-CN' ? `未决 ${chapter.unresolvedCount}` : `Unresolved ${chapter.unresolvedCount}`}
                      </Badge>
                      <Badge tone={chapter.missingDraftCount > 0 ? 'warn' : 'success'}>
                        {getMissingLabel(locale, 'draft', chapter.missingDraftCount)}
                      </Badge>
                      <Badge tone={chapter.missingTraceSceneCount > 0 ? 'warn' : 'success'}>
                        {getMissingLabel(locale, 'trace', chapter.missingTraceSceneCount)}
                      </Badge>
                      <Badge tone={chapter.coverageStatus === 'ready' ? 'success' : chapter.coverageStatus === 'attention' ? 'warn' : 'danger'}>
                        {getCoverageLabel(locale, chapter.coverageStatus)}
                      </Badge>
                    </span>
                    {chapter.primaryProblemLabel ? (
                      <span className="mt-3 block text-sm text-text-main">{chapter.primaryProblemLabel}</span>
                    ) : null}
                  </button>
                  {onOpenChapter ? (
                    <div className="mt-3 flex flex-wrap justify-end gap-1.5 border-t border-line-soft pt-2">
                      <button
                        type="button"
                        aria-label={`${locale === 'zh-CN' ? '在 Structure 中打开' : 'Open in Structure'}: ${chapter.title}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          onOpenChapter(chapter.chapterId, 'structure')
                        }}
                        className="rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-1 hover:text-text-main"
                      >
                        {locale === 'zh-CN' ? '在 Structure 中打开' : 'Open in Structure'}
                      </button>
                      <button
                        type="button"
                        aria-label={`${locale === 'zh-CN' ? '在 Draft 中打开' : 'Open in Draft'}: ${chapter.title}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          onOpenChapter(chapter.chapterId, 'draft')
                        }}
                        className="rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-1 hover:text-text-main"
                      >
                        {locale === 'zh-CN' ? '在 Draft 中打开' : 'Open in Draft'}
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
