import type { Meta, StoryObj } from '@storybook/react'

import { SceneProseContainer } from './SceneProseContainer'
import { withSceneStoryShell } from './scene-storybook'

const meta = {
  title: 'Mockups/Scene/Prose',
  component: SceneProseContainer,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withSceneStoryShell('ring-panel flex min-h-[720px] overflow-hidden rounded-md bg-surface-1')],
} satisfies Meta<typeof SceneProseContainer>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    sceneId: 'scene-midnight-platform',
  },
  parameters: {
    sceneStory: {
      search: '?scope=scene&id=scene-midnight-platform&lens=draft&tab=prose',
    },
  },
}

export const EmptyDraft: Story = {
  args: {
    sceneId: 'scene-warehouse-bridge',
  },
  parameters: {
    sceneStory: {
      search: '?scope=scene&id=scene-warehouse-bridge&lens=draft&tab=prose',
    },
  },
}
