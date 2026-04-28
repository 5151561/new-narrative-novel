import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'
import type { ReviewIssueViewModel, ReviewSourceHandoffViewModel } from '@/features/review/types/review-view-models'

import { ReviewSourceFixControls } from './ReviewSourceFixControls'

const primaryHandoff: ReviewSourceHandoffViewModel = {
  id: 'compare-delta-book',
  label: 'Open compare review',
  target: {
    scope: 'book',
    lens: 'draft',
    view: 'sequence',
    draftView: 'compare',
    checkpointId: 'checkpoint-1',
    selectedChapterId: 'chapter-1',
    reviewIssueId: 'compare-delta-scene-1',
  },
}

const sceneRewriteHandoff: ReviewSourceHandoffViewModel = {
  id: 'scene-draft-handoff',
  label: 'Open scene draft',
  target: {
    scope: 'scene',
    sceneId: 'scene-1',
    lens: 'draft',
    tab: 'prose',
  },
}

const sceneOrchestrateRewriteHandoff: ReviewSourceHandoffViewModel = {
  id: 'scene-orchestrate-handoff',
  label: 'Open scene orchestrate',
  target: {
    scope: 'scene',
    sceneId: 'scene-1',
    lens: 'orchestrate',
    tab: 'execution',
  },
}

const chapterRewriteHandoffWithoutScene: ReviewSourceHandoffViewModel = {
  id: 'chapter-draft-handoff',
  label: 'Open chapter draft',
  target: {
    scope: 'chapter',
    chapterId: 'chapter-1',
    lens: 'draft',
    view: 'sequence',
  },
}

function createIssue(overrides: Partial<ReviewIssueViewModel> = {}): ReviewIssueViewModel {
  return {
    id: 'compare-delta-scene-1',
    severity: 'warning',
    source: 'compare',
    kind: 'compare_delta',
    title: 'Compare delta needs review',
    detail: 'Scene One changed against the selected checkpoint.',
    recommendation: 'Open compare review and verify the changed passage before carrying it forward.',
    chapterId: 'chapter-1',
    chapterTitle: 'Chapter One',
    chapterOrder: 1,
    sceneId: 'scene-1',
    sceneTitle: 'Scene One',
    sceneOrder: 1,
    sourceLabel: 'Compare checkpoint',
    sourceExcerpt: 'Checkpoint river excerpt.',
    tags: ['Compare delta'],
    issueSignature: 'compare-delta-scene-1::signature',
    decision: {
      status: 'open',
      isStale: false,
    },
    fixAction: {
      status: 'not_started',
      isStale: false,
    },
    handoffs: [primaryHandoff],
    primaryFixHandoff: primaryHandoff,
    ...overrides,
  }
}

function renderControls(issue: ReviewIssueViewModel, handlers = {}) {
  return render(
    <AppProviders>
      <ReviewSourceFixControls
        issue={issue}
        onStartFix={vi.fn()}
        onSetFixStatus={vi.fn()}
        onClearFix={vi.fn()}
        {...handlers}
      />
    </AppProviders>,
  )
}

describe('ReviewSourceFixControls', () => {
  it('starts a not-started source fix with the note and primary handoff', async () => {
    const user = userEvent.setup()
    const onStartFix = vi.fn()
    const issue = createIssue()

    renderControls(issue, { onStartFix })

    expect(screen.getByText('Not started')).toBeInTheDocument()
    expect(screen.getByText('Open compare review · book')).toBeInTheDocument()
    expect(screen.getByText('Rewrite request needs a scene or chapter handoff.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create rewrite request' })).toBeDisabled()

    await user.type(screen.getByLabelText('Source fix note'), 'Use the compare panel.')
    await user.click(screen.getByRole('button', { name: 'Start source fix' }))

    expect(onStartFix).toHaveBeenCalledWith({
      issueId: issue.id,
      issueSignature: issue.issueSignature,
      handoff: primaryHandoff,
      note: 'Use the compare panel.',
    })
  })

  it('disables rewrite request without a note even when a scene handoff exists', async () => {
    const user = userEvent.setup()
    const onSetFixStatus = vi.fn()
    const issue = createIssue({
      primaryFixHandoff: sceneRewriteHandoff,
      handoffs: [sceneRewriteHandoff],
      fixAction: {
        status: 'started',
        sourceHandoffId: sceneRewriteHandoff.id,
        sourceHandoffLabel: sceneRewriteHandoff.label,
        targetScope: 'scene',
        note: '',
        startedAtLabel: '2026-04-19 18:00',
        updatedAtLabel: '2026-04-19 18:00',
        updatedByLabel: 'Editor',
        isStale: false,
      },
    })

    renderControls(issue, { onSetFixStatus })

    const rewriteButton = screen.getByRole('button', { name: 'Create rewrite request' })
    expect(rewriteButton).toBeDisabled()
    expect(screen.getByText('Rewrite request needs a source fix note before it can be submitted.')).toBeInTheDocument()

    await user.click(rewriteButton)
    expect(onSetFixStatus).not.toHaveBeenCalled()
  })

  it('marks a started fix checked or blocked and clears without submitting a note', async () => {
    const user = userEvent.setup()
    const onSetFixStatus = vi.fn()
    const onClearFix = vi.fn()
    const issue = createIssue({
      fixAction: {
        status: 'started',
        sourceHandoffId: primaryHandoff.id,
        sourceHandoffLabel: primaryHandoff.label,
        targetScope: 'book',
        note: 'Review underway.',
        startedAtLabel: '2026-04-19 18:00',
        updatedAtLabel: '2026-04-19 18:00',
        updatedByLabel: 'Editor',
        isStale: false,
      },
    })

    renderControls(issue, { onSetFixStatus, onClearFix })

    expect(screen.getByText('Fix started')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Source fix note'))
    await user.type(screen.getByLabelText('Source fix note'), 'Source now matches.')
    await user.click(screen.getByRole('button', { name: 'Mark fix checked' }))
    await user.click(screen.getByRole('button', { name: 'Block fix' }))
    await user.click(screen.getByRole('button', { name: 'Clear fix action' }))

    expect(onSetFixStatus).toHaveBeenNthCalledWith(1, {
      issueId: issue.id,
      issueSignature: issue.issueSignature,
      status: 'checked',
      handoff: primaryHandoff,
      note: 'Source now matches.',
    })
    expect(onSetFixStatus).toHaveBeenNthCalledWith(2, {
      issueId: issue.id,
      issueSignature: issue.issueSignature,
      status: 'blocked',
      handoff: primaryHandoff,
      note: 'Source now matches.',
    })
    expect(onClearFix).toHaveBeenCalledWith(issue.id)
  })

  it('creates a rewrite request from a scene or chapter handoff', async () => {
    const user = userEvent.setup()
    const onSetFixStatus = vi.fn()
    const issue = createIssue({
      primaryFixHandoff: sceneRewriteHandoff,
      handoffs: [sceneRewriteHandoff],
      fixAction: {
        status: 'started',
        sourceHandoffId: sceneRewriteHandoff.id,
        sourceHandoffLabel: sceneRewriteHandoff.label,
        targetScope: 'scene',
        note: 'Rewrite the prose with the corrected beat order.',
        startedAtLabel: '2026-04-19 18:00',
        updatedAtLabel: '2026-04-19 18:00',
        updatedByLabel: 'Editor',
        isStale: false,
      },
    })

    renderControls(issue, { onSetFixStatus })

    await user.click(screen.getByRole('button', { name: 'Create rewrite request' }))

    expect(onSetFixStatus).toHaveBeenCalledWith({
      issueId: issue.id,
      issueSignature: issue.issueSignature,
      status: 'rewrite_requested',
      handoff: sceneRewriteHandoff,
      note: 'Rewrite the prose with the corrected beat order.',
      rewriteRequestNote: 'Rewrite the prose with the corrected beat order.',
      rewriteTargetSceneId: 'scene-1',
      rewriteRequestId: 'rewrite-request-compare-delta-scene-1',
    })
  })

  it('creates a rewrite request from a non-primary scene handoff when the primary target is book-scoped', async () => {
    const user = userEvent.setup()
    const onSetFixStatus = vi.fn()
    const issue = createIssue({
      fixAction: {
        status: 'started',
        sourceHandoffId: primaryHandoff.id,
        sourceHandoffLabel: primaryHandoff.label,
        targetScope: 'book',
        note: 'Rewrite the scene to keep the proof private.',
        startedAtLabel: '2026-04-19 18:00',
        updatedAtLabel: '2026-04-19 18:00',
        updatedByLabel: 'Editor',
        isStale: false,
      },
      handoffs: [primaryHandoff, sceneOrchestrateRewriteHandoff],
      primaryFixHandoff: primaryHandoff,
    })

    renderControls(issue, { onSetFixStatus })

    expect(screen.queryByText('Rewrite request needs a scene or chapter handoff.')).toBeNull()
    expect(screen.getByRole('button', { name: 'Create rewrite request' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Create rewrite request' }))

    expect(onSetFixStatus).toHaveBeenCalledWith({
      issueId: issue.id,
      issueSignature: issue.issueSignature,
      status: 'rewrite_requested',
      handoff: sceneOrchestrateRewriteHandoff,
      note: 'Rewrite the scene to keep the proof private.',
      rewriteRequestNote: 'Rewrite the scene to keep the proof private.',
      rewriteTargetSceneId: 'scene-1',
      rewriteRequestId: 'rewrite-request-compare-delta-scene-1',
    })
  })

  it('disables rewrite request when a chapter handoff has no scene target', async () => {
    const user = userEvent.setup()
    const onSetFixStatus = vi.fn()
    const issue = createIssue({
      primaryFixHandoff: chapterRewriteHandoffWithoutScene,
      handoffs: [chapterRewriteHandoffWithoutScene],
      fixAction: {
        status: 'started',
        sourceHandoffId: chapterRewriteHandoffWithoutScene.id,
        sourceHandoffLabel: chapterRewriteHandoffWithoutScene.label,
        targetScope: 'chapter',
        note: 'Route this back to the scene before requesting a rewrite.',
        startedAtLabel: '2026-04-19 18:00',
        updatedAtLabel: '2026-04-19 18:00',
        updatedByLabel: 'Editor',
        isStale: false,
      },
    })

    renderControls(issue, { onSetFixStatus })

    const rewriteButton = screen.getByRole('button', { name: 'Create rewrite request' })
    expect(rewriteButton).toBeDisabled()
    expect(screen.getByText('Rewrite request needs a scene target before it can be submitted.')).toBeInTheDocument()

    await user.click(rewriteButton)
    expect(onSetFixStatus).not.toHaveBeenCalled()
  })

  it('renders checked and blocked summaries with clear actions', () => {
    renderControls(
      createIssue({
        fixAction: {
          status: 'checked',
          sourceHandoffId: primaryHandoff.id,
          sourceHandoffLabel: primaryHandoff.label,
          targetScope: 'book',
          note: 'Checked in compare.',
          updatedAtLabel: '2026-04-19 18:10',
          updatedByLabel: 'Editor',
          isStale: false,
        },
      }),
    )

    expect(screen.getByText('Checked')).toBeInTheDocument()
    expect(screen.getByText('Source checked from Open compare review.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear fix action' })).toBeInTheDocument()

    renderControls(
      createIssue({
        id: 'blocked-issue',
        fixAction: {
          status: 'blocked',
          sourceHandoffId: primaryHandoff.id,
          sourceHandoffLabel: primaryHandoff.label,
          targetScope: 'book',
          note: 'Needs missing source.',
          updatedAtLabel: '2026-04-19 18:20',
          updatedByLabel: 'Editor',
          isStale: false,
        },
      }),
    )

    expect(screen.getByText('Blocked')).toBeInTheDocument()
    expect(screen.getByText('Source fix blocked at Open compare review.')).toBeInTheDocument()
  })

  it('renders rewrite request summaries with clear actions', () => {
    renderControls(
      createIssue({
        primaryFixHandoff: sceneRewriteHandoff,
        handoffs: [sceneRewriteHandoff],
        fixAction: {
          status: 'rewrite_requested' as any,
          sourceHandoffId: sceneRewriteHandoff.id,
          sourceHandoffLabel: sceneRewriteHandoff.label,
          targetScope: 'scene',
          note: 'Needs prose rewrite.',
          rewriteRequestNote: 'Needs prose rewrite.' as any,
          rewriteRequestId: 'rewrite-request-1' as any,
          rewriteTargetSceneId: 'scene-1' as any,
          updatedAtLabel: '2026-04-19 18:25',
          updatedByLabel: 'Editor',
          isStale: false,
        } as any,
      }),
    )

    expect(screen.getByText('Rewrite requested')).toBeInTheDocument()
    expect(screen.getByText('Rewrite request queued for Open scene draft.')).toBeInTheDocument()
    expect(screen.getAllByText('Needs prose rewrite.').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Clear fix action' })).toBeInTheDocument()
  })

  it('warns for stale fix actions and supports restart and clear', async () => {
    const user = userEvent.setup()
    const onStartFix = vi.fn()
    const onClearFix = vi.fn()
    const issue = createIssue({
      fixAction: {
        status: 'stale',
        sourceHandoffId: primaryHandoff.id,
        sourceHandoffLabel: primaryHandoff.label,
        targetScope: 'book',
        note: 'Old fix note.',
        updatedAtLabel: '2026-04-19 18:30',
        updatedByLabel: 'Editor',
        isStale: true,
      },
    })

    renderControls(issue, { onStartFix, onClearFix })

    expect(screen.getByText('Fix stale')).toBeInTheDocument()
    expect(
      screen.getByText('This source fix is stale because the review issue changed after the fix action was recorded.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Restart source fix' }))
    await user.click(screen.getByRole('button', { name: 'Clear fix action' }))

    expect(onStartFix).toHaveBeenCalledWith({
      issueId: issue.id,
      issueSignature: issue.issueSignature,
      handoff: primaryHandoff,
      note: 'Old fix note.',
    })
    expect(onClearFix).toHaveBeenCalledWith(issue.id)
  })

  it('disables start when no primary handoff is available', async () => {
    const user = userEvent.setup()
    const onStartFix = vi.fn()

    renderControls(
      createIssue({
        handoffs: [],
        primaryFixHandoff: null,
      }),
      { onStartFix },
    )

    expect(screen.getByText('No recommended source target')).toBeInTheDocument()
    expect(screen.getByText('No recommended source target is available for this issue.')).toBeInTheDocument()

    const startButton = screen.getByRole('button', { name: 'Start source fix' })
    expect(startButton).toBeDisabled()

    await user.click(startButton)
    expect(onStartFix).not.toHaveBeenCalled()
  })
})
