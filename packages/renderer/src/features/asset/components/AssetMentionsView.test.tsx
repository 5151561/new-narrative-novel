import { render, screen } from '@testing-library/react'
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
  },
]

describe('AssetMentionsView', () => {
  it('shows mention source and excerpt and routes handoff actions to scene or chapter', async () => {
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

    await user.click(screen.getByRole('button', { name: 'Open in Draft: Midnight Platform' }))
    await user.click(screen.getByRole('button', { name: 'Open in Orchestrate: Midnight Platform' }))
    await user.click(screen.getByRole('button', { name: 'Open in Structure: Signals in Rain' }))

    expect(onOpenScene).toHaveBeenNthCalledWith(1, 'scene-midnight-platform', 'draft')
    expect(onOpenScene).toHaveBeenNthCalledWith(2, 'scene-midnight-platform', 'orchestrate')
    expect(onOpenChapter).toHaveBeenCalledWith('chapter-signals-in-rain', 'structure')
  })
})
