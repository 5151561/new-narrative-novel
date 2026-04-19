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
})
