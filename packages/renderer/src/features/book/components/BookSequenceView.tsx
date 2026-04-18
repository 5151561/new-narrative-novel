import { Badge } from '@/components/ui/Badge'

import { useI18n } from '@/app/i18n'
import type { BookStructureChapterViewModel } from '../types/book-view-models'

interface BookSequenceViewProps {
  chapters: BookStructureChapterViewModel[]
  selectedChapterId: string | null
  onSelectChapter?: (chapterId: string) => void
  onOpenChapter?: (chapterId: string, lens: 'structure' | 'draft') => void
}

function getChapterLabel(locale: 'en' | 'zh-CN', order: number) {
  return locale === 'zh-CN' ? `第 ${order} 章` : `Chapter ${order}`
}

function getMetricLabel(locale: 'en' | 'zh-CN', kind: 'draft' | 'trace', count: number) {
  if (locale === 'zh-CN') {
    return kind === 'draft' ? `缺正文 ${count}` : `缺溯源 ${count}`
  }

  return kind === 'draft' ? `Missing draft ${count}` : `Missing trace ${count}`
}

export function BookSequenceView({
  chapters,
  selectedChapterId,
  onSelectChapter,
  onOpenChapter,
}: BookSequenceViewProps) {
  const { locale } = useI18n()

  return (
    <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
                aria-current={active ? 'true' : undefined}
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
                    {getMetricLabel(locale, 'draft', chapter.missingDraftCount)}
                  </Badge>
                  <Badge tone={chapter.missingTraceSceneCount > 0 ? 'warn' : 'success'}>
                    {getMetricLabel(locale, 'trace', chapter.missingTraceSceneCount)}
                  </Badge>
                </span>
                <span className="mt-3 grid gap-2 text-sm leading-6 text-text-muted">
                  <span>{locale === 'zh-CN' ? `场景 ${chapter.sceneCount}` : `${chapter.sceneCount} scenes`}</span>
                  <span>{locale === 'zh-CN' ? `字数 ${chapter.assembledWordCount}` : `${chapter.assembledWordCount} words`}</span>
                  {chapter.primaryAssemblyHintLabel ? <span>{chapter.primaryAssemblyHintLabel}</span> : null}
                </span>
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
  )
}
