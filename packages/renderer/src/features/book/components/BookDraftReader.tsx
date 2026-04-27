import { Badge } from '@/components/ui/Badge'
import { PaneHeader } from '@/components/ui/PaneHeader'

import type { BookDraftWorkspaceViewModel } from '../types/book-draft-view-models'
import { useI18n } from '@/app/i18n'

interface BookDraftReaderProps {
  workspace: BookDraftWorkspaceViewModel
  onSelectChapter?: (chapterId: string) => void
  onOpenChapter?: (chapterId: string, lens: 'structure' | 'draft') => void
}

function getChapterLabel(locale: 'en' | 'zh-CN', order: number) {
  return locale === 'zh-CN' ? `第 ${order} 章` : `Chapter ${order}`
}

function getWordCountLabel(locale: 'en' | 'zh-CN', count?: number) {
  if (count === undefined) {
    return locale === 'zh-CN' ? '未起草' : 'No draft'
  }

  return locale === 'zh-CN' ? `${count} 词` : `${count} words`
}

function getMissingDraftCopy(locale: 'en' | 'zh-CN') {
  return locale === 'zh-CN'
    ? {
        title: '正文缺口',
        detail: '保持章节顺序不变，等 scene draft 准备好后再回到这里连续阅读。',
      }
    : {
        title: 'Manuscript gap',
        detail: 'Keep the chapter order stable, then return here once the scene draft is ready.',
      }
}

export function BookDraftReader({ workspace, onSelectChapter, onOpenChapter }: BookDraftReaderProps) {
  const { locale } = useI18n()
  const missingDraftCopy = getMissingDraftCopy(locale)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PaneHeader
        title={locale === 'zh-CN' ? '书籍手稿' : 'Book manuscript'}
        description={
          locale === 'zh-CN'
            ? '按书籍顺序连续阅读，并把当前选中章节作为实时手稿落点保留下来。'
            : 'Read the manuscript in book order while keeping the selected chapter as the current manuscript destination.'
        }
      />
      <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
          {workspace.chapters.map((chapter) => {
            const active = chapter.chapterId === workspace.selectedChapterId

            return (
              <section
                key={chapter.chapterId}
                className={`rounded-md border ${
                  active ? 'border-line-strong bg-surface-1 shadow-sm' : 'border-line-soft bg-surface-1'
                }`}
              >
                <button
                  type="button"
                  aria-current={active}
                  aria-label={`${getChapterLabel(locale, chapter.order)} ${chapter.title}`}
                  onClick={() => onSelectChapter?.(chapter.chapterId)}
                  className="w-full rounded-md px-5 py-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                        {getChapterLabel(locale, chapter.order)}
                      </p>
                      <h3 className="mt-1 text-lg leading-tight text-text-main">{chapter.title}</h3>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Badge tone="neutral">{getWordCountLabel(locale, chapter.assembledWordCount)}</Badge>
                      <Badge tone={chapter.missingDraftCount > 0 ? 'warn' : 'success'}>
                        {locale === 'zh-CN' ? `缺稿 ${chapter.missingDraftCount}` : `Missing ${chapter.missingDraftCount}`}
                      </Badge>
                      <Badge tone={chapter.missingTraceSceneCount > 0 ? 'warn' : 'success'}>
                        {locale === 'zh-CN' ? `缺溯源 ${chapter.missingTraceSceneCount}` : `Missing trace ${chapter.missingTraceSceneCount}`}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-text-muted">{chapter.summary}</p>
                </button>
                <div className="space-y-4 border-t border-line-soft px-5 py-4">
                  {active ? (
                    <div
                      role="region"
                      aria-label={locale === 'zh-CN' ? '当前手稿落点' : 'Selected manuscript destination'}
                      className="rounded-md border border-line-strong bg-surface-1 px-4 py-4"
                    >
                      <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                        {locale === 'zh-CN' ? '当前手稿落点' : 'Selected manuscript destination'}
                      </p>
                      <div className="mt-3 space-y-4">
                        {chapter.missingDraftCount === 0 && chapter.assembledProseSections.length > 0 ? (
                          chapter.assembledProseSections.map((section, index) => (
                            <p key={`${chapter.chapterId}-assembled-${index}`} className="whitespace-pre-wrap text-[15px] leading-7 text-text-main">
                              {section}
                            </p>
                          ))
                        ) : (
                          <div className="space-y-3">
                            <p className="text-sm leading-6 text-text-muted">{missingDraftCopy.detail}</p>
                            <ul className="space-y-2 text-sm text-text-main">
                              {chapter.sections
                                .filter((section) => section.isMissingDraft)
                                .map((section) => (
                                  <li key={`${chapter.chapterId}-${section.sceneId}-gap`} className="rounded-md border border-dashed border-line-strong bg-surface-2 px-3 py-3">
                                    <p className="font-medium">{section.title}</p>
                                    <p className="mt-1 text-text-muted">{section.latestDiffSummary ?? missingDraftCopy.title}</p>
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                  {chapter.sections.map((section) => (
                    <article key={section.sceneId} className="space-y-3 rounded-md border border-line-soft bg-surface-2 px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                            {locale === 'zh-CN' ? `场景 ${section.order}` : `Scene ${section.order}`}
                          </p>
                          <h4 className="mt-1 text-base text-text-main">{section.title}</h4>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Badge tone={section.isMissingDraft ? 'warn' : 'success'}>{getWordCountLabel(locale, section.draftWordCount)}</Badge>
                          <Badge tone={section.traceReady ? 'accent' : 'warn'}>
                            {section.traceReady ? (locale === 'zh-CN' ? '溯源已就绪' : 'Trace ready') : locale === 'zh-CN' ? '溯源缺失' : 'Trace missing'}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm leading-6 text-text-muted">{section.summary}</p>
                      {section.isMissingDraft ? (
                        <div className="rounded-md border border-dashed border-line-strong bg-surface-1 px-4 py-4">
                          <p className="text-sm font-medium text-text-main">{missingDraftCopy.title}</p>
                          <p className="mt-2 text-sm leading-6 text-text-muted">{section.latestDiffSummary ?? missingDraftCopy.detail}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="whitespace-pre-wrap text-[15px] leading-7 text-text-main">{section.proseDraft}</p>
                          {section.latestDiffSummary ? (
                            <p className="text-sm leading-6 text-text-muted">{section.latestDiffSummary}</p>
                          ) : null}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
                <div className="flex flex-wrap justify-end gap-2 border-t border-line-soft px-5 py-3">
                  <button
                    type="button"
                    aria-label={`${locale === 'zh-CN' ? '在 Draft 中打开' : 'Open in Draft'}: ${chapter.title}`}
                    onClick={() => onOpenChapter?.(chapter.chapterId, 'draft')}
                    className="rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-2 hover:text-text-main"
                  >
                    {locale === 'zh-CN' ? '在 Draft 中打开' : 'Open in Draft'}
                  </button>
                  <button
                    type="button"
                    aria-label={`${locale === 'zh-CN' ? '在 Structure 中打开' : 'Open in Structure'}: ${chapter.title}`}
                    onClick={() => onOpenChapter?.(chapter.chapterId, 'structure')}
                    className="rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-2 hover:text-text-main"
                  >
                    {locale === 'zh-CN' ? '在 Structure 中打开' : 'Open in Structure'}
                  </button>
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
