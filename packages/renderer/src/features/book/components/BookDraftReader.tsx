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

function getSelectedChapterDestination(workspace: BookDraftWorkspaceViewModel) {
  return workspace.chapters.find((chapter) => chapter.chapterId === workspace.selectedChapterId) ?? workspace.selectedChapter ?? null
}

export function BookDraftReader({ workspace, onSelectChapter, onOpenChapter }: BookDraftReaderProps) {
  const { locale } = useI18n()
  const missingDraftCopy = getMissingDraftCopy(locale)
  const selectedChapter = getSelectedChapterDestination(workspace)
  const sourceManifest = workspace.readableManuscript.sourceManifest

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
          {selectedChapter ? (
            <section
              role="region"
              aria-label={locale === 'zh-CN' ? '当前手稿落点' : 'Selected manuscript destination'}
              className="rounded-md border border-line-strong bg-surface-1 px-4 py-4"
            >
              <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                {locale === 'zh-CN' ? '当前手稿落点' : 'Selected manuscript destination'}
              </p>
              <p className="mt-2 text-sm font-medium text-text-main">{selectedChapter.title}</p>
              <p className="mt-2 text-sm leading-6 text-text-muted">{selectedChapter.summary}</p>
            </section>
          ) : null}
          {workspace.readableManuscript.sections.map((section, index) => {
            const active = section.chapterId === workspace.selectedChapterId

            if (section.kind === 'chapter-heading') {
              return (
                <section
                  key={`${section.chapterId}-${section.kind}-${index}`}
                  className={`rounded-md border px-5 py-5 ${
                    active ? 'border-line-strong bg-surface-1 shadow-sm' : 'border-line-soft bg-surface-1'
                  }`}
                >
                  <button
                    type="button"
                    aria-current={active}
                    aria-label={`${getChapterLabel(locale, section.chapterOrder)} ${section.chapterTitle}`}
                    onClick={() => onSelectChapter?.(section.chapterId)}
                    className="w-full rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                          {getChapterLabel(locale, section.chapterOrder)}
                        </p>
                        <h3 className="mt-1 text-lg leading-tight text-text-main">{section.chapterTitle}</h3>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Badge tone="neutral">{getWordCountLabel(locale, section.assembledWordCount)}</Badge>
                        <Badge tone={(section.missingDraftCount ?? 0) > 0 ? 'warn' : 'success'}>
                          {locale === 'zh-CN' ? `缺稿 ${section.missingDraftCount ?? 0}` : `Missing ${section.missingDraftCount ?? 0}`}
                        </Badge>
                      </div>
                    </div>
                    {section.summary ? <p className="mt-3 text-sm leading-6 text-text-muted">{section.summary}</p> : null}
                  </button>
                  <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-line-soft pt-3">
                    <button
                      type="button"
                      aria-label={`${locale === 'zh-CN' ? '在 Draft 中打开' : 'Open in Draft'}: ${section.chapterTitle}`}
                      onClick={() => onOpenChapter?.(section.chapterId, 'draft')}
                      className="rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-2 hover:text-text-main"
                    >
                      {locale === 'zh-CN' ? '在 Draft 中打开' : 'Open in Draft'}
                    </button>
                    <button
                      type="button"
                      aria-label={`${locale === 'zh-CN' ? '在 Structure 中打开' : 'Open in Structure'}: ${section.chapterTitle}`}
                      onClick={() => onOpenChapter?.(section.chapterId, 'structure')}
                      className="rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-2 hover:text-text-main"
                    >
                      {locale === 'zh-CN' ? '在 Structure 中打开' : 'Open in Structure'}
                    </button>
                  </div>
                </section>
              )
            }

            if (section.kind === 'scene-draft' || section.kind === 'scene-gap') {
              const manifestEntry = sourceManifest.find((entry) => entry.kind === section.kind && entry.sceneId === section.sceneId)
              return (
                <button
                  key={`${section.chapterId}-${section.kind}-${section.sceneId}`}
                  type="button"
                  onClick={() => onSelectChapter?.(section.chapterId)}
                  className={`w-full rounded-md border px-4 py-4 text-left ${
                    section.kind === 'scene-gap'
                      ? 'border-dashed border-line-strong bg-surface-2'
                      : active
                        ? 'border-line-strong bg-surface-1'
                        : 'border-line-soft bg-surface-2'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                        {locale === 'zh-CN' ? `场景 ${section.sceneOrder}` : `Scene ${section.sceneOrder}`}
                      </p>
                      <h4 className="mt-1 text-base text-text-main">{section.sceneTitle}</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={section.kind === 'scene-gap' ? 'warn' : 'success'}>
                        {getWordCountLabel(locale, section.draftWordCount)}
                      </Badge>
                      <Badge tone={section.traceReady ? 'accent' : 'warn'}>
                        {section.traceReady ? (locale === 'zh-CN' ? '溯源已就绪' : 'Trace ready') : locale === 'zh-CN' ? '溯源缺失' : 'Trace missing'}
                      </Badge>
                      {manifestEntry ? (
                        <Badge tone="neutral">
                          {locale === 'zh-CN'
                            ? `来源 ${manifestEntry.sourceProposalIds.length}/${manifestEntry.acceptedFactIds.length}`
                            : `Sources ${manifestEntry.sourceProposalIds.length}/${manifestEntry.acceptedFactIds.length}`}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  {section.sceneSummary ? <p className="mt-2 text-sm leading-6 text-text-muted">{section.sceneSummary}</p> : null}
                  {section.kind === 'scene-gap' ? (
                    <div className="mt-3 rounded-md border border-dashed border-line-strong bg-surface-1 px-4 py-4">
                      <p className="text-sm font-medium text-text-main">{missingDraftCopy.title}</p>
                      <p className="mt-2 text-sm leading-6 text-text-muted">{section.gapReason ?? missingDraftCopy.detail}</p>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      <p className="whitespace-pre-wrap text-[15px] leading-7 text-text-main">{section.proseDraft}</p>
                    </div>
                  )}
                </button>
              )
            }

            return (
              <button
                key={`${section.chapterId}-${section.kind}-${section.fromSceneId}-${section.toSceneId}`}
                type="button"
                onClick={() => onSelectChapter?.(section.chapterId)}
                className={`w-full rounded-md border px-4 py-4 text-left ${
                  section.kind === 'transition-gap'
                    ? 'border-dashed border-line-strong bg-surface-2'
                    : active
                      ? 'border-line-strong bg-surface-1'
                      : 'border-line-soft bg-surface-2'
                }`}
              >
                <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                  {locale === 'zh-CN' ? '章节接缝' : 'Chapter seam'}
                </p>
                <p className="mt-1 text-sm font-medium text-text-main">
                  {section.fromSceneTitle} {locale === 'zh-CN' ? '→' : '->'} {section.toSceneTitle}
                </p>
                {section.kind === 'transition-draft' ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="neutral">{section.artifactId ?? (locale === 'zh-CN' ? '无产物' : 'No artifact')}</Badge>
                    </div>
                    <p className="whitespace-pre-wrap text-[15px] leading-7 text-text-main">{section.transitionProse}</p>
                  </div>
                ) : (
                  <div className="mt-3 rounded-md border border-dashed border-line-strong bg-surface-1 px-4 py-4">
                    <p className="text-sm font-medium text-text-main">{locale === 'zh-CN' ? '过渡缺口' : 'Transition gap'}</p>
                    <p className="mt-2 text-sm leading-6 text-text-muted">{section.gapReason ?? missingDraftCopy.detail}</p>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
