import { getChapterSceneOrdinalLabel, useI18n } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { PaneHeader } from '@/components/ui/PaneHeader'

import type { ChapterDraftWorkspaceViewModel } from '../types/chapter-draft-view-models'

interface ChapterDraftReaderProps {
  workspace: ChapterDraftWorkspaceViewModel
  onSelectScene?: (sceneId: string) => void
  onOpenScene?: (sceneId: string, lens: 'orchestrate' | 'draft') => void
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

function getWordCountLabel(locale: 'en' | 'zh-CN', count?: number) {
  if (count === undefined) {
    return locale === 'zh-CN' ? '未起草' : 'No draft'
  }

  return locale === 'zh-CN' ? `${count} 词` : `${count} words`
}

function getTraceStatusLabel(locale: 'en' | 'zh-CN', status: 'ready' | 'missing') {
  if (status === 'ready') {
    return locale === 'zh-CN' ? '来源链已就绪' : 'Trace ready'
  }

  return locale === 'zh-CN' ? '来源链缺失' : 'Trace missing'
}

function getTraceFactCountLabel(locale: 'en' | 'zh-CN', count: number) {
  return locale === 'zh-CN' ? `${count} 条事实` : `${count} facts`
}

function getTraceAssetCountLabel(locale: 'en' | 'zh-CN', count: number) {
  return locale === 'zh-CN' ? `${count} 个资产` : `${count} assets`
}

export function ChapterDraftReader({ workspace, onSelectScene, onOpenScene }: ChapterDraftReaderProps) {
  const { locale, dictionary } = useI18n()
  const missingDraftCopy = getMissingDraftCopy(locale)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PaneHeader
        title={dictionary.app.chapterDraft}
        description={dictionary.app.chapterDraftReaderDescription}
      />
      <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
          {workspace.scenes.map((scene) => {
            const active = scene.sceneId === workspace.selectedSceneId

            return (
              <section
                key={scene.sceneId}
                className={`rounded-md border ${
                  active ? 'border-line-strong bg-surface-1 shadow-sm' : 'border-line-soft bg-surface-1'
                }`}
              >
                <button
                  type="button"
                  aria-current={active}
                  onClick={() => onSelectScene?.(scene.sceneId)}
                  className="w-full rounded-md px-5 py-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                        {getChapterSceneOrdinalLabel(locale, scene.order)}
                      </p>
                      <h3 className="mt-1 text-lg leading-tight text-text-main">{scene.title}</h3>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Badge tone={scene.isMissingDraft ? 'warn' : 'success'}>{scene.proseStatusLabel}</Badge>
                      <Badge tone="neutral">{getWordCountLabel(locale, scene.draftWordCount)}</Badge>
                    </div>
                  </div>
                  {scene.traceSummary ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge tone={scene.traceSummary.status === 'ready' ? 'accent' : 'warn'}>
                        {getTraceStatusLabel(locale, scene.traceSummary.status)}
                      </Badge>
                      <Badge tone="neutral">{getTraceFactCountLabel(locale, scene.traceSummary.sourceFactCount)}</Badge>
                      <Badge tone="neutral">{getTraceAssetCountLabel(locale, scene.traceSummary.relatedAssetCount)}</Badge>
                    </div>
                  ) : null}
                  <p className="mt-3 text-sm leading-6 text-text-muted">{scene.summary}</p>
                  {scene.isMissingDraft ? (
                    <div className="mt-4 rounded-md border border-dashed border-line-strong bg-surface-2 px-4 py-4">
                      <p className="text-sm font-medium text-text-main">{missingDraftCopy.title}</p>
                      <p className="mt-2 text-sm leading-6 text-text-muted">{scene.latestDiffSummary ?? missingDraftCopy.detail}</p>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <p className="whitespace-pre-wrap text-[15px] leading-7 text-text-main">{scene.proseDraft}</p>
                      {scene.latestDiffSummary ? (
                        <p className="text-sm leading-6 text-text-muted">{scene.latestDiffSummary}</p>
                      ) : null}
                    </div>
                  )}
                </button>
                <div className="flex flex-wrap justify-end gap-2 border-t border-line-soft px-5 py-3">
                  <button
                    type="button"
                    aria-label={`${dictionary.app.chapterScaffold.openInOrchestrate}: ${scene.title}`}
                    onClick={() => onOpenScene?.(scene.sceneId, 'orchestrate')}
                    className="rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-2 hover:text-text-main"
                  >
                    {dictionary.app.chapterScaffold.openInOrchestrate}
                  </button>
                  <button
                    type="button"
                    aria-label={`${dictionary.app.chapterScaffold.openInDraft}: ${scene.title}`}
                    onClick={() => onOpenScene?.(scene.sceneId, 'draft')}
                    className="rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-2 hover:text-text-main"
                  >
                    {dictionary.app.chapterScaffold.openInDraft}
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
