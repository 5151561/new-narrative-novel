import type { Meta, StoryObj } from '@storybook/react'

import {
  exportMockRunSnapshot,
  importMockRunSnapshot,
  resetMockRunDb,
} from '@/features/run/api/mock-run-db'

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

export const LongEvents: Story = {
  args: {
    sceneId: 'scene-midnight-platform',
    initialSelectedArtifactId: 'proposal-set-scene-midnight-platform-run-001',
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

export const ContextPacketActivationTrace: Story = {
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

export const ProposalVariants: Story = {
  args: {
    sceneId: 'scene-midnight-platform',
    initialSelectedArtifactId: 'proposal-set-scene-midnight-platform-run-001',
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

export const WaitingReviewSupportOnly: Story = {
  name: 'Scene / Dock / WaitingReviewSupportOnly',
  args: {
    sceneId: 'scene-midnight-platform',
    initialSelectedArtifactId: 'proposal-set-scene-midnight-platform-run-001',
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

export const FailureRecoveryCost: Story = {
  args: {
    sceneId: 'scene-midnight-platform',
    initialSelectedArtifactId: 'proposal-set-scene-midnight-platform-run-001',
    initialInspectorMode: 'artifact',
  },
  render: (args) => {
    resetMockRunDb()
    const snapshot = exportMockRunSnapshot()
    const state = snapshot.runStatesByProjectId['book-signal-arc']?.find((entry) => entry.run.id === 'run-scene-midnight-platform-001')
    if (state) {
      state.run.status = 'waiting_review'
      state.run.summary = 'Planner packaging stalled after a provider retry; review can inspect the partial output.'
      state.run.failureClass = 'provider_error'
      state.run.failureMessage = 'Provider returned 502 while proposal packaging was being finalized.'
      state.run.usage = {
        inputTokens: 8200,
        outputTokens: 1100,
        estimatedCostUsd: 0.19,
        provider: 'openai',
        modelId: 'gpt-5.4',
      }
      state.run.runtimeSummary = {
        health: 'attention',
        tokenLabel: '8.2k tokens',
        costLabel: '$0.19 est.',
        failureClassLabel: 'Watching provider retries',
        nextActionLabel: 'Review proposals before retrying the writer path.',
      }
    }
    importMockRunSnapshot(snapshot)
    return <SceneDockContainer {...args} />
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

export const GateDFailureRecoveryCost: Story = {
  ...FailureRecoveryCost,
}
