import { Badge } from '@/components/ui/Badge'
import { SectionCard } from '@/components/ui/SectionCard'

import { useI18n } from '@/app/i18n'
import type { BookStructureChapterViewModel } from '../types/book-view-models'

interface BookSignalsViewProps {
  chapters: BookStructureChapterViewModel[]
  selectedChapterId: string | null
  onSelectChapter?: (chapterId: string) => void
  onOpenChapter?: (chapterId: string, lens: 'structure' | 'draft') => void
}

export function BookSignalsView({
  chapters,
  selectedChapterId,
  onSelectChapter,
  onOpenChapter,
}: BookSignalsViewProps) {
  const { locale } = useI18n()

  return (
    <div className="grid gap-3 xl:grid-cols-3">
      {chapters.map((chapter) => {
        const active = chapter.chapterId === selectedChapterId

        return (
          <SectionCard
            key={chapter.chapterId}
            title={chapter.title}
            eyebrow={locale === 'zh-CN' ? `第 ${chapter.order} 章` : `Chapter ${chapter.order}`}
            actions={
              <Badge tone={active ? 'accent' : 'neutral'}>
                {chapter.coverageStatus === 'ready'
                  ? locale === 'zh-CN'
                    ? '已就绪'
                    : 'Ready'
                  : chapter.coverageStatus === 'attention'
                    ? locale === 'zh-CN'
                      ? '需关注'
                      : 'Attention'
                    : locale === 'zh-CN'
                      ? '缺失'
                      : 'Missing'}
              </Badge>
            }
          >
            <button
              type="button"
              aria-label={chapter.title}
              onClick={() => onSelectChapter?.(chapter.chapterId)}
              className="w-full rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
            >
              <p className="text-sm leading-6 text-text-muted">{chapter.summary}</p>
              <div className="mt-4 grid gap-3">
                <div>
                  <h5 className="text-sm font-medium text-text-main">{locale === 'zh-CN' ? '压力' : 'Pressure'}</h5>
                  <p className="mt-1 text-sm leading-6 text-text-muted">
                    {chapter.primaryProblemLabel ?? (locale === 'zh-CN' ? '当前没有结构压力摘要。' : 'No structural pressure summary.')}
                  </p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-text-main">{locale === 'zh-CN' ? '准备度' : 'Readiness'}</h5>
                  <p className="mt-1 text-sm leading-6 text-text-muted">
                    {locale === 'zh-CN'
                      ? `缺正文 ${chapter.missingDraftCount}，排队修订 ${chapter.queuedRevisionCount}`
                      : `Missing draft ${chapter.missingDraftCount}, queued revisions ${chapter.queuedRevisionCount}`}
                  </p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-text-main">{locale === 'zh-CN' ? '溯源' : 'Trace'}</h5>
                  <p className="mt-1 text-sm leading-6 text-text-muted">
                    {locale === 'zh-CN'
                      ? `缺溯源 ${chapter.missingTraceSceneCount}`
                      : `Missing trace ${chapter.missingTraceSceneCount}`}
                  </p>
                </div>
              </div>
            </button>
            {onOpenChapter ? (
              <div className="mt-4 flex flex-wrap justify-end gap-1.5 border-t border-line-soft pt-3">
                <button
                  type="button"
                  aria-label={`${locale === 'zh-CN' ? '在 Structure 中打开' : 'Open in Structure'}: ${chapter.title}`}
                  onClick={() => onOpenChapter(chapter.chapterId, 'structure')}
                  className="rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-2 hover:text-text-main"
                >
                  {locale === 'zh-CN' ? '在 Structure 中打开' : 'Open in Structure'}
                </button>
                <button
                  type="button"
                  aria-label={`${locale === 'zh-CN' ? '在 Draft 中打开' : 'Open in Draft'}: ${chapter.title}`}
                  onClick={() => onOpenChapter(chapter.chapterId, 'draft')}
                  className="rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-2 hover:text-text-main"
                >
                  {locale === 'zh-CN' ? '在 Draft 中打开' : 'Open in Draft'}
                </button>
              </div>
            ) : null}
          </SectionCard>
        )
      })}
    </div>
  )
}
