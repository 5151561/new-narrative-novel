import type { Meta, StoryObj } from '@storybook/react'

import { submitMockRunReviewDecision } from '@/features/run/api/mock-run-db'

import { SceneWorkspace } from './SceneWorkspace'
import { withSceneStoryShell } from './scene-storybook'

const meta = {
  title: 'Mockups/Scene/Workspace',
  component: SceneWorkspace,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withSceneStoryShell('ring-panel overflow-hidden rounded-md bg-surface-1')],
} satisfies Meta<typeof SceneWorkspace>

export default meta

type Story = StoryObj<typeof meta>

function prepareRewriteRequestedStory() {
  submitMockRunReviewDecision({
    runId: 'run-scene-midnight-platform-001',
    reviewId: 'review-scene-midnight-platform-001',
    decision: 'request-rewrite',
    note: 'Rebuild the witness handoff before the next pass.',
  })
}

export const Final: Story = {
  args: {
    sceneId: 'scene-midnight-platform',
    defaultTab: 'execution',
  },
  parameters: {
    sceneStory: {
      search: '?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution',
    },
  },
}

export const Draft: Story = {
  args: {
    sceneId: 'scene-warehouse-bridge',
    defaultTab: 'setup',
  },
  parameters: {
    sceneStory: {
      search: '?scope=scene&id=scene-warehouse-bridge&lens=structure&tab=setup',
    },
  },
}

export const ExecutionSelection: Story = {
  args: {
    sceneId: 'scene-midnight-platform',
    defaultTab: 'execution',
  },
  parameters: {
    sceneStory: {
      search:
        '?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution&beatId=beat-bargain&proposalId=proposal-2',
    },
  },
}

export const WaitingReviewMainStageGate: Story = {
  name: 'Scene / Orchestrate / WaitingReviewMainStageGate',
  args: {
    sceneId: 'scene-midnight-platform',
    defaultTab: 'execution',
  },
  parameters: {
    sceneStory: {
      search: '?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution',
    },
  },
}

export const RewriteRequestedManualRestart: Story = {
  name: 'Scene / Orchestrate / RewriteRequestedManualRestart',
  args: {
    sceneId: 'scene-midnight-platform',
    defaultTab: 'execution',
  },
  parameters: {
    sceneStory: {
      search: '?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution',
      prepareEnvironment: prepareRewriteRequestedStory,
    },
  },
}

export const PatchPreviewOpen: Story = {
  args: {
    sceneId: 'scene-midnight-platform',
    defaultTab: 'execution',
  },
  parameters: {
    sceneStory: {
      search: '?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution',
      uiState: {
        inspectorTab: 'versions',
        patchPreviewOpen: true,
      },
    },
  },
}

export const CapabilityUnavailable: Story = {
  args: {
    sceneId: 'scene-midnight-platform',
    defaultTab: 'execution',
  },
  parameters: {
    sceneStory: {
      search: '?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution',
      bridge: {},
    },
  },
}
