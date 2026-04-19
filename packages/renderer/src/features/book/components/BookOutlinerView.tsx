import { Badge } from '@/components/ui/Badge'

import { useI18n } from '@/app/i18n'
import type { BookStructureChapterViewModel } from '../types/book-view-models'

interface BookOutlinerViewProps {
  chapters: BookStructureChapterViewModel[]
  selectedChapterId: string | null
  onSelectChapter?: (chapterId: string) => void
  onOpenChapter?: (chapterId: string, lens: 'structure' | 'draft') => void
}

function getBeatLineLabel(locale: 'en' | 'zh-CN', order: number) {
  return locale === 'zh-CN' ? `节拍线 ${order}` : `Beat line ${order}`
}

function formatWords(locale: 'en' | 'zh-CN', count: number) {
  return locale === 'zh-CN' ? `${count} 字` : `${count} words`
}

export function BookOutlinerView({
  chapters,
  selectedChapterId,
  onSelectChapter,
  onOpenChapter,
}: BookOutlinerViewProps) {
  const { locale } = useI18n()

  return (
    <div className="overflow-hidden rounded-md border border-line-soft bg-surface-2">
      <ul className="divide-y divide-line-soft">
        {chapters.map((chapter) => {
          const active = chapter.chapterId === selectedChapterId

          return (
            <li key={chapter.chapterId}>
              <div
                className={`border-l-2 px-3 py-3 transition-colors ${
                  active
                    ? 'border-l-accent bg-surface-1 shadow-ringwarm'
                    : 'border-l-transparent bg-surface-2 hover:bg-surface-1'
                }`}
              >
                <button
                  type="button"
                  aria-current={active ? 'true' : undefined}
                  aria-label={`${getBeatLineLabel(locale, chapter.order)} ${chapter.title}`}
                  onClick={() => onSelectChapter?.(chapter.chapterId)}
                  className="w-full rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                >
                  <span className="grid items-start gap-x-4 gap-y-3 md:grid-cols-[88px_minmax(0,1fr)] xl:grid-cols-[88px_minmax(180px,1.25fr)_minmax(92px,0.75fr)_minmax(92px,0.75fr)_minmax(92px,0.75fr)_minmax(120px,0.85fr)] 2xl:grid-cols-[96px_minmax(220px,1.2fr)_140px_140px_140px_160px]">
                    <span className="block min-w-0">
                      <span className="block text-[11px] uppercase tracking-[0.08em] text-text-soft">
                        {getBeatLineLabel(locale, chapter.order)}
                      </span>
                      <span className="mt-1 block break-words text-sm font-medium text-text-main">{chapter.title}</span>
                    </span>
                    <span className="block min-w-0 break-words text-sm leading-6 text-text-muted">{chapter.summary}</span>
                    <span className="block min-w-0">
                      <span className="block text-[11px] uppercase tracking-[0.08em] text-text-soft">
                        {locale === 'zh-CN' ? '结构压力' : 'Structure'}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-2">
                        <Badge tone={chapter.unresolvedCount > 0 ? 'warn' : 'success'}>
                          {locale === 'zh-CN' ? `未决 ${chapter.unresolvedCount}` : `Unresolved ${chapter.unresolvedCount}`}
                        </Badge>
                      </span>
                    </span>
                    <span className="block min-w-0">
                      <span className="block text-[11px] uppercase tracking-[0.08em] text-text-soft">
                        {locale === 'zh-CN' ? '成稿' : 'Draft'}
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-text-muted">
                        {locale === 'zh-CN'
                          ? `已起草 ${chapter.draftedSceneCount} / ${chapter.sceneCount}`
                          : `${chapter.draftedSceneCount} / ${chapter.sceneCount} drafted`}
                      </span>
                    </span>
                    <span className="block min-w-0">
                      <span className="block text-[11px] uppercase tracking-[0.08em] text-text-soft">
                        {locale === 'zh-CN' ? '溯源' : 'Trace'}
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-text-muted">
                        {locale === 'zh-CN'
                          ? `已覆盖 ${chapter.tracedSceneCount} / ${chapter.sceneCount}`
                          : `${chapter.tracedSceneCount} / ${chapter.sceneCount} traced`}
                      </span>
                    </span>
                    <span className="block min-w-0">
                      <span className="block text-[11px] uppercase tracking-[0.08em] text-text-soft">
                        {locale === 'zh-CN' ? '摘要' : 'Summary'}
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-text-muted">
                        {formatWords(locale, chapter.assembledWordCount)}
                      </span>
                      {chapter.primaryProblemLabel ? (
                        <span className="mt-1 block text-sm text-text-main">{chapter.primaryProblemLabel}</span>
                      ) : null}
                    </span>
                  </span>
                </button>
                {onOpenChapter ? (
                  <div className="mt-2 flex flex-wrap justify-end gap-1.5">
                    <button
                      type="button"
                      aria-label={`${locale === 'zh-CN' ? '在 Structure 中打开' : 'Open in Structure'}: ${chapter.title}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        onOpenChapter(chapter.chapterId, 'structure')
                      }}
                      className="rounded-md px-2 py-1 text-[11px] font-medium text-text-muted hover:bg-surface-1 hover:text-text-main"
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
                      className="rounded-md px-2 py-1 text-[11px] font-medium text-text-muted hover:bg-surface-1 hover:text-text-main"
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
  )
}
