import type { Meta, StoryObj } from '@storybook/react'

import { getWorkbenchLensLabel, useI18n } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { WorkbenchShell } from '@/features/workbench/components/WorkbenchShell'

import { BookDraftBinderPane } from '../components/BookDraftBinderPane'
import { BookDraftInspectorPane } from '../components/BookDraftInspectorPane'
import { BookDraftBottomDock } from '../components/BookDraftBottomDock'
import { BookDraftStage } from '../components/BookDraftStage'
import { BookModeRail } from '../components/BookModeRail'
import {
  BookStoryShell,
  type BookStoryVariant,
} from '../components/book-storybook'
import {
  buildBookDraftBranchProblemsStoryData,
  buildBookDraftBranchStoryData,
  buildBookDraftCompareStoryData,
  buildBookDraftExportStoryData,
  buildBookDraftStoryActivity,
  useLocalizedBookDraftWorkspace,
} from '../components/book-draft-storybook'
import { buildBookDraftExportBaselineError } from '../components/book-draft-storybook'
import type { BookDraftExportProblems } from '../components/BookDraftBottomDock'
import type { BookExportPreviewWorkspaceViewModel } from '../types/book-export-view-models'

interface BookDraftWorkspaceStoryProps {
  variant?: BookStoryVariant
  selectedChapterId?: string
  checkpointId?: string
  branchId?: string
  branchBaseline?: 'current' | 'checkpoint'
  exportProfileId?: string
  draftView?: 'read' | 'compare' | 'export' | 'branch'
  exportState?: 'ready' | 'error'
}

function buildExportProblems(exportPreview: BookExportPreviewWorkspaceViewModel | null): BookDraftExportProblems | null {
  if (!exportPreview) {
    return null
  }

  const blockers = exportPreview.readiness.issues.filter((issue) => issue.severity === 'blocker')
  const warnings = exportPreview.readiness.issues.filter((issue) => issue.severity === 'warning')
  const traceGaps = exportPreview.readiness.issues.filter((issue) => issue.kind === 'trace_gap')
  const missingDrafts = exportPreview.readiness.issues.filter((issue) => issue.kind === 'missing_draft')
  const compareRegressions = exportPreview.readiness.issues.filter((issue) => issue.kind === 'compare_regression')
  const toItems = (issues: typeof blockers) =>
    issues.map((issue) => ({
      chapterId: issue.id,
      title: issue.chapterTitle ?? exportPreview.title,
      detail: issue.detail,
    }))

  return {
    blockerCount: blockers.length,
    warningCount: warnings.length,
    traceGapCount: traceGaps.length,
    missingDraftCount: missingDrafts.length,
    compareRegressionCount: compareRegressions.length,
    blockers: toItems(blockers),
    warnings: toItems(warnings),
    traceGaps: toItems(traceGaps),
    missingDrafts: toItems(missingDrafts),
    compareRegressions: toItems(compareRegressions),
  }
}

function WorkspacePreview({
  variant = 'default',
  selectedChapterId,
  checkpointId,
  branchId,
  branchBaseline = 'current',
  exportProfileId,
  draftView = 'read',
  exportState = 'ready',
}: BookDraftWorkspaceStoryProps) {
  const { locale } = useI18n()
  const workspace = useLocalizedBookDraftWorkspace({ variant, selectedChapterId })
  const compareData = buildBookDraftCompareStoryData(locale, { variant, selectedChapterId, checkpointId })
  const branchData = buildBookDraftBranchStoryData(locale, { variant, selectedChapterId, branchId, branchBaseline, checkpointId })
  const exportData = buildBookDraftExportStoryData(locale, { variant, selectedChapterId, checkpointId, exportProfileId })
  const exportError = draftView === 'export' && exportState === 'error' ? buildBookDraftExportBaselineError() : null
  const effectiveExportPreview = exportError ? null : exportData.exportWorkspace
  const activity = buildBookDraftStoryActivity(locale, workspace, {
    quiet: variant === 'quiet-book' && draftView === 'read',
    draftView,
    checkpointTitle: compareData.selectedCheckpoint.title,
    branchTitle: branchData.selectedBranch.title,
    branchSummary: branchData.selectedBranch.rationale,
    branchBaselineTitle: branchData.branchWorkspace.baseline.label,
    branchBaselineKind: branchData.branchWorkspace.baseline.kind,
    branchBaselineCheckpointId: branchData.branchWorkspace.baseline.checkpointId,
    exportProfileTitle: exportData.selectedExportProfile.title,
    exportProfileSummary: exportData.selectedExportProfile.summary,
  })

  return (
    <WorkbenchShell
      topBar={
        <div className="flex h-full flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
              {locale === 'zh-CN' ? '叙事工作台' : 'Narrative workbench'}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg leading-tight text-text-main">{locale === 'zh-CN' ? '书籍手稿' : 'Book manuscript'}</h1>
              <Badge tone="neutral">{locale === 'zh-CN' ? '书籍' : 'Book'}</Badge>
              <Badge tone="accent">{getWorkbenchLensLabel(locale, 'draft')}</Badge>
            </div>
            <p className="text-sm text-text-muted">
              {workspace.title} / {getWorkbenchLensLabel(locale, 'draft')} / {workspace.selectedChapter?.title}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{locale === 'zh-CN' ? `合计 ${workspace.assembledWordCount} 词` : `${workspace.assembledWordCount} words`}</Badge>
            <Badge tone={workspace.missingDraftChapterCount > 0 ? 'warn' : 'success'}>
              {locale === 'zh-CN' ? `缺稿 ${workspace.missingDraftChapterCount}` : `Missing ${workspace.missingDraftChapterCount}`}
            </Badge>
          </div>
        </div>
      }
      modeRail={<BookModeRail activeScope="book" activeLens="draft" onSelectScope={() => undefined} onSelectLens={() => undefined} />}
      navigator={<BookDraftBinderPane workspace={workspace} onSelectChapter={() => undefined} onOpenChapter={() => undefined} />}
      mainStage={
        <BookDraftStage
          draftView={draftView}
          workspace={workspace}
          compare={compareData.compare}
          branchWorkspace={draftView === 'branch' ? branchData.branchWorkspace : null}
          branchError={null}
          branches={branchData.branches}
          selectedBranchId={branchData.selectedBranch.branchId}
          branchBaseline={branchBaseline}
          exportPreview={draftView === 'export' ? effectiveExportPreview : null}
          exportProfiles={exportData.exportProfiles}
          selectedExportProfileId={exportData.selectedExportProfile.exportProfileId}
          exportError={exportError}
          checkpoints={compareData.checkpoints}
          selectedCheckpointId={compareData.selectedCheckpoint.checkpointId}
          onSelectDraftView={() => undefined}
          onSelectChapter={() => undefined}
          onOpenChapter={() => undefined}
          onSelectCheckpoint={() => undefined}
          onSelectBranch={() => undefined}
          onSelectBranchBaseline={() => undefined}
          onSelectExportProfile={() => undefined}
        />
      }
      inspector={
        <BookDraftInspectorPane
          bookTitle={workspace.title}
          inspector={workspace.inspector}
          activeDraftView={draftView}
          compare={draftView === 'compare' ? compareData.compare : null}
          branch={draftView === 'branch' ? branchData.branchWorkspace : null}
          exportPreview={draftView === 'export' ? effectiveExportPreview : null}
          exportError={exportError}
          checkpointMeta={draftView === 'compare' ? compareData.selectedCheckpoint : null}
        />
      }
      bottomDock={
        <BookDraftBottomDock
          summary={workspace.dockSummary}
          activity={activity}
          activeDraftView={draftView}
          compareProblems={draftView === 'compare' ? compareData.compareProblems : null}
          branchProblems={draftView === 'branch' ? buildBookDraftBranchProblemsStoryData(locale, branchData.branchWorkspace) : null}
          exportProblems={draftView === 'export' ? buildExportProblems(effectiveExportPreview) : null}
          exportError={exportError}
        />
      }
    />
  )
}

const meta = {
  title: 'Mockups/Book/BookDraftWorkspace',
  component: WorkspacePreview,
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <BookStoryShell frameClassName="min-h-[780px]">
      <WorkspacePreview {...args} />
    </BookStoryShell>
  ),
  args: {
    variant: 'default',
    draftView: 'read',
    exportState: 'ready',
  },
} satisfies Meta<typeof WorkspacePreview>

export default meta

type Story = StoryObj<typeof meta>

export const ReadDefault: Story = {}

export const CompareDefault: Story = {
  args: {
    draftView: 'compare',
  },
}

export const CompareSelectedSecondChapter: Story = {
  args: {
    draftView: 'compare',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const CompareMissingDrafts: Story = {
  args: {
    draftView: 'compare',
    variant: 'default',
    selectedChapterId: 'chapter-signals-in-rain',
  },
}

export const CompareTraceRegression: Story = {
  args: {
    draftView: 'compare',
    variant: 'missing-trace-attention',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const CompareQuietCheckpoint: Story = {
  args: {
    draftView: 'compare',
    checkpointId: 'checkpoint-book-signal-arc-quiet-pass',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const QuietBookDraft: Story = {
  args: {
    draftView: 'read',
    variant: 'quiet-book',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const ExportReviewPacket: Story = {
  args: {
    draftView: 'export',
    exportProfileId: 'export-review-packet',
  },
}

export const ExportSubmissionPreview: Story = {
  args: {
    draftView: 'export',
    exportProfileId: 'export-submission-preview',
  },
}

export const ExportArchiveSnapshot: Story = {
  args: {
    draftView: 'export',
    exportProfileId: 'export-archive-snapshot',
  },
}

export const ExportBlockedByMissingDraft: Story = {
  args: {
    draftView: 'export',
    variant: 'default',
    exportProfileId: 'export-review-packet',
  },
}

export const ExportBlockedByTraceGap: Story = {
  args: {
    draftView: 'export',
    variant: 'missing-trace-attention',
    exportProfileId: 'export-review-packet',
  },
}

export const ExportWarningsOnly: Story = {
  args: {
    draftView: 'export',
    variant: 'signals-heavy',
    exportProfileId: 'export-archive-snapshot',
  },
}

export const ExportReady: Story = {
  args: {
    draftView: 'export',
    variant: 'quiet-book',
    checkpointId: 'checkpoint-book-signal-arc-quiet-pass',
    exportProfileId: 'export-review-packet',
  },
}

export const BranchCurrentBaselineQuietEnding: Story = {
  args: {
    draftView: 'branch',
    branchId: 'branch-book-signal-arc-quiet-ending',
    branchBaseline: 'current',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const BranchCheckpointBaselineHighPressure: Story = {
  args: {
    draftView: 'branch',
    branchId: 'branch-book-signal-arc-high-pressure',
    branchBaseline: 'checkpoint',
    checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
    selectedChapterId: 'chapter-signals-in-rain',
  },
}

export const BranchBlockedMissingDraft: Story = {
  args: {
    draftView: 'branch',
    branchId: 'branch-book-signal-arc-high-pressure',
    branchBaseline: 'checkpoint',
    checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const BranchTraceImprovedQuietEnding: Story = {
  args: {
    draftView: 'branch',
    branchId: 'branch-book-signal-arc-quiet-ending',
    branchBaseline: 'checkpoint',
    checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
    variant: 'missing-trace-attention',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const ExportBaselineUnavailable: Story = {
  args: {
    draftView: 'export',
    exportState: 'error',
    checkpointId: 'checkpoint-missing',
    exportProfileId: 'export-review-packet',
  },
}
