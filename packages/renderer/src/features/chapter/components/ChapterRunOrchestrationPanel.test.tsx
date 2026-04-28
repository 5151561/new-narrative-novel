import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'

import { ChapterRunOrchestrationPanel } from './ChapterRunOrchestrationPanel'

describe('ChapterRunOrchestrationPanel', () => {
  it('calls onStartNextScene when the next scene is runnable', async () => {
    const user = userEvent.setup()
    const onStartNextScene = vi.fn()

    render(
      <AppProviders>
        <ChapterRunOrchestrationPanel
          title="Chapter orchestration"
          description="Advance the next accepted backlog scene and stop at review."
          nextScene={{
            sceneId: 'scene-concourse-delay',
            title: 'Concourse Delay',
            order: 2,
            summary: 'Carry witness pressure into the concourse.',
            backlogStatusLabel: 'Planned',
            runStatusLabel: 'Idle',
          }}
          waitingReviewScenes={[]}
          draftedSceneCount={1}
          missingDraftCount={2}
          onStartNextScene={onStartNextScene}
        />
      </AppProviders>,
    )

    await user.click(screen.getByRole('button', { name: 'Start next scene run' }))
    expect(onStartNextScene).toHaveBeenCalledTimes(1)
  })

  it('disables the button and shows waiting-review scenes when review is pending', () => {
    render(
      <AppProviders>
        <ChapterRunOrchestrationPanel
          title="Chapter orchestration"
          description="Advance the next accepted backlog scene and stop at review."
          waitingReviewScenes={[
            {
              sceneId: 'scene-concourse-delay',
              title: 'Concourse Delay',
              order: 2,
              backlogStatus: 'needs_review',
              runStatusLabel: 'Run waiting for review',
            },
          ]}
          draftedSceneCount={1}
          missingDraftCount={2}
        />
      </AppProviders>,
    )

    expect(screen.getByRole('button', { name: 'Review pending' })).toBeDisabled()
    expect(screen.getByText('Scene 2 · Concourse Delay')).toBeInTheDocument()
  })

  it('disables the button when an earlier scene is still running', () => {
    render(
      <AppProviders>
        <ChapterRunOrchestrationPanel
          title="Chapter orchestration"
          description="Advance the next accepted backlog scene and stop at review."
          nextScene={{
            sceneId: 'scene-ticket-window',
            title: 'Ticket Window',
            order: 3,
            summary: 'Keep the alias offstage.',
            backlogStatusLabel: 'Planned',
            runStatusLabel: 'Idle',
          }}
          waitingReviewScenes={[
            {
              sceneId: 'scene-concourse-delay',
              title: 'Concourse Delay',
              order: 2,
              backlogStatus: 'running',
              runStatusLabel: 'Run in progress',
            },
          ]}
          draftedSceneCount={1}
          missingDraftCount={2}
        />
      </AppProviders>,
    )

    expect(screen.getByRole('button', { name: 'Scene running' })).toBeDisabled()
    expect(screen.getByText('Running 1')).toBeInTheDocument()
    expect(screen.getByText('Run in progress')).toBeInTheDocument()
  })

  it('shows a complete state when no runnable scene remains', () => {
    render(
      <AppProviders>
        <ChapterRunOrchestrationPanel
          title="Chapter orchestration"
          description="Advance the next accepted backlog scene and stop at review."
          waitingReviewScenes={[]}
          draftedSceneCount={3}
          missingDraftCount={0}
        />
      </AppProviders>,
    )

    expect(screen.getByRole('button', { name: 'Chapter run complete' })).toBeDisabled()
  })
})
