import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FactList } from '@/components/ui/FactList'
import { PaneHeader } from '@/components/ui/PaneHeader'

import { useI18n } from '@/app/i18n'
import type { BookBranchBaseline } from '@/features/workbench/types/workbench-route'

import type {
  BookBranchChapterDeltaViewModel,
  BookBranchSceneDeltaViewModel,
  BookExperimentBranchSummaryViewModel,
  BookExperimentBranchWorkspaceViewModel,
} from '../types/book-branch-view-models'
import { BookExperimentBranchPicker } from './BookExperimentBranchPicker'

interface BookDraftBranchViewProps {
  branchWorkspace: BookExperimentBranchWorkspaceViewModel | null
  branches: BookExperimentBranchSummaryViewModel[]
  selectedBranchId: string
  branchBaseline: BookBranchBaseline
  errorMessage?: string | null
  onSelectChapter: (chapterId: string) => void
  onOpenChapter: (chapterId: string, lens: 'structure' | 'draft') => void
  onSelectBranch: (branchId: string) => void
  onSelectBranchBaseline: (baseline: BookBranchBaseline) => void
}

function trimText(value?: string) {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : undefined
}

function getReadinessBadge(
  locale: 'en' | 'zh-CN',
  status: BookExperimentBranchWorkspaceViewModel['readiness']['status'] | BookBranchChapterDeltaViewModel['readinessStatus'],
) {
  if (status === 'blocked') {
    return { tone: 'danger' as const, label: locale === 'zh-CN' ? '阻塞' : 'Blocked' }
  }

  if (status === 'attention') {
    return { tone: 'warn' as const, label: locale === 'zh-CN' ? '需关注' : 'Attention' }
  }

  return { tone: 'success' as const, label: locale === 'zh-CN' ? '已就绪' : 'Ready' }
}

function getDeltaBadge(locale: 'en' | 'zh-CN', delta: BookBranchSceneDeltaViewModel['delta']) {
  if (delta === 'added') {
    return { tone: 'accent' as const, label: locale === 'zh-CN' ? '新增' : 'Added' }
  }

  if (delta === 'missing') {
    return { tone: 'warn' as const, label: locale === 'zh-CN' ? '分支缺失' : 'Missing' }
  }

  if (delta === 'draft_missing') {
    return { tone: 'danger' as const, label: locale === 'zh-CN' ? '分支缺稿' : 'Draft missing' }
  }

  if (delta === 'changed') {
    return { tone: 'accent' as const, label: locale === 'zh-CN' ? '已变更' : 'Changed' }
  }

  return { tone: 'neutral' as const, label: locale === 'zh-CN' ? '未变化' : 'Unchanged' }
}

function getBaselineLabel(locale: 'en' | 'zh-CN', baseline: BookBranchBaseline) {
  return baseline === 'checkpoint'
    ? locale === 'zh-CN'
      ? 'Checkpoint 基线'
      : 'Checkpoint baseline'
    : locale === 'zh-CN'
      ? '当前正文基线'
      : 'Current baseline'
}

function formatSignedValue(value: number) {
  return `${value > 0 ? '+' : ''}${value}`
}

function renderExcerpt(label: string, value: string | undefined) {
  return (
    <div className="space-y-1 rounded-md border border-line-soft bg-surface-2 p-3">
      <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{label}</p>
      <p className="text-sm leading-6 text-text-muted">{value ?? '—'}</p>
    </div>
  )
}

function buildBranchPreviewChapters(branchWorkspace: BookExperimentBranchWorkspaceViewModel) {
  return branchWorkspace.chapters
    .map((chapter) => ({
      chapterId: chapter.chapterId,
      order: chapter.order,
      title: chapter.title,
      scenes: chapter.sceneDeltas
        .map((scene) => ({
          sceneId: scene.sceneId,
          order: scene.order,
          title: scene.title,
          proseDraft: trimText(scene.branchScene?.proseDraft),
          summary: scene.branchScene?.summary ?? scene.summary,
        }))
        .filter((scene) => scene.proseDraft),
    }))
    .filter((chapter) => chapter.scenes.length > 0)
}

export function BookDraftBranchView({
  branchWorkspace,
  branches,
  selectedBranchId,
  branchBaseline,
  errorMessage = null,
  onSelectChapter,
  onOpenChapter,
  onSelectBranch,
  onSelectBranchBaseline,
}: BookDraftBranchViewProps) {
  const { locale } = useI18n()
  const selectedBranch = branchWorkspace?.branch ?? branches.find((branch) => branch.branchId === selectedBranchId) ?? null
  const branchPreviewChapters = branchWorkspace ? buildBranchPreviewChapters(branchWorkspace) : []

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PaneHeader
        title={locale === 'zh-CN' ? '书籍实验稿' : 'Book experiment branch'}
        description={
          locale === 'zh-CN'
            ? '比较实验稿与基线的章节/场景差异，只保留只读审阅与跳转动作。'
            : 'Review branch deltas against the selected baseline without merge or edit actions.'
        }
      />
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="space-y-4">
          <BookExperimentBranchPicker
            branches={branches}
            selectedBranchId={selectedBranchId}
            branchBaseline={branchBaseline}
            onSelectBranch={onSelectBranch}
            onSelectBranchBaseline={onSelectBranchBaseline}
          />
          {!branchWorkspace ? (
            <section className="rounded-md border border-line-soft bg-surface-1 p-6">
              <EmptyState
                title={locale === 'zh-CN' ? '实验稿不可用' : 'Branch unavailable'}
                message={
                  errorMessage ??
                  (locale === 'zh-CN'
                    ? '请选择其他实验稿，或稍后重新载入。'
                    : 'Choose another branch or retry after the branch data finishes loading.')
                }
              />
            </section>
          ) : (
            <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
              <section className="space-y-4">
                <section className="rounded-md border border-line-soft bg-surface-1 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                        {locale === 'zh-CN' ? '实验稿状态' : 'Branch readiness'}
                      </p>
                      <h4 className="mt-1 text-base text-text-main">{branchWorkspace.readiness.label}</h4>
                      <p className="mt-1 text-sm text-text-muted">{selectedBranch?.title ?? selectedBranchId}</p>
                    </div>
                    <Badge tone={getReadinessBadge(locale, branchWorkspace.readiness.status).tone}>
                      {getReadinessBadge(locale, branchWorkspace.readiness.status).label}
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <FactList
                      items={[
                        {
                          id: 'baseline',
                          label: locale === 'zh-CN' ? '基线' : 'Baseline',
                          value: branchWorkspace.baseline.label || getBaselineLabel(locale, branchBaseline),
                        },
                        {
                          id: 'changed-chapters',
                          label: locale === 'zh-CN' ? '变更章节' : 'Changed chapters',
                          value: `${branchWorkspace.totals.changedChapterCount}`,
                        },
                        {
                          id: 'changed-scenes',
                          label: locale === 'zh-CN' ? '变更场景' : 'Changed scenes',
                          value: `${branchWorkspace.totals.changedSceneCount}`,
                        },
                        {
                          id: 'word-delta',
                          label: locale === 'zh-CN' ? '字数变化' : 'Word delta',
                          value: formatSignedValue(branchWorkspace.totals.wordDelta),
                        },
                      ]}
                    />
                  </div>
                  {selectedBranch?.summary ? <p className="mt-3 text-sm leading-6 text-text-muted">{selectedBranch.summary}</p> : null}
                  {selectedBranch?.rationale ? <p className="mt-3 text-sm leading-6 text-text-muted">{selectedBranch.rationale}</p> : null}
                </section>
                <section className="rounded-md border border-line-soft bg-surface-1 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base text-text-main">{locale === 'zh-CN' ? '实验稿预览' : 'Branch preview'}</h4>
                      <p className="mt-1 text-sm leading-6 text-text-muted">
                        {locale === 'zh-CN'
                          ? '直接预览当前实验稿的替代手稿，不必先逐场景进入 diff。'
                          : 'Preview the alternate manuscript surface for the selected branch before drilling into scene deltas.'}
                      </p>
                    </div>
                    {selectedBranch ? <Badge tone="accent">{selectedBranch.title}</Badge> : null}
                  </div>
                  <div className="mt-4 space-y-4">
                    {branchPreviewChapters.length > 0 ? (
                      branchPreviewChapters.map((chapter) => (
                        <article key={chapter.chapterId} className="rounded-md border border-line-soft bg-surface-2 p-4">
                          <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                            {locale === 'zh-CN' ? `第 ${chapter.order} 章` : `Chapter ${chapter.order}`}
                          </p>
                          <h5 className="mt-1 text-base text-text-main">{chapter.title}</h5>
                          <div className="mt-3 space-y-3">
                            {chapter.scenes.map((scene) => (
                              <div key={scene.sceneId} className="space-y-2 rounded-md border border-line-soft bg-surface-1 p-3">
                                <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                                  {locale === 'zh-CN' ? `场景 ${scene.order}` : `Scene ${scene.order}`}
                                </p>
                                <p className="text-sm font-medium text-text-main">{scene.title}</p>
                                <p className="whitespace-pre-wrap text-[15px] leading-7 text-text-main">{scene.proseDraft}</p>
                              </div>
                            ))}
                          </div>
                        </article>
                      ))
                    ) : (
                      <EmptyState
                        title={locale === 'zh-CN' ? '还没有可读预览' : 'No readable preview yet'}
                        message={
                          locale === 'zh-CN'
                            ? '当前实验稿还没有可直接阅读的替代手稿内容。'
                            : 'The selected branch does not yet have alternate manuscript prose ready for direct preview.'
                        }
                      />
                    )}
                  </div>
                </section>
                <section className="rounded-md border border-line-soft bg-surface-1 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base text-text-main">{locale === 'zh-CN' ? '章节差异' : 'Chapter deltas'}</h4>
                      <p className="mt-1 text-sm leading-6 text-text-muted">
                        {locale === 'zh-CN'
                          ? '点击章节切换右侧 scene delta 详情。'
                          : 'Choose a chapter to update the scene delta detail on the right.'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {branchWorkspace.chapters.map((chapter) => {
                      const active = chapter.chapterId === branchWorkspace.selectedChapterId
                      const readiness = getReadinessBadge(locale, chapter.readinessStatus)

                      return (
                        <article
                          key={chapter.chapterId}
                          className={`rounded-md border ${
                            active ? 'border-line-strong bg-surface-1 shadow-sm' : 'border-line-soft bg-surface-2'
                          }`}
                        >
                          <button
                            type="button"
                            aria-pressed={active}
                            aria-label={`${locale === 'zh-CN' ? `第 ${chapter.order} 章` : `Chapter ${chapter.order}`} ${chapter.title}`}
                            onClick={() => onSelectChapter(chapter.chapterId)}
                            className="w-full rounded-md px-4 py-4 text-left"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                                  {locale === 'zh-CN' ? `第 ${chapter.order} 章` : `Chapter ${chapter.order}`}
                                </p>
                                <h5 className="mt-1 text-base text-text-main">{chapter.title}</h5>
                                <p className="mt-2 text-sm leading-6 text-text-muted">{chapter.summary}</p>
                              </div>
                              <Badge tone={readiness.tone}>{readiness.label}</Badge>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Badge tone="neutral">
                                {locale === 'zh-CN' ? `变更 ${chapter.changedSceneCount}` : `Changed ${chapter.changedSceneCount}`}
                              </Badge>
                              <Badge tone="neutral">
                                {locale === 'zh-CN' ? `新增 ${chapter.addedSceneCount}` : `Added ${chapter.addedSceneCount}`}
                              </Badge>
                              <Badge tone={chapter.draftMissingSceneCount > 0 ? 'danger' : 'neutral'}>
                                {locale === 'zh-CN'
                                  ? `缺稿 ${chapter.draftMissingSceneCount}`
                                  : `Draft missing ${chapter.draftMissingSceneCount}`}
                              </Badge>
                              <Badge tone={chapter.traceRegressionCount > 0 ? 'warn' : 'success'}>
                                {locale === 'zh-CN'
                                  ? `溯源回退 ${chapter.traceRegressionCount}`
                                  : `Trace regressions ${chapter.traceRegressionCount}`}
                              </Badge>
                            </div>
                          </button>
                        </article>
                      )
                    })}
                  </div>
                </section>
              </section>
              <section className="space-y-4">
                <section className="rounded-md border border-line-soft bg-surface-1 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                        {locale === 'zh-CN' ? '选中章节' : 'Selected chapter'}
                      </p>
                      <h4 className="mt-1 text-base text-text-main">
                        {branchWorkspace.selectedChapter?.title ?? branchWorkspace.title}
                      </h4>
                    </div>
                    {branchWorkspace.selectedChapter ? (
                      <Badge tone={getReadinessBadge(locale, branchWorkspace.selectedChapter.readinessStatus).tone}>
                        {getReadinessBadge(locale, branchWorkspace.selectedChapter.readinessStatus).label}
                      </Badge>
                    ) : null}
                  </div>
                  <h5 className="mt-4 text-sm font-medium text-text-main">
                    {locale === 'zh-CN' ? '选中章节差异' : 'Selected chapter delta'}
                  </h5>
                  {branchWorkspace.selectedChapter ? (
                    <>
                      <p className="mt-2 text-sm leading-6 text-text-muted">{branchWorkspace.selectedChapter.summary}</p>
                      <div className="mt-3">
                        <FactList
                          items={[
                            {
                              id: 'selected-word-delta',
                              label: locale === 'zh-CN' ? '字数变化' : 'Word delta',
                              value: formatSignedValue(branchWorkspace.selectedChapter.wordDelta),
                            },
                            {
                              id: 'selected-warning-delta',
                              label: locale === 'zh-CN' ? '警告变化' : 'Warnings delta',
                              value: formatSignedValue(branchWorkspace.selectedChapter.warningsDelta),
                            },
                            {
                              id: 'selected-source-delta',
                              label: locale === 'zh-CN' ? '来源提案变化' : 'Source proposals delta',
                              value: formatSignedValue(branchWorkspace.selectedChapter.sourceProposalDelta),
                            },
                            {
                              id: 'selected-trace-improvement',
                              label: locale === 'zh-CN' ? '溯源改善' : 'Trace improvements',
                              value: `${branchWorkspace.selectedChapter.traceImprovementCount}`,
                            },
                          ]}
                        />
                      </div>
                      <div className="mt-4 space-y-3">
                        {branchWorkspace.selectedChapter.sceneDeltas.map((scene) => {
                          const delta = getDeltaBadge(locale, scene.delta)

                          return (
                            <article key={scene.sceneId} className="rounded-md border border-line-soft bg-surface-2 p-4">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                                    {locale === 'zh-CN' ? `场景 ${scene.order}` : `Scene ${scene.order}`}
                                  </p>
                                  <h5 className="mt-1 text-base text-text-main">{scene.title}</h5>
                                  <p className="mt-2 text-sm leading-6 text-text-muted">{scene.summary}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge tone={delta.tone}>{delta.label}</Badge>
                                  <Badge tone="neutral">
                                    {locale === 'zh-CN' ? `字数 ${formatSignedValue(scene.wordDelta)}` : `Word delta ${formatSignedValue(scene.wordDelta)}`}
                                  </Badge>
                                </div>
                              </div>
                              <div className="mt-3 grid gap-3 md:grid-cols-2">
                                {renderExcerpt(locale === 'zh-CN' ? '实验稿摘录' : 'Branch excerpt', scene.branchExcerpt)}
                                {renderExcerpt(
                                  branchWorkspace.baseline.kind === 'checkpoint'
                                    ? locale === 'zh-CN'
                                      ? 'Checkpoint 摘录'
                                      : 'Checkpoint excerpt'
                                    : locale === 'zh-CN'
                                      ? '当前正文摘录'
                                      : 'Current excerpt',
                                  scene.baselineExcerpt,
                                )}
                              </div>
                            </article>
                          )
                        })}
                      </div>
                      <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-line-soft pt-3">
                        <button
                          type="button"
                          aria-label={`${locale === 'zh-CN' ? '在 Draft 中打开' : 'Open in Draft'}: ${branchWorkspace.selectedChapter.title}`}
                          onClick={() => onOpenChapter(branchWorkspace.selectedChapter!.chapterId, 'draft')}
                          className="rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-2 hover:text-text-main"
                        >
                          {locale === 'zh-CN' ? '在 Draft 中打开' : 'Open in Draft'}
                        </button>
                        <button
                          type="button"
                          aria-label={`${locale === 'zh-CN' ? '在 Structure 中打开' : 'Open in Structure'}: ${branchWorkspace.selectedChapter.title}`}
                          onClick={() => onOpenChapter(branchWorkspace.selectedChapter!.chapterId, 'structure')}
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
                        message={
                          locale === 'zh-CN'
                            ? '请先从左侧章节列表选择一个章节。'
                            : 'Choose a chapter on the left to continue branch review.'
                        }
                      />
                    </div>
                  )}
                </section>
                <section className="rounded-md border border-line-soft bg-surface-1 p-4">
                  <h4 className="text-base text-text-main">{locale === 'zh-CN' ? '复核关注点' : 'Review attention'}</h4>
                  <div className="mt-3 space-y-3">
                    {branchWorkspace.readiness.issues.length > 0 ? (
                      branchWorkspace.readiness.issues.slice(0, 4).map((issue) => (
                        <div key={issue.id} className="rounded-md border border-line-soft bg-surface-2 p-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="text-sm font-medium text-text-main">{issue.title}</p>
                            <Badge tone={issue.severity === 'blocker' ? 'danger' : issue.severity === 'warning' ? 'warn' : 'neutral'}>
                              {issue.severity === 'blocker'
                                ? locale === 'zh-CN'
                                  ? '阻塞'
                                  : 'Blocker'
                                : issue.severity === 'warning'
                                  ? locale === 'zh-CN'
                                    ? '警告'
                                    : 'Warning'
                                  : locale === 'zh-CN'
                                    ? '信息'
                                    : 'Info'}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-text-muted">{issue.detail}</p>
                        </div>
                      ))
                    ) : (
                      <EmptyState
                        title={locale === 'zh-CN' ? '当前没有额外问题' : 'No additional issues'}
                        message={
                          locale === 'zh-CN'
                            ? '当前实验稿相对基线没有新的阻塞或警告。'
                            : 'The current branch has no additional blockers or warnings against the baseline.'
                        }
                      />
                    )}
                  </div>
                </section>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
