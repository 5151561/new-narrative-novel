import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'

import type { ChapterDraftWorkspaceViewModel } from '../types/chapter-draft-view-models'
import { ChapterDraftReader } from './ChapterDraftReader'

const workspace: ChapterDraftWorkspaceViewModel = {
  chapterId: 'chapter-signals-in-rain',
  title: 'Signals in Rain',
  summary: 'Read the chapter as one ordered draft surface.',
  selectedSceneId: 'scene-concourse-delay',
  assembledWordCount: 27,
  draftedSceneCount: 2,
  missingDraftCount: 1,
  scenes: [
    {
      sceneId: 'scene-midnight-platform',
      order: 1,
      title: 'Midnight Platform',
      summary: 'Keep the bargain public and constrained.',
      proseDraft: 'Rain held the platform in place while Ren refused to blink first.',
      draftWordCount: 11,
      proseStatusLabel: 'Ready for revision pass',
      sceneStatusLabel: 'Current',
      latestDiffSummary: 'No prose revision requested yet.',
      revisionQueueCount: 0,
      warningsCount: 0,
      isMissingDraft: false,
      traceSummary: {
        sourceFactCount: 2,
        relatedAssetCount: 2,
        status: 'ready',
      },
    },
    {
      sceneId: 'scene-concourse-delay',
      order: 2,
      title: 'Concourse Delay',
      summary: 'Hold the crowd bottleneck long enough to keep platform pressure alive.',
      proseStatusLabel: 'Missing draft',
      sceneStatusLabel: 'Queued',
      latestDiffSummary: 'First prose pass still missing.',
      revisionQueueCount: 1,
      warningsCount: 2,
      isMissingDraft: true,
      traceSummary: {
        sourceFactCount: 0,
        relatedAssetCount: 0,
        status: 'missing',
      },
    },
    {
      sceneId: 'scene-ticket-window',
      order: 3,
      title: 'Ticket Window',
      summary: 'Put speed and certainty in the same beat without surfacing the alias.',
      proseDraft: 'The ticket stalled halfway out while Mei waited for a cleaner answer.',
      draftWordCount: 16,
      proseStatusLabel: 'Ready for prose pass',
      sceneStatusLabel: 'Guarded',
      latestDiffSummary: 'Tighten the visible cost before the clerk notices too much.',
      revisionQueueCount: 2,
      warningsCount: 1,
      isMissingDraft: false,
      traceSummary: {
        sourceFactCount: 1,
        relatedAssetCount: 1,
        status: 'ready',
      },
    },
  ],
  selectedScene: {
    sceneId: 'scene-concourse-delay',
    order: 2,
    title: 'Concourse Delay',
    summary: 'Hold the crowd bottleneck long enough to keep platform pressure alive.',
    proseStatusLabel: 'Missing draft',
    sceneStatusLabel: 'Queued',
    latestDiffSummary: 'First prose pass still missing.',
    revisionQueueCount: 1,
    warningsCount: 2,
    isMissingDraft: true,
  },
  inspector: {
    selectedScene: {
      sceneId: 'scene-concourse-delay',
      title: 'Concourse Delay',
      summary: 'Hold the crowd bottleneck long enough to keep platform pressure alive.',
      proseStatusLabel: 'Missing draft',
      draftWordCount: undefined,
      revisionQueueCount: 1,
      warningsCount: 2,
      latestDiffSummary: 'First prose pass still missing.',
    },
    chapterReadiness: {
      draftedSceneCount: 2,
      missingDraftCount: 1,
      assembledWordCount: 27,
      warningsCount: 3,
      queuedRevisionCount: 3,
    },
  },
  dockSummary: {
    missingDraftCount: 1,
    warningsCount: 3,
    queuedRevisionCount: 3,
    missingDraftScenes: [
      {
        sceneId: 'scene-concourse-delay',
        title: 'Concourse Delay',
        detail: 'First prose pass still missing.',
      },
    ],
    warningScenes: [
      {
        sceneId: 'scene-concourse-delay',
        title: 'Concourse Delay',
        detail: 'First prose pass still missing.',
      },
      {
        sceneId: 'scene-ticket-window',
        title: 'Ticket Window',
        detail: 'Tighten the visible cost before the clerk notices too much.',
      },
    ],
    queuedRevisionScenes: [
      {
        sceneId: 'scene-concourse-delay',
        title: 'Concourse Delay',
        detail: '1 queued revision',
      },
      {
        sceneId: 'scene-ticket-window',
        title: 'Ticket Window',
        detail: '2 queued revisions',
      },
    ],
  },
}

describe('ChapterDraftReader', () => {
  it('renders ordered sections, keeps the selected section synced, and triggers scene actions', async () => {
    const user = userEvent.setup()
    const onSelectScene = vi.fn()
    const onOpenScene = vi.fn()

    render(
      <AppProviders>
        <ChapterDraftReader workspace={workspace} onSelectScene={onSelectScene} onOpenScene={onOpenScene} />
      </AppProviders>,
    )

    const firstSection = screen.getByRole('button', { name: /Scene 1 Midnight Platform Ready for revision pass/i })
    const secondSection = screen.getByRole('button', { name: /Scene 2 Concourse Delay Missing draft/i })
    const thirdSection = screen.getByRole('button', { name: /Scene 3 Ticket Window Ready for prose pass/i })

    expect(firstSection.compareDocumentPosition(secondSection) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(secondSection.compareDocumentPosition(thirdSection) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(secondSection).toHaveAttribute('aria-current', 'true')
    expect(screen.getByText('Draft not started yet.')).toBeInTheDocument()
    expect(screen.getByText('2 facts')).toBeInTheDocument()
    expect(screen.getByText('2 assets')).toBeInTheDocument()
    expect(screen.getAllByText('Trace ready').length).toBeGreaterThan(0)
    expect(screen.getByText('Trace missing')).toBeInTheDocument()
    expect(screen.getByText('0 facts')).toBeInTheDocument()
    expect(screen.getByText('0 assets')).toBeInTheDocument()

    await user.click(thirdSection)
    expect(onSelectScene).toHaveBeenCalledWith('scene-ticket-window')

    await user.click(screen.getByRole('button', { name: 'Open in Draft: Concourse Delay' }))
    await user.click(screen.getByRole('button', { name: 'Open in Orchestrate: Concourse Delay' }))

    expect(onOpenScene).toHaveBeenNthCalledWith(1, 'scene-concourse-delay', 'draft')
    expect(onOpenScene).toHaveBeenNthCalledWith(2, 'scene-concourse-delay', 'orchestrate')
  })
})
