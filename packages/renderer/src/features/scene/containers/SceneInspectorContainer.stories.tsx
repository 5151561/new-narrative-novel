import type { Meta, StoryObj } from '@storybook/react'

import { SceneInspectorContainer } from './SceneInspectorContainer'
import { withSceneStoryShell } from './scene-storybook'

const meta = {
  title: 'Mockups/Scene/Inspector',
  component: SceneInspectorContainer,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withSceneStoryShell('ring-panel flex min-h-[760px] w-[360px] flex-col overflow-hidden rounded-md bg-surface-1')],
} satisfies Meta<typeof SceneInspectorContainer>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    sceneId: 'scene-midnight-platform',
  },
  parameters: {
    sceneStory: {
      search: '?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution',
      uiState: {
        inspectorTab: 'context',
      },
    },
  },
}

export const Versions: Story = {
  args: {
    sceneId: 'scene-midnight-platform',
  },
  parameters: {
    sceneStory: {
      search: '?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution',
      uiState: {
        inspectorTab: 'versions',
      },
    },
  },
}

export const Traceability: Story = {
  args: {
    sceneId: 'scene-midnight-platform',
  },
  parameters: {
    sceneStory: {
      search: '?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution',
      uiState: {
        inspectorTab: 'traceability',
      },
    },
  },
}
