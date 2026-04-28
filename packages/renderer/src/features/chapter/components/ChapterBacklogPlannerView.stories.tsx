import type { Meta, StoryObj } from '@storybook/react'

import { ChapterBacklogPlannerView } from './ChapterBacklogPlannerView'
import {
  buildChapterBacklogAcceptedStoryWorkspace,
  buildChapterStoryWorkspace,
} from './chapter-story-fixture'
import { ChapterStoryShell } from './chapter-storybook'

interface ChapterBacklogPlannerStoryProps {
  selectedSceneId: string
  state: 'proposal' | 'accepted' | 'empty' | 'loading'
}

function buildWorkspace(selectedSceneId: string, state: ChapterBacklogPlannerStoryProps['state']) {
  if (state === 'accepted') {
    return buildChapterBacklogAcceptedStoryWorkspace(selectedSceneId)
  }

  const workspace = buildChapterStoryWorkspace(selectedSceneId)
  if (state === 'empty') {
    return {
      ...workspace,
      planning: {
        ...workspace.planning,
        proposals: [],
        acceptedProposalId: undefined,
      },
    }
  }

  return workspace
}

function ChapterBacklogPlannerStory({ selectedSceneId, state }: ChapterBacklogPlannerStoryProps) {
  const workspace = buildWorkspace(selectedSceneId, state)

  return (
    <ChapterBacklogPlannerView
      workspace={workspace}
      generatingProposal={state === 'loading'}
      savingPlanning={state === 'loading'}
      updatingProposalSceneId={state === 'loading' ? workspace.planning.proposals[0]?.scenes[0]?.proposalSceneId ?? null : null}
      acceptingProposalId={state === 'loading' ? workspace.planning.proposals[0]?.proposalId ?? null : null}
    />
  )
}

const meta = {
  title: 'Business/ChapterBacklogPlannerView',
  component: ChapterBacklogPlannerStory,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <ChapterStoryShell frameClassName="max-w-6xl">
      <ChapterBacklogPlannerStory {...args} />
    </ChapterStoryShell>
  ),
  args: {
    selectedSceneId: 'scene-concourse-delay',
    state: 'proposal',
  },
} satisfies Meta<typeof ChapterBacklogPlannerStory>

export default meta

type Story = StoryObj<typeof meta>

export const ProposalReady: Story = {}

export const AcceptedPlan: Story = {
  args: {
    state: 'accepted',
  },
}

export const EmptyProposal: Story = {
  args: {
    state: 'empty',
  },
}

export const LoadingState: Story = {
  args: {
    state: 'loading',
  },
}
