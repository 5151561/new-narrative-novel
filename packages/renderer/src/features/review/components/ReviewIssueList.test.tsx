import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'
import type { BookReviewInboxViewModel, ReviewIssueViewModel } from '@/features/review/types/review-view-models'

import { ReviewIssueList } from './ReviewIssueList'

function createIssue(id: string, overrides: Partial<ReviewIssueViewModel> = {}): ReviewIssueViewModel {
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
})
