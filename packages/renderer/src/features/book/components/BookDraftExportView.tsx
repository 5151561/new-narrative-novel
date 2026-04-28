import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FactList } from '@/components/ui/FactList'
import { PaneHeader } from '@/components/ui/PaneHeader'

import { useI18n } from '@/app/i18n'

import type { BookExportArtifactFormat } from '../api/book-export-artifact-records'
import type {
  BookExportArtifactSummaryViewModel,
  BookExportArtifactWorkspaceViewModel,
} from '../types/book-export-artifact-view-models'
import type {
  BookExportChapterPreviewViewModel,
  BookExportPreviewWorkspaceViewModel,
  BookExportProfileSummaryViewModel,
} from '../types/book-export-view-models'
import { BookExportArtifactPanel } from './BookExportArtifactPanel'
import { BookExportProfilePicker } from './BookExportProfilePicker'
import { BookExportReadinessChecklist } from './BookExportReadinessChecklist'

interface BookDraftExportViewProps {
  exportPreview: BookExportPreviewWorkspaceViewModel | null
  exportProfiles: BookExportProfileSummaryViewModel[]
  selectedExportProfileId: string
  artifactWorkspace?: BookExportArtifactWorkspaceViewModel | null
  selectedArtifactFormat: BookExportArtifactFormat
  isBuildingArtifact?: boolean
  artifactBuildErrorMessage?: string | null
  errorMessage?: string | null
  onSelectChapter: (chapterId: string) => void
  onOpenChapter: (chapterId: string, lens: 'structure' | 'draft') => void
  onSelectExportProfile: (exportProfileId: string) => void
  onSelectArtifactFormat?: (format: BookExportArtifactFormat) => void
  onBuildArtifact?: () => void
  onCopyArtifact?: (artifact: BookExportArtifactSummaryViewModel) => void
  onDownloadArtifact?: (artifact: BookExportArtifactSummaryViewModel) => void
}

function getChapterLabel(locale: 'en' | 'zh-CN', order: number) {
  return locale === 'zh-CN' ? `第 ${order} 章` : `Chapter ${order}`
}

function getStatusBadge(
  locale: 'en' | 'zh-CN',
  status: BookExportChapterPreviewViewModel['readinessStatus'] | BookExportPreviewWorkspaceViewModel['readiness']['status'],
) {
  if (status === 'blocked') {
    return { tone: 'danger' as const, label: locale === 'zh-CN' ? '阻塞' : 'Blocked' }
  }
  if (status === 'attention') {
    return { tone: 'warn' as const, label: locale === 'zh-CN' ? '需关注' : 'Attention' }
  }

  return { tone: 'success' as const, label: locale === 'zh-CN' ? '已就绪' : 'Ready' }
}

function formatWordCount(locale: 'en' | 'zh-CN', wordCount?: number) {
  if (wordCount === undefined) {
    return locale === 'zh-CN' ? '未起草' : 'No draft'
  }

  return locale === 'zh-CN' ? `${wordCount} 词` : `${wordCount} words`
}

export function BookDraftExportView({
  exportPreview,
  exportProfiles,
  selectedExportProfileId,
  artifactWorkspace = null,
  selectedArtifactFormat,
  isBuildingArtifact = false,
  artifactBuildErrorMessage = null,
  errorMessage = null,
  onSelectChapter,
  onOpenChapter,
  onSelectExportProfile,
  onSelectArtifactFormat,
  onBuildArtifact,
  onCopyArtifact,
  onDownloadArtifact,
}: BookDraftExportViewProps) {
  const { locale } = useI18n()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PaneHeader
        title={locale === 'zh-CN' ? '书籍导出预览' : 'Book export preview'}
        description={
          locale === 'zh-CN'
            ? '按章节检查 package readiness，并构建本地 Markdown / 纯文本 artifact。'
            : 'Review package readiness chapter by chapter and build a local Markdown or plain text artifact.'
        }
      />
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="space-y-4">
          <BookExportProfilePicker
            profiles={exportProfiles}
            selectedExportProfileId={selectedExportProfileId}
            onSelectExportProfile={onSelectExportProfile}
          />
          {exportPreview ? (
            <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
              <section className="space-y-4">
                <section className="rounded-md border border-line-soft bg-surface-1 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                        {locale === 'zh-CN' ? '准备度' : 'Readiness'}
                      </p>
                      <h4 className="mt-1 text-base text-text-main">{exportPreview.readiness.label}</h4>
                    </div>
                    <Badge tone={getStatusBadge(locale, exportPreview.readiness.status).tone}>
                      {getStatusBadge(locale, exportPreview.readiness.status).label}
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <FactList
                      items={[
                        { id: 'blockers', label: locale === 'zh-CN' ? '阻塞项' : 'Blockers', value: `${exportPreview.readiness.blockerCount}` },
                        { id: 'warnings', label: locale === 'zh-CN' ? '警告' : 'Warnings', value: `${exportPreview.readiness.warningCount}` },
                        { id: 'included-chapters', label: locale === 'zh-CN' ? '纳入章节' : 'Included chapters', value: `${exportPreview.totals.includedChapterCount}` },
                        { id: 'assembled-words', label: locale === 'zh-CN' ? '装配字数' : 'Assembled words', value: `${exportPreview.totals.assembledWordCount}` },
                      ]}
                    />
                  </div>
                </section>
                <section className="rounded-md border border-line-soft bg-surface-1 p-4">
                  <h4 className="text-base text-text-main">{locale === 'zh-CN' ? '包摘要' : 'Package summary'}</h4>
                  <p className="mt-2 text-sm leading-6 text-text-muted">{exportPreview.packageSummary.estimatedPackageLabel}</p>
                  <div className="mt-3 space-y-3">
                    <div className="rounded-md border border-line-soft bg-surface-2 p-3">
                      <p className="text-sm font-medium text-text-main">{locale === 'zh-CN' ? '纳入内容' : 'Included sections'}</p>
                      <p className="mt-2 text-sm leading-6 text-text-muted">{exportPreview.packageSummary.includedSections.join(', ') || '—'}</p>
                    </div>
                    <div className="rounded-md border border-line-soft bg-surface-2 p-3">
                      <p className="text-sm font-medium text-text-main">{locale === 'zh-CN' ? '排除内容' : 'Excluded sections'}</p>
                      <p className="mt-2 text-sm leading-6 text-text-muted">{exportPreview.packageSummary.excludedSections.join(', ') || '—'}</p>
                    </div>
                  </div>
                </section>
                <section className="rounded-md border border-line-soft bg-surface-1 p-4">
                  <h4 className="text-base text-text-main">{locale === 'zh-CN' ? '来源清单' : 'Source manifest'}</h4>
                  <p className="mt-2 text-sm leading-6 text-text-muted">
                    {locale === 'zh-CN'
                      ? `当前共 ${exportPreview.readableManuscript.sourceManifest.length} 条来源记录，仅预览前 6 条。`
                      : `${exportPreview.readableManuscript.sourceManifest.length} source entries are available. Showing the first 6.`}
                  </p>
                  <div className="mt-3 space-y-3">
                    {exportPreview.readableManuscript.sourceManifest.slice(0, 6).map((entry, index) => (
                      <div key={`${entry.kind}-${entry.sceneId ?? entry.fromSceneId ?? index}`} className="rounded-md border border-line-soft bg-surface-2 p-3">
                        <p className="text-sm font-medium text-text-main">
                          {entry.sceneTitle
                            ? `${entry.sceneTitle} · ${entry.kind}`
                            : `${entry.fromSceneId ?? 'transition'} -> ${entry.toSceneId ?? 'transition'} · ${entry.kind}`}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-text-muted">
                          {entry.sourcePatchId
                            ? `${locale === 'zh-CN' ? '补丁' : 'Patch'} ${entry.sourcePatchId}`
                            : entry.artifactId
                              ? `${locale === 'zh-CN' ? '产物' : 'Artifact'} ${entry.artifactId}`
                              : entry.gapReason ?? (locale === 'zh-CN' ? '当前没有直接来源引用。' : 'No direct source refs are attached yet.')}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
                <BookExportArtifactPanel
                  artifactWorkspace={artifactWorkspace}
                  selectedFormat={selectedArtifactFormat}
                  isBuilding={isBuildingArtifact}
                  buildErrorMessage={artifactBuildErrorMessage}
                  onSelectFormat={onSelectArtifactFormat}
                  onBuildArtifact={onBuildArtifact}
                  onCopyArtifact={onCopyArtifact}
                  onDownloadArtifact={onDownloadArtifact}
                />
                <section className="space-y-3">
                  {exportPreview.chapters.map((chapter) => {
                    const active = chapter.chapterId === exportPreview.selectedChapterId
                    const status = getStatusBadge(locale, chapter.readinessStatus)

                    return (
                      <article
                        key={chapter.chapterId}
                        className={`rounded-md border ${
                          active ? 'border-line-strong bg-surface-1 shadow-sm' : 'border-line-soft bg-surface-1'
                        }`}
                      >
                        <button
                          type="button"
                          aria-pressed={active}
                          aria-label={`${getChapterLabel(locale, chapter.order)} ${chapter.title}`}
                          onClick={() => onSelectChapter(chapter.chapterId)}
                          className="w-full rounded-md px-4 py-4 text-left"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                                {getChapterLabel(locale, chapter.order)}
                              </p>
                              <h4 className="mt-1 text-base text-text-main">{chapter.title}</h4>
                              <p className="mt-2 text-sm leading-6 text-text-muted">{chapter.summary}</p>
                            </div>
                            <Badge tone={status.tone}>{status.label}</Badge>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge tone="neutral">{formatWordCount(locale, chapter.assembledWordCount)}</Badge>
                            <Badge tone={chapter.missingDraftCount > 0 ? 'danger' : 'success'}>
                              {locale === 'zh-CN' ? `缺稿 ${chapter.missingDraftCount}` : `Missing drafts ${chapter.missingDraftCount}`}
                            </Badge>
                            <Badge tone={chapter.missingTraceCount > 0 ? 'warn' : 'success'}>
                              {locale === 'zh-CN' ? `缺溯源 ${chapter.missingTraceCount}` : `Trace gaps ${chapter.missingTraceCount}`}
                            </Badge>
                            <Badge tone={chapter.warningCount > 0 ? 'warn' : 'neutral'}>
                              {locale === 'zh-CN' ? `警告 ${chapter.warningCount}` : `Warnings ${chapter.warningCount}`}
                            </Badge>
                          </div>
                        </button>
                      </article>
                    )
                  })}
                </section>
              </section>
              <section className="space-y-4">
                <section className="rounded-md border border-line-soft bg-surface-1 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                        {locale === 'zh-CN' ? '章节包明细' : 'Chapter package detail'}
                      </p>
                      <h4 className="mt-1 text-base text-text-main">{locale === 'zh-CN' ? '选中章节包' : 'Selected chapter package'}</h4>
                      <p className="mt-1 text-sm text-text-muted">{exportPreview.selectedChapter?.title ?? exportPreview.title}</p>
                    </div>
                    {exportPreview.selectedChapter ? (
                      <Badge tone={getStatusBadge(locale, exportPreview.selectedChapter.readinessStatus).tone}>
                        {getStatusBadge(locale, exportPreview.selectedChapter.readinessStatus).label}
                      </Badge>
                    ) : null}
                  </div>
                  {exportPreview.selectedChapter ? (
                    <>
                      <p className="mt-2 text-sm leading-6 text-text-muted">{exportPreview.selectedChapter.summary}</p>
                      <div className="mt-3">
                        <FactList
                          items={[
                            {
                              id: 'selected-scenes',
                              label: locale === 'zh-CN' ? '纳入场景' : 'Included scenes',
                              value: `${exportPreview.selectedChapter.scenes.filter((scene) => scene.isIncluded).length}`,
                            },
                            {
                              id: 'selected-missing-drafts',
                              label: locale === 'zh-CN' ? '缺稿场景' : 'Missing drafts',
                              value: `${exportPreview.selectedChapter.missingDraftCount}`,
                            },
                            {
                              id: 'selected-trace-gaps',
                              label: locale === 'zh-CN' ? '缺溯源场景' : 'Trace gaps',
                              value: `${exportPreview.selectedChapter.missingTraceCount}`,
                            },
                            {
                              id: 'selected-warnings',
                              label: locale === 'zh-CN' ? '警告' : 'Warnings',
                              value: `${exportPreview.selectedChapter.warningCount}`,
                            },
                          ]}
                        />
                      </div>
                      <div className="mt-4 space-y-3">
                        {exportPreview.selectedChapter.scenes.map((scene) => (
                          <article key={scene.sceneId} className="rounded-md border border-line-soft bg-surface-2 p-3">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                                  {locale === 'zh-CN' ? `场景 ${scene.order}` : `Scene ${scene.order}`}
                                </p>
                                <h5 className="mt-1 text-sm font-medium text-text-main">{scene.title}</h5>
                                <p className="mt-2 text-sm leading-6 text-text-muted">{scene.summary}</p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Badge tone={scene.isMissingDraft ? 'danger' : 'neutral'}>{formatWordCount(locale, scene.draftWordCount)}</Badge>
                                <Badge tone={scene.traceReady ? 'success' : 'warn'}>
                                  {scene.traceReady ? (locale === 'zh-CN' ? '溯源已就绪' : 'Trace ready') : locale === 'zh-CN' ? '溯源缺失' : 'Trace missing'}
                                </Badge>
                                {scene.compareDelta ? <Badge tone="neutral">{scene.compareDelta}</Badge> : null}
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                      <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-line-soft pt-3">
                        <button
                          type="button"
                          aria-label={`${locale === 'zh-CN' ? '在 Draft 中打开' : 'Open in Draft'}: ${exportPreview.selectedChapter.title}`}
                          onClick={() => onOpenChapter(exportPreview.selectedChapter!.chapterId, 'draft')}
                          className="rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-2 hover:text-text-main"
                        >
                          {locale === 'zh-CN' ? '在 Draft 中打开' : 'Open in Draft'}
                        </button>
                        <button
                          type="button"
                          aria-label={`${locale === 'zh-CN' ? '在 Structure 中打开' : 'Open in Structure'}: ${exportPreview.selectedChapter.title}`}
                          onClick={() => onOpenChapter(exportPreview.selectedChapter!.chapterId, 'structure')}
                          className="rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-2 hover:text-text-main"
                        >
                          {locale === 'zh-CN' ? '在 Structure 中打开' : 'Open in Structure'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="mt-4">
                      <EmptyState
                        title={locale === 'zh-CN' ? '还没有章节焦点' : 'No chapter selected'}
                        message={locale === 'zh-CN' ? '请选择左侧章节继续检查 package。' : 'Choose a chapter on the left to continue package review.'}
                      />
                    </div>
                  )}
                </section>
                <BookExportReadinessChecklist issues={exportPreview.readiness.issues} onSelectChapter={onSelectChapter} />
              </section>
            </div>
          ) : (
            <div className="rounded-md border border-line-soft bg-surface-1 p-4">
              <EmptyState
                title={locale === 'zh-CN' ? '导出预览不可用' : 'Export preview unavailable'}
                message={
                  errorMessage ??
                  (locale === 'zh-CN'
                    ? '当前导出配置不可用，请检查 export profile 或稍后重试。'
                    : 'The current export profile is unavailable. Check the export profile or retry once the data finishes loading.')
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
