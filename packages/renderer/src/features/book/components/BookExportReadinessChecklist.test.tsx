import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'

import type { BookExportReadinessIssueViewModel } from '../types/book-export-view-models'
import { BookExportReadinessChecklist } from './BookExportReadinessChecklist'

const issues: BookExportReadinessIssueViewModel[] = [
  {
    id: 'issue-missing-draft',
    severity: 'blocker',
    kind: 'missing_draft',
    chapterId: 'chapter-signals-in-rain',
    sceneId: 'scene-departure-bell',
    chapterTitle: 'Signals in Rain',
    sceneTitle: 'Departure Bell',
    title: 'Draft coverage incomplete',
    detail: 'Departure Bell still needs current draft prose.',
    recommendedActionLabel: 'Review chapter',
  },
  {
    id: 'issue-trace-gap',
    severity: 'warning',
    kind: 'trace_gap',
    chapterId: 'chapter-open-water-signals',
    chapterTitle: 'Open Water Signals',
    title: 'Trace appendix is incomplete',
    detail: 'One included scene still lacks trace coverage.',
  },
  {
    id: 'issue-archive-info',
    severity: 'info',
    kind: 'profile_rule',
    title: 'Archive snapshot allows warnings',
    detail: 'This profile records the package without requiring a clean submission state.',
  },
]

describe('BookExportReadinessChecklist', () => {
  it('groups readiness issues by severity and shows chapter/scene labels', () => {
    render(
      <AppProviders>
        <BookExportReadinessChecklist issues={issues} onSelectChapter={vi.fn()} />
      </AppProviders>,
    )

    expect(screen.getByRole('heading', { name: 'Readiness checklist' })).toBeInTheDocument()
    expect(screen.getAllByText('Blockers').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Warnings').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Info').length).toBeGreaterThan(0)
    expect(screen.getByText('Signals in Rain / Departure Bell')).toBeInTheDocument()
    expect(screen.getByText('Open Water Signals')).toBeInTheDocument()
  })

  it('focuses the linked chapter when an issue is selected', async () => {
    const user = userEvent.setup()
    const onSelectChapter = vi.fn()

    render(
      <AppProviders>
        <BookExportReadinessChecklist issues={issues} onSelectChapter={onSelectChapter} />
      </AppProviders>,
    )

    await user.click(screen.getByRole('button', { name: /Draft coverage incomplete/i }))

    expect(onSelectChapter).toHaveBeenCalledWith('chapter-signals-in-rain')
  })
})
