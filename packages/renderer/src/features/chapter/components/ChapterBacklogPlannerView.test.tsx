import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'

import {
  buildChapterBacklogAcceptedStoryWorkspace,
  buildChapterStoryWorkspace,
} from './chapter-story-fixture'
import { ChapterBacklogPlannerView } from './ChapterBacklogPlannerView'

describe('ChapterBacklogPlannerView', () => {
  it('shows an empty-state proposal area when no backlog proposal exists', () => {
    const workspace = {
      ...buildChapterStoryWorkspace('scene-midnight-platform'),
      planning: {
        ...buildChapterStoryWorkspace('scene-midnight-platform').planning,
        proposals: [],
        acceptedProposalId: undefined,
      },
    }

    render(
      <I18nProvider>
        <ChapterBacklogPlannerView workspace={workspace} />
      </I18nProvider>,
    )

    expect(screen.getByText('No backlog proposal yet')).toBeInTheDocument()
  })

  it('edits a proposal scene, keeps selected-scene focus route-owned, and accepts the proposal through callbacks', async () => {
    const user = userEvent.setup()
    const onSelectScene = vi.fn()
    const onUpdateProposalScene = vi.fn()
    const onAcceptProposal = vi.fn()
    const workspace = buildChapterStoryWorkspace('scene-concourse-delay')
    const activeProposal = workspace.planning.proposals[0]!

    render(
      <I18nProvider>
        <ChapterBacklogPlannerView
          workspace={workspace}
          onSelectScene={onSelectScene}
          onUpdateProposalScene={onUpdateProposalScene}
          onAcceptProposal={onAcceptProposal}
        />
      </I18nProvider>,
    )

    await user.click(screen.getByRole('button', { name: /Proposal scene 2/i }))
    expect(onSelectScene).toHaveBeenCalledWith('scene-concourse-delay')

    const orderInput = screen.getAllByRole('spinbutton')[1]!
    await user.clear(orderInput)
    await user.type(orderInput, '1')

    const summaryInputs = screen.getAllByRole('textbox', { name: 'Scene summary' })
    await user.clear(summaryInputs[1]!)
    await user.type(summaryInputs[1]!, 'Open on the bottleneck first.')

    const saveButtons = screen.getAllByRole('button', { name: 'Save scene plan' })
    await user.click(saveButtons[1]!)

    expect(onUpdateProposalScene).toHaveBeenCalledWith(
      activeProposal.proposalId,
      activeProposal.scenes[1]!.proposalSceneId,
      expect.objectContaining({
        patch: expect.objectContaining({
          summary: 'Open on the bottleneck first.',
        }),
        order: 1,
      }),
    )

    await user.click(screen.getByRole('button', { name: 'Accept scene plan' }))
    expect(onAcceptProposal).toHaveBeenCalledWith(activeProposal.proposalId)
  })

  it('shows the accepted canonical plan badge without moving actions into inspector or dock', () => {
    const workspace = buildChapterBacklogAcceptedStoryWorkspace('scene-midnight-platform')

    render(
      <I18nProvider>
        <ChapterBacklogPlannerView workspace={workspace} />
      </I18nProvider>,
    )

    expect(screen.getByText('Current canonical plan')).toBeInTheDocument()
    expect(screen.queryByText('Inspector')).not.toBeInTheDocument()
    expect(screen.queryByText('Bottom Dock')).not.toBeInTheDocument()
  })
})
