import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import type {
  AssetMentionViewModel,
  AssetContextPolicyViewModel,
  AssetProfileViewModel,
  AssetRelationViewModel,
  AssetStoryBibleViewModel,
} from '../types/asset-view-models'

import { AssetKnowledgeStage } from './AssetKnowledgeStage'

const profile: AssetProfileViewModel = {
  sections: [
    {
      id: 'identity',
      title: 'Identity',
      facts: [
        { id: 'role', label: 'Role', value: 'Courier negotiator' },
        { id: 'agenda', label: 'Agenda', value: 'Keep the ledger shut in public.' },
      ],
    },
  ],
}

const mentions: AssetMentionViewModel[] = [
  {
    id: 'mention-ren-midnight-platform',
    targetScope: 'scene',
    targetId: 'scene-midnight-platform',
    chapterId: 'chapter-signals-in-rain',
    sceneId: 'scene-midnight-platform',
    title: 'Midnight Platform',
    relationLabel: 'Primary POV',
    excerpt: 'Ren refuses to let the ledger become a public prop.',
    recommendedLens: 'draft',
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
]

const relations: AssetRelationViewModel[] = [
  {
    id: 'relation-ren-mei',
    targetAssetId: 'asset-mei-arden',
    targetTitle: 'Mei Arden',
    targetKind: 'character',
    targetKindLabel: 'Character',
    relationshipScopeLabel: 'Same-kind relation',
    reciprocalStatusLabel: 'Reciprocal',
    narrativeBackingStatusLabel: 'Narrative-backed',
    hasReciprocalRelation: true,
    hasNarrativeBacking: true,
    relationLabel: 'Bargains against',
    summary: 'Ren needs Mei’s timing without accepting her public terms.',
  },
]

const storyBible: AssetStoryBibleViewModel = {
  canonFacts: [
    {
      id: 'ren-public-line',
      label: 'Public line',
      value: 'Ren will stall in public before he lets the ledger open.',
      visibilityLabel: 'Public',
      sourceRefs: [{ id: 'platform-log', kind: 'scene', label: 'Midnight platform witness log' }],
      lastReviewedAtLabel: '2026-04-27 22:10',
    },
  ],
  privateFacts: [],
  stateTimeline: [
    {
      id: 'ren-midnight-platform',
      label: 'Midnight Platform standoff',
      summary: 'Ren keeps the ledger closed while witness pressure hardens.',
      sceneId: 'scene-midnight-platform',
      chapterId: 'chapter-signals-in-rain',
      statusLabel: 'Established',
      sourceRefs: [{ id: 'platform-log', kind: 'scene', label: 'Midnight platform witness log' }],
    },
  ],
}

const contextPolicy: AssetContextPolicyViewModel = {
  hasContextPolicy: true,
  statusLabel: 'Active',
  summary: 'Ren may enter run context when he is in cast or explicitly linked to a proposal.',
  defaultVisibilityLabel: 'Character-known',
  defaultBudgetLabel: 'Selected facts',
  activationRules: [
    {
      id: 'ren-scene-cast',
      label: 'Cast member',
      summary: 'Include selected Ren facts when he is active in the scene cast.',
      reasonKindLabel: 'Scene cast',
      visibilityLabel: 'Character-known',
      budgetLabel: 'Selected facts',
      targetAgentLabels: ['Scene manager', 'Character agent'],
      priorityLabel: 'Primary POV context',
    },
  ],
  participation: [],
  exclusions: [],
  warnings: [],
}

describe('AssetKnowledgeStage', () => {
  it('renders the profile, mentions, relations, and context switcher and emits onViewChange', async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()

    const { rerender } = render(
      <I18nProvider>
        <AssetKnowledgeStage
          assetTitle="Ren Voss"
          assetSummary="Courier-side negotiator keeping the ledger shut."
          activeView="profile"
          availableViews={['profile', 'mentions', 'relations', 'context']}
          profile={profile}
          storyBible={storyBible}
          mentions={mentions}
          relations={relations}
          contextPolicy={contextPolicy}
          onViewChange={onViewChange}
          onOpenScene={() => undefined}
          onOpenChapter={() => undefined}
          onSelectAsset={() => undefined}
        />
      </I18nProvider>,
    )

    expect(screen.getByRole('button', { name: 'Profile' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mentions' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Relations' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Context' })).toBeInTheDocument()
    expect(screen.getByText('Courier negotiator')).toBeInTheDocument()
    expect(screen.getByText('Public line')).toBeInTheDocument()
    expect(screen.getByText('Midnight Platform standoff')).toBeInTheDocument()
    expect(screen.queryByText('Ren refuses to let the ledger become a public prop.')).not.toBeInTheDocument()
    expect(screen.queryByText('Ren needs Mei’s timing without accepting her public terms.')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Mentions' }))
    expect(onViewChange).toHaveBeenNthCalledWith(1, 'mentions')

    rerender(
      <I18nProvider>
        <AssetKnowledgeStage
          assetTitle="Ren Voss"
          assetSummary="Courier-side negotiator keeping the ledger shut."
          activeView="mentions"
          availableViews={['profile', 'mentions', 'relations', 'context']}
          profile={profile}
          storyBible={storyBible}
          mentions={mentions}
          relations={relations}
          contextPolicy={contextPolicy}
          onViewChange={onViewChange}
          onOpenScene={() => undefined}
          onOpenChapter={() => undefined}
          onSelectAsset={() => undefined}
        />
      </I18nProvider>,
    )

    expect(screen.getByText('Ren refuses to let the ledger become a public prop.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Open in Draft: Midnight Platform/ })).toBeInTheDocument()
    expect(screen.queryByText('Courier negotiator')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Relations' }))
    expect(onViewChange).toHaveBeenNthCalledWith(2, 'relations')

    rerender(
      <I18nProvider>
        <AssetKnowledgeStage
          assetTitle="Ren Voss"
          assetSummary="Courier-side negotiator keeping the ledger shut."
          activeView="relations"
          availableViews={['profile', 'mentions', 'relations', 'context']}
          profile={profile}
          storyBible={storyBible}
          mentions={mentions}
          relations={relations}
          contextPolicy={contextPolicy}
          onViewChange={onViewChange}
          onOpenScene={() => undefined}
          onOpenChapter={() => undefined}
          onSelectAsset={() => undefined}
        />
      </I18nProvider>,
    )

    expect(screen.getByText('Ren needs Mei’s timing without accepting her public terms.')).toBeInTheDocument()
    expect(screen.getByText('Bargains against')).toBeInTheDocument()
    expect(screen.queryByText('Ren refuses to let the ledger become a public prop.')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Context' }))
    expect(onViewChange).toHaveBeenNthCalledWith(3, 'context')

    rerender(
      <I18nProvider>
        <AssetKnowledgeStage
          assetTitle="Ren Voss"
          assetSummary="Courier-side negotiator keeping the ledger shut."
          activeView="context"
          availableViews={['profile', 'mentions', 'relations', 'context']}
          profile={profile}
          storyBible={storyBible}
          mentions={mentions}
          relations={relations}
          contextPolicy={contextPolicy}
          onViewChange={onViewChange}
          onOpenScene={() => undefined}
          onOpenChapter={() => undefined}
          onSelectAsset={() => undefined}
        />
      </I18nProvider>,
    )

    expect(screen.getByText('Ren may enter run context when he is in cast or explicitly linked to a proposal.')).toBeInTheDocument()
    expect(screen.getAllByText('Cast member').length).toBeGreaterThan(0)
    expect(screen.queryByText('Bargains against')).not.toBeInTheDocument()
  })
})
