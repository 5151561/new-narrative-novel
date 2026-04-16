import type { Meta, StoryObj } from '@storybook/react'

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
