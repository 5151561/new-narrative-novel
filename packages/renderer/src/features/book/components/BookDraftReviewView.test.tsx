import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'
import type { BookReviewInboxViewModel, ReviewIssueViewModel, ReviewSourceHandoffViewModel } from '@/features/review/types/review-view-models'

import { BookDraftReviewView } from './BookDraftReviewView'

function createIssue(id: string, overrides: Partial<ReviewIssueViewModel> = {}): ReviewIssueViewModel {
  return {
    id,
    severity: 'warning',
    source: 'compare',
    kind: 'compare_delta',
    title: `Issue ${id}`,
    detail: `Detail ${id}`,
    recommendation: `Recommendation ${id}`,
    chapterId: 'chapter-1',
    chapterTitle: 'Chapter One',
    chapterOrder: 1,
    sceneId: 'scene-1',
    sceneTitle: 'Scene One',
    sceneOrder: 1,
    sourceLabel: 'Compare checkpoint',
    sourceExcerpt: `Excerpt ${id}`,
    tags: ['Compare delta'],
    handoffs: [
      {
        id: `${id}-handoff`,
        label: 'Open compare review',
        target: {
          scope: 'book',
          lens: 'draft',
          view: 'sequence',
          draftView: 'compare',
          checkpointId: 'checkpoint-1',
          selectedChapterId: 'chapter-1',
          reviewIssueId: id,
        },
      },
    ],
    ...overrides,
  }
}

function createInbox(): BookReviewInboxViewModel {
  const blocker = createIssue('export-blocker', {
    severity: 'blocker',
    source: 'export',
    kind: 'export_blocker',
    title: 'Export blocker',
    sourceLabel: 'Export readiness',
    tags: ['Export readiness'],
  })
  const warning = createIssue('compare-warning', {
    severity: 'warning',
    source: 'compare',
    kind: 'compare_delta',
    title: 'Compare warning',
    tags: ['Compare delta'],
  })
  const info = createIssue('draft-info', {
    severity: 'info',
    source: 'chapter-draft',
    kind: 'chapter_annotation',
    title: 'Queued revision remains',
    sourceLabel: 'Current chapter draft',
    tags: ['Queued revision'],
  })

  return {
    bookId: 'book-signal-arc',
    title: 'Signal Arc',
    selectedIssueId: warning.id,
    selectedIssue: warning,
    activeFilter: 'all',
    issues: [blocker, warning, info],
    filteredIssues: [blocker, warning, info],
    groupedIssues: {
      blockers: [blocker],
      warnings: [warning],
      info: [info],
    },
    counts: {
      total: 3,
      blockers: 1,
      warnings: 1,
      info: 1,
      traceGaps: 0,
      missingDrafts: 0,
      compareDeltas: 1,
      exportReadiness: 1,
      branchReadiness: 0,
      sceneProposals: 0,
    },
    selectedChapterIssueCount: 3,
    annotationsByChapterId: {
      'chapter-1': [info],
    },
  }
}

describe('BookDraftReviewView', () => {
  it('renders the filter bar, issue groups, and selected issue highlight', () => {
    render(
      <AppProviders>
        <BookDraftReviewView inbox={createInbox()} onSelectFilter={vi.fn()} onSelectIssue={vi.fn()} onOpenReviewSource={vi.fn()} />
      </AppProviders>,
    )

    expect(screen.getByRole('button', { name: 'All 3' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Blockers' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Warnings' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Info' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Compare warning/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onSelectIssue when an issue row is chosen', async () => {
    const user = userEvent.setup()
    const onSelectIssue = vi.fn()

    render(
      <AppProviders>
        <BookDraftReviewView inbox={createInbox()} onSelectFilter={vi.fn()} onSelectIssue={onSelectIssue} onOpenReviewSource={vi.fn()} />
      </AppProviders>,
    )

    await user.click(screen.getByRole('button', { name: /Export blocker/i }))

    expect(onSelectIssue).toHaveBeenCalledWith('export-blocker')
  })

  it('calls onOpenReviewSource when a source handoff action is chosen', async () => {
    const user = userEvent.setup()
    const onOpenReviewSource = vi.fn()
    const inbox = createInbox()
    const selectedHandoff: ReviewSourceHandoffViewModel = inbox.selectedIssue!.handoffs[0]!

    render(
      <AppProviders>
        <BookDraftReviewView inbox={inbox} onSelectFilter={vi.fn()} onSelectIssue={vi.fn()} onOpenReviewSource={onOpenReviewSource} />
      </AppProviders>,
    )

    const detail = screen.getByRole('heading', { name: 'Compare warning' }).closest('section')
    expect(detail).not.toBeNull()

    await user.click(within(detail!).getByRole('button', { name: 'Open compare review' }))

    expect(onOpenReviewSource).toHaveBeenCalledWith(selectedHandoff)
  })

  it('shows a calm empty state when the active filter has no issues', () => {
    const emptyInbox = {
      ...createInbox(),
      activeFilter: 'scene-proposals' as const,
      filteredIssues: [],
      groupedIssues: {
        blockers: [],
        warnings: [],
        info: [],
      },
      selectedIssueId: null,
      selectedIssue: null,
    }

    render(
      <AppProviders>
        <BookDraftReviewView inbox={emptyInbox} onSelectFilter={vi.fn()} onSelectIssue={vi.fn()} onOpenReviewSource={vi.fn()} />
      </AppProviders>,
    )

    expect(screen.getByText('No issues in this filter')).toBeInTheDocument()
    expect(
      screen.getByText('This queue is clear for now. Choose another filter to continue the review pass.'),
    ).toBeInTheDocument()
  })
})
