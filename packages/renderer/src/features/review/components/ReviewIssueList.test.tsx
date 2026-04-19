import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'
import type { BookReviewInboxViewModel, ReviewIssueViewModel } from '@/features/review/types/review-view-models'

import { ReviewIssueList } from './ReviewIssueList'

function createIssue(id: string, overrides: Partial<ReviewIssueViewModel> = {}): ReviewIssueViewModel {
  const handoff = {
    id: `${id}-handoff`,
    label: 'Open compare review',
    target: {
      scope: 'book' as const,
      lens: 'draft' as const,
      view: 'sequence' as const,
      draftView: 'compare' as const,
      checkpointId: 'checkpoint-1',
      selectedChapterId: 'chapter-1',
      reviewIssueId: id,
    },
  }

  return {
    id,
    severity: 'warning',
    source: 'compare',
    kind: 'compare_delta',
    title: `Issue ${id}`,
    detail: 'Issue detail',
    recommendation: 'Open the source and review the delta.',
    chapterId: 'chapter-1',
    chapterTitle: 'Chapter One',
    chapterOrder: 1,
    sceneId: 'scene-1',
    sceneTitle: 'Scene One',
    sceneOrder: 1,
    sourceLabel: 'Compare checkpoint',
    sourceExcerpt: 'Current excerpt',
    tags: ['Compare delta'],
    issueSignature: `${id}::signature`,
    decision: {
      status: 'open',
      isStale: false,
    },
    fixAction: {
      status: 'not_started',
      isStale: false,
    },
    handoffs: [handoff],
    primaryFixHandoff: handoff,
    ...overrides,
  }
}

function createGroupedIssues(): BookReviewInboxViewModel['groupedIssues'] {
  return {
    blockers: [
      createIssue('blocker-1', {
        severity: 'blocker',
        source: 'export',
        kind: 'export_blocker',
        title: 'Export blocker',
        sourceLabel: 'Export readiness',
        tags: ['Missing draft', 'Export readiness'],
      }),
    ],
    warnings: [
      createIssue('warning-1', {
        severity: 'warning',
        source: 'compare',
        kind: 'compare_delta',
        title: 'Compare delta',
        sourceLabel: 'Compare checkpoint',
        tags: ['Compare delta'],
      }),
    ],
    info: [
      createIssue('info-1', {
        severity: 'info',
        source: 'chapter-draft',
        kind: 'chapter_annotation',
        title: 'Queued revision remains',
        sourceLabel: 'Current chapter draft',
        tags: ['Queued revision'],
      }),
    ],
  }
}

describe('ReviewIssueList', () => {
  it('renders issues grouped by severity', () => {
    render(
      <AppProviders>
        <ReviewIssueList groupedIssues={createGroupedIssues()} selectedIssueId="warning-1" onSelectIssue={vi.fn()} />
      </AppProviders>,
    )

    expect(screen.getByRole('heading', { name: 'Blockers' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Warnings' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Info' })).toBeInTheDocument()
  })

  it('shows severity, source, title, chapter, and scene on each issue row', () => {
    render(
      <AppProviders>
        <ReviewIssueList groupedIssues={createGroupedIssues()} selectedIssueId="warning-1" onSelectIssue={vi.fn()} />
      </AppProviders>,
    )

    expect(screen.getByText('Export blocker')).toBeInTheDocument()
    expect(screen.getAllByText('Compare checkpoint').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Chapter One \/ Scene One/).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Compare delta').length).toBeGreaterThan(0)
    expect(screen.getByText('Queued revision remains')).toBeInTheDocument()
  })

  it('shows decision status badges, stale state, and note indicators on issue rows', () => {
    render(
      <AppProviders>
        <ReviewIssueList
          groupedIssues={{
            blockers: [],
            warnings: [
              createIssue('warning-1', {
                title: 'Reviewed warning',
                decision: {
                  status: 'reviewed',
                  note: 'Handled in this pass.',
                  updatedAtLabel: '2026-04-19 18:10',
                  updatedByLabel: 'Editor',
                  isStale: false,
                },
              }),
              createIssue('warning-2', {
                title: 'Stale warning',
                decision: {
                  status: 'stale',
                  updatedAtLabel: '2026-04-19 18:20',
                  updatedByLabel: 'Editor',
                  isStale: true,
                },
              }),
            ],
            info: [],
          }}
          selectedIssueId="warning-1"
          onSelectIssue={vi.fn()}
        />
      </AppProviders>,
    )

    expect(screen.getByText('Reviewed')).toBeInTheDocument()
    expect(screen.getByText('Decision note')).toBeInTheDocument()
    expect(screen.getByText('Decision stale')).toBeInTheDocument()
  })

  it('shows fix started, checked, blocked, and stale badges without changing selected highlight', () => {
    render(
      <AppProviders>
        <ReviewIssueList
          groupedIssues={{
            blockers: [
              createIssue('blocked-fix', {
                title: 'Blocked source fix',
                severity: 'blocker',
                fixAction: {
                  status: 'blocked',
                  sourceHandoffId: 'blocked-fix-handoff',
                  sourceHandoffLabel: 'Open compare review',
                  targetScope: 'book',
                  updatedAtLabel: '2026-04-19 18:00',
                  updatedByLabel: 'Editor',
                  isStale: false,
                },
              }),
            ],
            warnings: [
              createIssue('started-fix', {
                title: 'Started source fix',
                fixAction: {
                  status: 'started',
                  sourceHandoffId: 'started-fix-handoff',
                  sourceHandoffLabel: 'Open compare review',
                  targetScope: 'book',
                  updatedAtLabel: '2026-04-19 18:10',
                  updatedByLabel: 'Editor',
                  isStale: false,
                },
              }),
              createIssue('checked-fix', {
                title: 'Checked source fix',
                decision: {
                  status: 'reviewed',
                  isStale: false,
                },
                fixAction: {
                  status: 'checked',
                  sourceHandoffId: 'checked-fix-handoff',
                  sourceHandoffLabel: 'Open compare review',
                  targetScope: 'book',
                  updatedAtLabel: '2026-04-19 18:20',
                  updatedByLabel: 'Editor',
                  isStale: false,
                },
              }),
            ],
            info: [
              createIssue('stale-fix', {
                title: 'Stale source fix',
                severity: 'info',
                fixAction: {
                  status: 'stale',
                  sourceHandoffId: 'stale-fix-handoff',
                  sourceHandoffLabel: 'Open compare review',
                  targetScope: 'book',
                  updatedAtLabel: '2026-04-19 18:30',
                  updatedByLabel: 'Editor',
                  isStale: true,
                },
              }),
            ],
          }}
          selectedIssueId="checked-fix"
          onSelectIssue={vi.fn()}
        />
      </AppProviders>,
    )

    expect(screen.getByText('Fix started')).toBeInTheDocument()
    expect(screen.getByText('Checked')).toBeInTheDocument()
    expect(screen.getByText('Blocked')).toBeInTheDocument()
    expect(screen.getByText('Fix stale')).toBeInTheDocument()
    expect(screen.getByText('Reviewed')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Checked source fix/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows source fix notes on rows after a fix action has started', () => {
    render(
      <AppProviders>
        <ReviewIssueList
          groupedIssues={{
            blockers: [
              createIssue('blocked-fix-note', {
                title: 'Blocked source fix note',
                severity: 'blocker',
                fixAction: {
                  status: 'blocked',
                  sourceHandoffId: 'blocked-fix-note-handoff',
                  sourceHandoffLabel: 'Open compare review',
                  targetScope: 'book',
                  note: 'Blocked until source ownership is resolved.',
                  updatedAtLabel: '2026-04-19 18:00',
                  updatedByLabel: 'Editor',
                  isStale: false,
                },
              }),
            ],
            warnings: [
              createIssue('not-started-note', {
                title: 'Not started source fix note',
                fixAction: {
                  status: 'not_started',
                  note: 'This should not render on the row.',
                  isStale: false,
                },
              }),
            ],
            info: [],
          }}
          selectedIssueId="blocked-fix-note"
          onSelectIssue={vi.fn()}
        />
      </AppProviders>,
    )

    expect(screen.getByRole('button', { name: /Fix note: Blocked until source ownership is resolved/i })).toBeInTheDocument()
    expect(screen.queryByText(/This should not render on the row/)).not.toBeInTheDocument()
  })
})
