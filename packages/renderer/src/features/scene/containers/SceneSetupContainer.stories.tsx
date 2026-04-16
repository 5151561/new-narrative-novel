import type { Meta, StoryObj } from '@storybook/react'

import { SceneSetupContainer } from './SceneSetupContainer'
import { withSceneStoryShell } from './scene-storybook'

const meta = {
  title: 'Mockups/Scene/Setup',
  component: SceneSetupContainer,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withSceneStoryShell('ring-panel flex min-h-[840px] overflow-hidden rounded-md bg-surface-1')],
} satisfies Meta<typeof SceneSetupContainer>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    sceneId: 'scene-midnight-platform',
  },
  parameters: {
    sceneStory: {
      search: '?scope=scene&id=scene-midnight-platform&lens=structure&tab=setup',
    },
  },
}

export const DraftSetup: Story = {
  args: {
    sceneId: 'scene-warehouse-bridge',
  },
  parameters: {
    sceneStory: {
      search: '?scope=scene&id=scene-warehouse-bridge&lens=structure&tab=setup',
    },
  },
}
