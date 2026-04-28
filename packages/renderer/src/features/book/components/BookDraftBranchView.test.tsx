import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'
import { APP_LOCALE_STORAGE_KEY } from '@/app/i18n'

import { mockBookExperimentBranchSeeds } from '../api/book-experiment-branches'
import { mockBookManuscriptCheckpointSeeds } from '../api/book-manuscript-checkpoints'
import { buildBookExperimentBranchWorkspace, normalizeBookExperimentBranch } from '../lib/book-experiment-branch-mappers'
import type { BookDraftWorkspaceViewModel } from '../types/book-draft-view-models'
import { BookDraftBranchView } from './BookDraftBranchView'

function createWorkspace(selectedChapterId = 'chapter-open-water-signals'): BookDraftWorkspaceViewModel {
  const workspace: BookDraftWorkspaceViewModel = {
    bookId: 'book-signal-arc',
    title: 'Signal Arc',
    summary: 'Current draft workspace',
    selectedChapterId,
    assembledWordCount: 116,
    draftedChapterCount: 2,
    missingDraftChapterCount: 0,
    selectedChapter: null,
    inspector: {
      selectedChapter: null,
      readiness: {
        draftedChapterCount: 2,
        missingDraftChapterCount: 0,
        assembledWordCount: 116,
        warningHeavyChapterCount: 2,
        missingTraceChapterCount: 1,
      },
      signals: {
        topMissingScenes: [],
        latestDiffSummaries: ['Warehouse handoff tightened'],
        traceCoverageNote: 'Current trace coverage is uneven in the handoff chapter.',
      },
    },
    dockSummary: {
      missingDraftChapterCount: 0,
      missingTraceChapterCount: 1,
      warningsChapterCount: 2,
      queuedRevisionChapterCount: 1,
      highestPressureChapters: [],
      missingDraftChapters: [],
      missingTraceChapters: [],
      warningsChapters: [],
      queuedRevisionChapters: [],
    },
    chapters: [
      {
        chapterId: 'chapter-signals-in-rain',
        order: 1,
        title: 'Signals in Rain',
        summary: 'Station pressure chapter',
        sceneCount: 3,
        draftedSceneCount: 3,
        missingDraftCount: 0,
        assembledWordCount: 61,
        warningsCount: 1,
        queuedRevisionCount: 0,
        tracedSceneCount: 3,
        missingTraceSceneCount: 0,
        assembledProseSections: [],
        coverageStatus: 'ready',
        sections: [
          {
            sceneId: 'scene-midnight-platform',
            order: 1,
            title: 'Midnight Platform',
            summary: 'Public bargaining at the platform edge.',
            proseDraft: 'Ren keeps the ledger in sight while Mei bargains in the rain and counts who is listening.',
            draftWordCount: 16,
            isMissingDraft: false,
            warningsCount: 0,
            revisionQueueCount: 0,
            traceReady: true,
            relatedAssetCount: 2,
            sourceProposalCount: 2,
          },
          {
            sceneId: 'scene-concourse-delay',
            order: 2,
            title: 'Concourse Delay',
            summary: 'Crowd pressure delays the exit.',
            proseDraft: 'The crowd slows the courier lane long enough for Mei to hide one last instruction inside the delay.',
            draftWordCount: 17,
            isMissingDraft: false,
            warningsCount: 1,
            revisionQueueCount: 0,
            traceReady: true,
            relatedAssetCount: 1,
            sourceProposalCount: 1,
          },
          {
            sceneId: 'scene-departure-bell',
            order: 3,
            title: 'Departure Bell',
            summary: 'The bell lands as a drafted exit beat.',
            proseDraft: 'The departure bell closes the platform scene with a clear drafted release instead of a placeholder.',
            draftWordCount: 15,
            isMissingDraft: false,
            warningsCount: 1,
            revisionQueueCount: 0,
            traceReady: true,
            relatedAssetCount: 0,
            sourceProposalCount: 1,
          },
        ],
      },
      {
        chapterId: 'chapter-open-water-signals',
        order: 2,
        title: 'Open Water Signals',
        summary: 'Waterfront handoff chapter',
        sceneCount: 3,
        draftedSceneCount: 3,
        missingDraftCount: 0,
        assembledWordCount: 55,
        warningsCount: 1,
        queuedRevisionCount: 1,
        tracedSceneCount: 2,
        missingTraceSceneCount: 1,
        assembledProseSections: [],
        coverageStatus: 'attention',
        sections: [
          {
            sceneId: 'scene-warehouse-bridge',
            order: 1,
            title: 'Warehouse Bridge',
            summary: 'The first handoff happens at the warehouse bridge.',
            proseDraft: 'Leya keeps the package moving and leaves the bridge before the owner can force a full confession.',
            draftWordCount: 15,
            isMissingDraft: false,
            warningsCount: 1,
            revisionQueueCount: 1,
            traceReady: false,
            relatedAssetCount: 1,
            sourceProposalCount: 1,
          },
          {
            sceneId: 'scene-canal-watch',
            order: 2,
            title: 'Canal Watch',
            summary: 'The watcher keeps the exchange visible.',
            proseDraft: 'The canal watcher tracks the package handoff and keeps the escape route exposed to everyone on the bridge.',
            draftWordCount: 17,
            isMissingDraft: false,
            warningsCount: 0,
            revisionQueueCount: 0,
            traceReady: true,
            relatedAssetCount: 1,
            sourceProposalCount: 1,
          },
          {
            sceneId: 'scene-dawn-slip',
            order: 3,
            title: 'Dawn Slip',
            summary: 'A quiet withdrawal before sunrise.',
            proseDraft: 'At dawn the crew clears the channel and hides the package trail before the harbor shifts awake.',
            draftWordCount: 15,
            isMissingDraft: false,
            warningsCount: 0,
            revisionQueueCount: 0,
            traceReady: false,
            relatedAssetCount: 0,
            sourceProposalCount: 0,
          },
        ],
      },
    ],
  }

  workspace.selectedChapter = workspace.chapters.find((chapter) => chapter.chapterId === selectedChapterId) ?? workspace.chapters[0]!

  return workspace
}

function buildBranchWorkspace(
  branchId: string,
  branchBaseline: 'current' | 'checkpoint' = 'current',
  selectedChapterId = 'chapter-open-water-signals',
) {
  return buildBookExperimentBranchWorkspace({
    currentDraftWorkspace: createWorkspace(selectedChapterId),
    branch: mockBookExperimentBranchSeeds['book-signal-arc']!.find((branch) => branch.branchId === branchId)!,
    branches: mockBookExperimentBranchSeeds['book-signal-arc']!,
    checkpoint: branchBaseline === 'checkpoint' ? mockBookManuscriptCheckpointSeeds['book-signal-arc']![0]! : null,
    branchBaseline,
    selectedChapterId,
    locale: 'en',
  })
}

const branches = mockBookExperimentBranchSeeds['book-signal-arc']!.map((record) => normalizeBookExperimentBranch(record, 'en'))

describe('BookDraftBranchView', () => {
  afterEach(() => {
    window.localStorage.removeItem(APP_LOCALE_STORAGE_KEY)
  })

  it('renders branch deltas and lets the user switch chapter focus', async () => {
    const user = userEvent.setup()
    const onSelectChapter = vi.fn()

    render(
      <AppProviders>
        <BookDraftBranchView
          branchWorkspace={buildBranchWorkspace('branch-book-signal-arc-quiet-ending')}
          branches={branches}
          selectedBranchId="branch-book-signal-arc-quiet-ending"
          branchBaseline="current"
          onSelectChapter={onSelectChapter}
          onOpenChapter={vi.fn()}
          onSelectBranch={vi.fn()}
          onSelectBranchBaseline={vi.fn()}
        />
      </AppProviders>,
    )

    expect(screen.getByRole('heading', { name: 'Book experiment branch' })).toBeInTheDocument()
    expect(screen.getAllByText('Quiet Ending').length).toBeGreaterThan(0)
    expect(screen.getByText('Branch preview')).toBeInTheDocument()
    expect(screen.getByText('Midnight Platform')).toBeInTheDocument()
    expect(screen.getByText(/lets the platform bargain land softer/i)).toBeInTheDocument()
    expect(screen.getByText('Selected chapter delta')).toBeInTheDocument()
    expect(screen.getAllByText('Warehouse Bridge').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: 'Chapter 1 Signals in Rain' }))

    expect(onSelectChapter).toHaveBeenCalledWith('chapter-signals-in-rain')
  })

  it('only exposes secondary open actions for the selected chapter', async () => {
    const user = userEvent.setup()
    const onOpenChapter = vi.fn()

    render(
      <AppProviders>
        <BookDraftBranchView
          branchWorkspace={buildBranchWorkspace('branch-book-signal-arc-quiet-ending')}
          branches={branches}
          selectedBranchId="branch-book-signal-arc-quiet-ending"
          branchBaseline="current"
          onSelectChapter={vi.fn()}
          onOpenChapter={onOpenChapter}
          onSelectBranch={vi.fn()}
          onSelectBranchBaseline={vi.fn()}
        />
      </AppProviders>,
    )

    expect(screen.queryByRole('button', { name: /Merge/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Accept/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Reject/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open in Draft: Open Water Signals' }))
    await user.click(screen.getByRole('button', { name: 'Open in Structure: Open Water Signals' }))

    expect(onOpenChapter).toHaveBeenNthCalledWith(1, 'chapter-open-water-signals', 'draft')
    expect(onOpenChapter).toHaveBeenNthCalledWith(2, 'chapter-open-water-signals', 'structure')
  })

  it('renders selective adopt controls with visible disabled reasons and optional action handlers', async () => {
    const user = userEvent.setup()
    const onAdoptScene = vi.fn()
    const branchWorkspace = buildBookExperimentBranchWorkspace({
      currentDraftWorkspace: createWorkspace('chapter-signals-in-rain'),
      branch: mockBookExperimentBranchSeeds['book-signal-arc']!.find((branch) => branch.branchId === 'branch-book-signal-arc-high-pressure')!,
      branches: mockBookExperimentBranchSeeds['book-signal-arc']!,
      checkpoint: null,
      branchBaseline: 'current',
      selectedChapterId: 'chapter-signals-in-rain',
      locale: 'en',
    })

    render(
      <AppProviders>
        <BookDraftBranchView
          branchWorkspace={branchWorkspace}
          branches={branches}
          selectedBranchId="branch-book-signal-arc-high-pressure"
          branchBaseline="current"
          onSelectChapter={vi.fn()}
          onOpenChapter={vi.fn()}
          onSelectBranch={vi.fn()}
          onSelectBranchBaseline={vi.fn()}
          onAdoptScene={onAdoptScene}
        />
      </AppProviders>,
    )

    await user.click(screen.getByRole('button', { name: 'Adopt canon patch: Midnight Platform' }))

    expect(onAdoptScene).toHaveBeenCalledWith({
      branchId: 'branch-book-signal-arc-high-pressure',
      bookId: 'book-signal-arc',
      chapterId: 'chapter-signals-in-rain',
      sceneId: 'scene-midnight-platform',
      kind: 'canon_patch',
    })
    expect(screen.getByRole('button', { name: 'Adopt prose draft: Departure Bell' })).toBeDisabled()
    expect(screen.getByText('Branch prose draft is empty for this scene.')).toBeInTheDocument()
  })

  it('shows trace and source-proposal reasons before canon-patch adoption can run', () => {
    render(
      <AppProviders>
        <BookDraftBranchView
          branchWorkspace={buildBranchWorkspace('branch-book-signal-arc-high-pressure', 'current', 'chapter-open-water-signals')}
          branches={branches}
          selectedBranchId="branch-book-signal-arc-high-pressure"
          branchBaseline="current"
          onSelectChapter={vi.fn()}
          onOpenChapter={vi.fn()}
          onSelectBranch={vi.fn()}
          onSelectBranchBaseline={vi.fn()}
          onAdoptScene={vi.fn()}
        />
      </AppProviders>,
    )

    expect(screen.getByRole('button', { name: 'Adopt canon patch: Warehouse Bridge' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Adopt canon patch: Pressure Slip' })).toBeDisabled()
    expect(screen.getAllByText('Trace is not ready for this scene.').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/No source proposals are available/).length).toBeGreaterThan(0)
  })

  it('disables selective adoption when the branch is archived', () => {
    const branchWorkspace = buildBranchWorkspace('branch-book-signal-arc-quiet-ending')
    branchWorkspace.branch = {
      ...branchWorkspace.branch!,
      status: 'archived',
    }

    render(
      <AppProviders>
        <BookDraftBranchView
          branchWorkspace={branchWorkspace}
          branches={branches.map((branch) =>
            branch.branchId === 'branch-book-signal-arc-quiet-ending' ? { ...branch, status: 'archived' } : branch,
          )}
          selectedBranchId="branch-book-signal-arc-quiet-ending"
          branchBaseline="current"
          onSelectChapter={vi.fn()}
          onOpenChapter={vi.fn()}
          onSelectBranch={vi.fn()}
          onSelectBranchBaseline={vi.fn()}
          onAdoptScene={vi.fn()}
        />
      </AppProviders>,
    )

    expect(screen.getByRole('button', { name: 'Adopt canon patch: Warehouse Bridge' })).toBeDisabled()
    expect(screen.getAllByText('Archived branches cannot adopt into the draft.').length).toBeGreaterThan(0)
  })

  it('renders blocked readiness details for the high-pressure branch', () => {
    render(
      <AppProviders>
        <BookDraftBranchView
          branchWorkspace={buildBranchWorkspace('branch-book-signal-arc-high-pressure')}
          branches={branches}
          selectedBranchId="branch-book-signal-arc-high-pressure"
          branchBaseline="current"
          onSelectChapter={vi.fn()}
          onOpenChapter={vi.fn()}
          onSelectBranch={vi.fn()}
          onSelectBranchBaseline={vi.fn()}
        />
      </AppProviders>,
    )

    expect(screen.getByText('Branch blocked')).toBeInTheDocument()
    expect(screen.getByText('Draft is missing')).toBeInTheDocument()
  })

  it('keeps the picker visible when the selected branch is unavailable', () => {
    render(
      <AppProviders>
        <BookDraftBranchView
          branchWorkspace={null}
          branches={branches}
          selectedBranchId="branch-missing"
          branchBaseline="checkpoint"
          errorMessage='Book experiment branch "branch-missing" could not be found for "book-signal-arc".'
          onSelectChapter={vi.fn()}
          onOpenChapter={vi.fn()}
          onSelectBranch={vi.fn()}
          onSelectBranchBaseline={vi.fn()}
        />
      </AppProviders>,
    )

    expect(screen.getByText('Branch unavailable')).toBeInTheDocument()
    expect(screen.getAllByText(/branch-missing/).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Checkpoint baseline' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('uses the corrected zh-CN missing-scene label for baseline-only scenes', () => {
    window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, 'zh-CN')

    render(
      <AppProviders>
        <BookDraftBranchView
          branchWorkspace={buildBranchWorkspace('branch-book-signal-arc-quiet-ending')}
          branches={mockBookExperimentBranchSeeds['book-signal-arc']!.map((record) => normalizeBookExperimentBranch(record, 'zh-CN'))}
          selectedBranchId="branch-book-signal-arc-quiet-ending"
          branchBaseline="current"
          onSelectChapter={vi.fn()}
          onOpenChapter={vi.fn()}
          onSelectBranch={vi.fn()}
          onSelectBranchBaseline={vi.fn()}
        />
      </AppProviders>,
    )

    expect(screen.getAllByText('分支缺失').length).toBeGreaterThan(0)
  })
})
