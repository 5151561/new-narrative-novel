import { getChapterSceneOrdinalLabel, useI18n } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { PaneHeader } from '@/components/ui/PaneHeader'

import type { ChapterDraftWorkspaceViewModel } from '../types/chapter-draft-view-models'

interface ChapterDraftBinderPaneProps {
  workspace: ChapterDraftWorkspaceViewModel
  onSelectScene?: (sceneId: string) => void
  onOpenScene?: (sceneId: string, lens: 'orchestrate' | 'draft') => void
}

function getWordCountLabel(locale: 'en' | 'zh-CN', count?: number) {
  if (count === undefined) {
    return locale === 'zh-CN' ? '未起草' : 'No draft'
  }

  return locale === 'zh-CN' ? `${count} 词` : `${count} words`
}

export function ChapterDraftBinderPane({ workspace, onSelectScene, onOpenScene }: ChapterDraftBinderPaneProps) {
  const { locale, dictionary } = useI18n()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PaneHeader
        title={dictionary.app.chapters}
        description={dictionary.app.chapterDraftNavigatorDescription}
      />
      <div className="min-h-0 flex-1 space-y-3 overflow-auto p-3">
        <section className="rounded-md border border-line-strong bg-surface-1 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.chapterScaffold.currentChapter}</p>
              <h4 className="mt-1 text-base text-text-main">{workspace.title}</h4>
            </div>
            <Badge tone="accent">{locale === 'zh-CN' ? '章节 Draft' : 'Chapter Draft'}</Badge>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="neutral">{locale === 'zh-CN' ? `已起草 ${workspace.draftedSceneCount}` : `Drafted ${workspace.draftedSceneCount}`}</Badge>
            <Badge tone={workspace.missingDraftCount > 0 ? 'warn' : 'success'}>
              {locale === 'zh-CN' ? `缺稿 ${workspace.missingDraftCount}` : `Missing ${workspace.missingDraftCount}`}
            </Badge>
            <Badge tone="neutral">{locale === 'zh-CN' ? `合计 ${workspace.assembledWordCount} 词` : `${workspace.assembledWordCount} words`}</Badge>
          </div>
        </section>
        <ul className="space-y-2">
          {workspace.scenes.map((scene) => {
            const active = scene.sceneId === workspace.selectedSceneId

            return (
              <li key={scene.sceneId}>
                <div
                  className={`rounded-md border px-3 py-3 transition-colors ${
                    active ? 'border-line-strong bg-surface-1 shadow-sm' : 'border-line-soft bg-surface-2/80'
                  }`}
                >
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => onSelectScene?.(scene.sceneId)}
                    className="w-full rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block text-[11px] uppercase tracking-[0.08em] text-text-soft">
                          {getChapterSceneOrdinalLabel(locale, scene.order)}
                        </span>
                        <span className="block text-sm font-medium text-text-main">{scene.title}</span>
                        <span className="mt-1 block text-xs text-text-soft">{scene.proseStatusLabel}</span>
                      </span>
                      <span className="flex shrink-0 flex-wrap justify-end gap-2">
                        <Badge tone={scene.isMissingDraft ? 'warn' : 'success'}>{getWordCountLabel(locale, scene.draftWordCount)}</Badge>
                        {scene.revisionQueueCount ? <Badge tone="accent">{locale === 'zh-CN' ? `修订 ${scene.revisionQueueCount}` : `Queue ${scene.revisionQueueCount}`}</Badge> : null}
                        {scene.warningsCount > 0 ? <Badge tone="warn">{locale === 'zh-CN' ? `警告 ${scene.warningsCount}` : `Warn ${scene.warningsCount}`}</Badge> : null}
                      </span>
                    </span>
                    <span className="mt-2 block text-sm leading-6 text-text-muted">{scene.summary}</span>
                  </button>
                  <div className="mt-3 flex flex-wrap justify-end gap-1.5 border-t border-line-soft pt-2">
                    <button
                      type="button"
                      aria-label={`${dictionary.app.chapterScaffold.openInOrchestrate}: ${scene.title}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        onOpenScene?.(scene.sceneId, 'orchestrate')
                      }}
                      className="rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-1 hover:text-text-main"
                    >
                      {dictionary.app.chapterScaffold.openInOrchestrate}
                    </button>
                    <button
                      type="button"
                      aria-label={`${dictionary.app.chapterScaffold.openInDraft}: ${scene.title}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        onOpenScene?.(scene.sceneId, 'draft')
                      }}
                      className="rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-1 hover:text-text-main"
                    >
                      {dictionary.app.chapterScaffold.openInDraft}
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
