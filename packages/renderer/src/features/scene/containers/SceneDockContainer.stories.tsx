import type { Meta, StoryObj } from '@storybook/react'

import { SceneDockContainer } from './SceneDockContainer'
import { withSceneStoryShell } from './scene-storybook'

const meta = {
  title: 'Mockups/Scene/Bottom Dock',
  component: SceneDockContainer,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withSceneStoryShell('ring-panel flex min-h-[420px] flex-col overflow-hidden rounded-md bg-surface-1')],
} satisfies Meta<typeof SceneDockContainer>

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
        dockTab: 'events',
      },
    },
  },
}

export const EventsWithClickableRefs: Story = {
  args: {
    sceneId: 'scene-midnight-platform',
    initialSelectedArtifactId: 'ctx-scene-midnight-platform-run-001',
    initialInspectorMode: 'artifact',
  },
  parameters: {
    sceneStory: {
      search: '?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution',
      uiState: {
        dockTab: 'events',
      },
    },
  },
}

export const EventsTraceInspector: Story = {
  args: {
    sceneId: 'scene-midnight-platform',
    initialSelectedArtifactId: 'proposal-set-scene-midnight-platform-run-001',
    initialInspectorMode: 'trace',
  },
  parameters: {
    sceneStory: {
      search: '?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution',
      uiState: {
        dockTab: 'events',
      },
    },
  },
}

export const Trace: Story = {
  args: {
    sceneId: 'scene-midnight-platform',
  },
  parameters: {
    sceneStory: {
      search: '?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution',
      uiState: {
        dockTab: 'trace',
      },
    },
  },
}
