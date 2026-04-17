import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AppProviders } from '@/app/providers'

import { ChapterDraftInspectorPane } from './ChapterDraftInspectorPane'
import type { ChapterDraftInspectorViewModel } from '../types/chapter-draft-view-models'

const inspector: ChapterDraftInspectorViewModel = {
  selectedScene: {
    sceneId: 'scene-concourse-delay',
    title: 'Concourse Delay',
    summary: 'Hold the crowd bottleneck long enough to keep platform pressure alive.',
    proseStatusLabel: 'Draft handoff ready',
    draftWordCount: 18,
    revisionQueueCount: 1,
    warningsCount: 1,
    latestDiffSummary: 'Carry the witness pressure forward without resolving courier ownership.',
  },
  chapterReadiness: {
    draftedSceneCount: 3,
    missingDraftCount: 1,
    assembledWordCount: 53,
    warningsCount: 2,
    queuedRevisionCount: 1,
  },
  selectedSceneTraceability: {
    sceneId: 'scene-concourse-delay',
    acceptedFacts: [
      {
        id: 'fact-1',
        label: 'Crowd pressure stays visible',
        value: 'Keep the bottleneck public so the platform pressure does not dissolve.',
        sourceProposals: [{ proposalId: 'proposal-1', title: 'Carry witness pressure' }],
        relatedAssets: [{ assetId: 'asset-ren-voss', title: 'Ren Voss', kind: 'character' }],
      },
    ],
    relatedAssets: [{ assetId: 'asset-ren-voss', title: 'Ren Voss', kind: 'character' }],
    latestPatchSummary: 'Patch the public bottleneck through the ticket-window handoff.',
    latestDiffSummary: 'Carry the witness pressure forward without resolving courier ownership.',
    sourceProposalCount: 1,
    missingLinks: [],
  },
  chapterTraceCoverage: {
    tracedSceneCount: 3,
    missingTraceSceneCount: 1,
    sceneIdsMissingTrace: ['scene-departure-bell'],
    sceneIdsMissingAssets: ['scene-departure-bell'],
  },
}

describe('ChapterDraftInspectorPane', () => {
  it('shows selected section trace facts, related assets, coverage, and opens asset profile chips', async () => {
    const user = userEvent.setup()
    const onOpenAsset = vi.fn()

    render(
      <AppProviders>
        <ChapterDraftInspectorPane
          chapterTitle="Signals in Rain"
          chapterSummary="Read the chapter as one continuous draft surface."
          inspector={inspector}
          onOpenAsset={onOpenAsset}
        />
      </AppProviders>,
    )

    expect(screen.getByText('Source facts')).toBeInTheDocument()
    expect(screen.getByText('Crowd pressure stays visible')).toBeInTheDocument()
    expect(screen.getByText('Patch the public bottleneck through the ticket-window handoff.')).toBeInTheDocument()
    expect(screen.getByText('Related assets')).toBeInTheDocument()
    expect(screen.getByText('Chapter trace coverage')).toBeInTheDocument()
    expect(screen.getAllByText('scene-departure-bell').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: 'Ren Voss' }))

    expect(onOpenAsset).toHaveBeenCalledWith('asset-ren-voss')
  })

  it('keeps selected-scene trace visible while chapter coverage is still loading', () => {
    render(
      <AppProviders>
        <ChapterDraftInspectorPane
          chapterTitle="Signals in Rain"
          chapterSummary="Read the chapter as one continuous draft surface."
          inspector={{
            ...inspector,
            chapterTraceCoverage: null,
          }}
          selectedSceneTraceabilityLoading={false}
          chapterCoverageLoading={true}
        />
      </AppProviders>,
    )

    expect(screen.getByText('Crowd pressure stays visible')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Chapter trace coverage' })).toBeInTheDocument()
    expect(screen.getByText('Counting traced scenes, missing trace, and asset-link gaps.')).toBeInTheDocument()
  })
})
