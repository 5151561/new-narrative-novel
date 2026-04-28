import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'
import type { ReviewIssueViewModel } from '@/features/review/types/review-view-models'

import { ReviewIssueDetail } from './ReviewIssueDetail'

const issue: ReviewIssueViewModel = {
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
  tags: ['Compare delta', 'Warnings +1'],
  issueSignature: 'compare-delta-scene-1::signature',
  decision: {
    status: 'open',
    isStale: false,
  },
  fixAction: {
    status: 'not_started',
    isStale: false,
  },
  handoffs: [
    {
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
    },
    {
      id: 'compare-delta-chapter',
      label: 'Open chapter draft',
      target: {
        scope: 'chapter',
        chapterId: 'chapter-1',
        lens: 'draft',
        view: 'sequence',
        sceneId: 'scene-1',
      },
    },
  ],
  primaryFixHandoff: {
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
  },
}

const sceneRewriteIssue: ReviewIssueViewModel = {
  ...issue,
  id: 'scene-proposal-seed-scene-5',
  source: 'scene-proposal',
  kind: 'scene_proposal',
  title: 'Scene proposal needs review',
  issueSignature: 'scene-proposal-seed-scene-5::signature',
  handoffs: [
    {
      id: 'scene-proposal-scene',
      label: 'Open scene draft',
      target: {
        scope: 'scene',
        sceneId: 'scene-5',
        lens: 'draft',
        tab: 'prose',
      },
    },
  ],
  primaryFixHandoff: {
    id: 'scene-proposal-scene',
    label: 'Open scene draft',
    target: {
      scope: 'scene',
      sceneId: 'scene-5',
      lens: 'draft',
      tab: 'prose',
    },
  },
}

describe('ReviewIssueDetail', () => {
  it('renders detail, recommendation, and source excerpt', () => {
    render(
      <AppProviders>
        <ReviewIssueDetail issue={issue} onOpenHandoff={vi.fn()} />
      </AppProviders>,
    )

    expect(screen.getByText('Scene One changed against the selected checkpoint.')).toBeInTheDocument()
    expect(
      screen.getByText('Open compare review and verify the changed passage before carrying it forward.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Checkpoint river excerpt.')).toBeInTheDocument()
  })

  it('calls onOpenHandoff when a handoff action is selected', async () => {
    const user = userEvent.setup()
    const onOpenHandoff = vi.fn()

    render(
      <AppProviders>
        <ReviewIssueDetail issue={issue} onOpenHandoff={onOpenHandoff} />
      </AppProviders>,
    )

    await user.click(screen.getByRole('button', { name: 'Open compare review' }))
    await user.click(screen.getByRole('button', { name: 'Open chapter draft' }))

    expect(onOpenHandoff).toHaveBeenNthCalledWith(1, issue.handoffs[0])
    expect(onOpenHandoff).toHaveBeenNthCalledWith(2, issue.handoffs[1])
  })

  it('renders decision controls and forwards review actions without hiding handoffs', async () => {
    const user = userEvent.setup()
    const onSetDecision = vi.fn()
    const onClearDecision = vi.fn()

    render(
      <AppProviders>
        <ReviewIssueDetail
          issue={{
            ...issue,
            decision: {
              status: 'deferred',
              note: 'Carry this to the next pass.',
              updatedAtLabel: '2026-04-19 18:00',
              updatedByLabel: 'Editor',
              isStale: false,
            },
          }}
          onOpenHandoff={vi.fn()}
          onSetDecision={onSetDecision}
          onClearDecision={onClearDecision}
        />
      </AppProviders>,
    )

    expect(screen.getByRole('button', { name: 'Open compare review' })).toBeInTheDocument()
    expect(screen.getByText('Deferred')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Carry this to the next pass.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reopen' }))

    expect(onClearDecision).toHaveBeenCalledWith(issue.id)
  })

  it('renders source fix controls between decision controls and handoff actions with the primary target', () => {
    render(
      <AppProviders>
        <ReviewIssueDetail
          issue={issue}
          onOpenHandoff={vi.fn()}
          onSetDecision={vi.fn()}
          onClearDecision={vi.fn()}
          onStartFix={vi.fn()}
          onSetFixStatus={vi.fn()}
          onClearFix={vi.fn()}
        />
      </AppProviders>,
    )

    expect(screen.getByRole('button', { name: 'Mark reviewed' })).toBeInTheDocument()
    expect(screen.getByText('Primary fix target')).toBeInTheDocument()
    expect(screen.getByText('Open compare review · book')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start source fix' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create rewrite request' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open compare review' })).toBeInTheDocument()
  })

  it('renders rewrite-requested fix details without changing review decision statuses', () => {
    render(
      <AppProviders>
        <ReviewIssueDetail
          issue={{
            ...sceneRewriteIssue,
            decision: {
              status: 'reviewed',
              note: 'Reviewed but needs prose rewrite.',
              updatedAtLabel: '2026-04-19 18:20',
              updatedByLabel: 'Editor',
              isStale: false,
            },
            fixAction: {
              status: 'rewrite_requested' as any,
              sourceHandoffId: 'scene-proposal-scene',
              sourceHandoffLabel: 'Open scene draft',
              targetScope: 'scene',
              note: 'Rewrite the scene prose before the next review.',
              rewriteRequestNote: 'Rewrite the scene prose before the next review.' as any,
              rewriteRequestId: 'rewrite-request-1' as any,
              rewriteTargetSceneId: 'scene-5' as any,
              updatedAtLabel: '2026-04-19 18:21',
              updatedByLabel: 'Editor',
              isStale: false,
            } as any,
          }}
          onOpenHandoff={vi.fn()}
          onSetDecision={vi.fn()}
          onClearDecision={vi.fn()}
          onStartFix={vi.fn()}
          onSetFixStatus={vi.fn()}
          onClearFix={vi.fn()}
        />
      </AppProviders>,
    )

    expect(screen.getByText('Reviewed')).toBeInTheDocument()
    expect(screen.getByText('Rewrite requested')).toBeInTheDocument()
    expect(screen.getByText('Rewrite request queued for Open scene draft.')).toBeInTheDocument()
  })
})
