import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import type { AssetMentionViewModel } from '../types/asset-view-models'

import { AssetMentionsView } from './AssetMentionsView'

const mentions: AssetMentionViewModel[] = [
  {
    id: 'mention-ren-midnight-platform',
    targetScope: 'scene',
    targetId: 'scene-midnight-platform',
    chapterId: 'chapter-signals-in-rain',
    sceneId: 'scene-midnight-platform',
    title: 'Midnight Platform',
    relationLabel: 'Primary POV',
    excerpt: 'Ren holds the line on the platform and refuses to turn the ledger into a public prop.',
    recommendedLens: 'draft',
    backing: {
      kind: 'canon',
      sceneId: 'scene-midnight-platform',
      acceptedFactIds: ['fact-1'],
      proposalIds: ['proposal-1'],
      patchId: 'patch-1',
    },
    traceDetail: {
      backingKind: 'canon',
      factLabels: ['Courier signal spotted'],
      proposalTitles: ['Force the bargain into a visible stalemate'],
      patchId: 'patch-1',
      sceneTraceMissing: false,
    },
    handoffActions: [
      {
        id: 'mention-ren-midnight-platform-draft',
        targetScope: 'scene',
        targetId: 'scene-midnight-platform',
        lens: 'draft',
        label: 'Open in Draft: Midnight Platform',
        recommended: true,
      },
      {
        id: 'mention-ren-midnight-platform-orchestrate',
        targetScope: 'scene',
        targetId: 'scene-midnight-platform',
        lens: 'orchestrate',
        label: 'Open in Orchestrate: Midnight Platform',
        recommended: false,
      },
    ],
  },
  {
    id: 'mention-ren-signals-in-rain',
    targetScope: 'chapter',
    targetId: 'chapter-signals-in-rain',
    chapterId: 'chapter-signals-in-rain',
    title: 'Signals in Rain',
    relationLabel: 'Carries the bargaining line',
    excerpt: 'Ren stays at the center of every leverage exchange in the chapter.',
    recommendedLens: 'structure',
    backing: {
      kind: 'draft_context',
      sceneId: 'scene-ticket-window',
      proposalIds: ['proposal-2'],
    },
    traceDetail: {
      backingKind: 'draft_context',
      factLabels: [],
      proposalTitles: ['Force the trade-off into one visible exchange'],
      sceneTraceMissing: false,
    },
    handoffActions: [
      {
        id: 'mention-ren-signals-in-rain-structure',
        targetScope: 'chapter',
        targetId: 'chapter-signals-in-rain',
        lens: 'structure',
        label: 'Open in Structure: Signals in Rain',
        recommended: true,
      },
      {
        id: 'mention-ren-signals-in-rain-draft',
        targetScope: 'chapter',
        targetId: 'chapter-signals-in-rain',
        lens: 'draft',
        label: 'Open in Draft: Signals in Rain',
        recommended: false,
      },
    ],
  } as unknown as AssetMentionViewModel,
  {
    id: 'mention-ren-unlinked',
    targetScope: 'chapter',
    targetId: 'chapter-night-platform-ledger',
    chapterId: 'chapter-night-platform-ledger',
    title: 'Night Platform Ledger',
    relationLabel: 'Needs narrative anchor',
    excerpt: 'The ledger note exists in the profile, but the mention has not been tied back to a traced scene yet.',
    backing: {
      kind: 'unlinked',
    },
    traceDetail: {
      backingKind: 'unlinked',
      factLabels: [],
      proposalTitles: [],
      sceneTraceMissing: true,
    },
    handoffActions: [
      {
        id: 'mention-ren-unlinked-draft',
        targetScope: 'chapter',
        targetId: 'chapter-night-platform-ledger',
        lens: 'draft',
        label: 'Open in Draft: Night Platform Ledger',
        recommended: true,
      },
    ],
  } as unknown as AssetMentionViewModel,
]

describe('AssetMentionsView', () => {
  it('shows trace-aware mention badges and provenance details while preserving scene and chapter handoffs', async () => {
    const user = userEvent.setup()
    const onOpenScene = vi.fn()
    const onOpenChapter = vi.fn()

    render(
      <I18nProvider>
        <AssetMentionsView mentions={mentions} onOpenScene={onOpenScene} onOpenChapter={onOpenChapter} />
      </I18nProvider>,
    )

    expect(screen.getByText('Midnight Platform')).toBeInTheDocument()
    expect(screen.getByText('Primary POV')).toBeInTheDocument()
    expect(
      screen.getByText('Ren holds the line on the platform and refuses to turn the ledger into a public prop.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Signals in Rain')).toBeInTheDocument()
    expect(screen.getByText('Night Platform Ledger')).toBeInTheDocument()
    expect(screen.getByText('Canon-backed')).toBeInTheDocument()
    expect(screen.getByText('Draft-context')).toBeInTheDocument()
    expect(screen.getByText('Unlinked')).toBeInTheDocument()
    expect(screen.getAllByText('Trace detail')).toHaveLength(3)

    const canonCard = screen.getByRole('heading', { name: 'Midnight Platform' }).closest('section')
    const draftCard = screen.getByRole('heading', { name: 'Signals in Rain' }).closest('section')
    const unlinkedCard = screen.getByRole('heading', { name: 'Night Platform Ledger' }).closest('section')

    expect(canonCard).not.toBeNull()
    expect(draftCard).not.toBeNull()
    expect(unlinkedCard).not.toBeNull()
    expect(within(canonCard!).getByText('Courier signal spotted')).toBeInTheDocument()
    expect(within(canonCard!).getByText('Force the bargain into a visible stalemate')).toBeInTheDocument()
    expect(within(canonCard!).getByText('patch-1')).toBeInTheDocument()
    expect(within(draftCard!).getByText('Force the trade-off into one visible exchange')).toBeInTheDocument()
    expect(within(unlinkedCard!).getByText('Missing scene trace')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open in Draft: Midnight Platform' }))
    await user.click(screen.getByRole('button', { name: 'Open in Orchestrate: Midnight Platform' }))
    await user.click(screen.getByRole('button', { name: 'Open in Structure: Signals in Rain' }))
    await user.click(screen.getByRole('button', { name: 'Open in Draft: Night Platform Ledger' }))

    expect(onOpenScene).toHaveBeenNthCalledWith(1, 'scene-midnight-platform', 'draft')
    expect(onOpenScene).toHaveBeenNthCalledWith(2, 'scene-midnight-platform', 'orchestrate')
    expect(onOpenChapter).toHaveBeenNthCalledWith(1, 'chapter-signals-in-rain', 'structure')
    expect(onOpenChapter).toHaveBeenNthCalledWith(2, 'chapter-night-platform-ledger', 'draft')
  })

  it('keeps stable backing badges while showing trace detail loading state without faking provenance facts', () => {
    render(
      <I18nProvider>
        <AssetMentionsView
          mentions={[
            {
              ...mentions[0],
              traceDetail: undefined,
              traceDetailStatus: {
                state: 'loading',
                title: 'Loading trace detail',
                message: 'Trace detail will appear here once scene sources finish loading.',
              },
            },
          ]}
          onOpenScene={() => undefined}
          onOpenChapter={() => undefined}
        />
      </I18nProvider>,
    )

    expect(screen.getByText('Canon-backed')).toBeInTheDocument()
    expect(screen.getByText('Loading trace detail')).toBeInTheDocument()
    expect(screen.getByText('Trace detail will appear here once scene sources finish loading.')).toBeInTheDocument()
    expect(screen.queryByText('Courier signal spotted')).not.toBeInTheDocument()
    expect(screen.queryByText('Force the bargain into a visible stalemate')).not.toBeInTheDocument()
  })
})
