import type { Meta, StoryObj } from '@storybook/react'

import type { SceneRuntimeBridge } from '@/features/scene/api/scene-client'
import { createSceneMockDatabase } from '@/mock/scene-fixtures'

import { SceneProseContainer } from './SceneProseContainer'
import { withSceneStoryShell } from './scene-storybook'

const generatedFromRunBridge: SceneRuntimeBridge = {
  async getSceneWorkspace(sceneId) {
    const scene = createSceneMockDatabase().scenes[sceneId]
    if (!scene) {
      throw new Error(`Unknown scene "${sceneId}"`)
    }

    return structuredClone(scene.workspace)
  },
  async getSceneExecution(sceneId) {
    const scene = createSceneMockDatabase().scenes[sceneId]
    if (!scene) {
      throw new Error(`Unknown scene "${sceneId}"`)
    }

    return structuredClone(scene.execution)
  },
  async getSceneProse(sceneId) {
    const scene = createSceneMockDatabase().scenes[sceneId]
    if (!scene) {
      throw new Error(`Unknown scene "${sceneId}"`)
    }

    return {
      ...structuredClone(scene.prose),
      proseDraft: 'Midnight Platform opens from the accepted run artifact while the ledger stays shut between Ren and Mei.',
      latestDiffSummary: 'Generated from accepted run prose artifact.',
      statusLabel: 'Generated from run',
      traceSummary: {
        sourcePatchId: 'canon-patch-scene-midnight-platform-001',
        sourceProposals: [
          {
            proposalId: 'proposal-set-scene-midnight-platform-run-001-proposal-001',
            title: 'Anchor the arrival beat',
            sourceTraceId: 'trace-accepted-1',
          },
          {
            proposalId: 'proposal-set-scene-midnight-platform-run-001-proposal-002',
            title: 'Stage the reveal through the setting',
            sourceTraceId: 'trace-accepted-2',
          },
        ],
        acceptedFactIds: ['fact-1', 'fact-2'],
        relatedAssets: [
          { assetId: 'asset-ren-voss', title: 'Ren Voss', kind: 'character' },
          { assetId: 'asset-ledger-stays-shut', title: 'Ledger stays shut', kind: 'rule' },
        ],
        missingLinks: [],
      },
    }
  },
}

const revisionQueuedBridge: SceneRuntimeBridge = {
  async getSceneWorkspace(sceneId) {
    const scene = createSceneMockDatabase().scenes[sceneId]
    if (!scene) {
      throw new Error(`Unknown scene "${sceneId}"`)
    }

    return structuredClone(scene.workspace)
  },
  async getSceneExecution(sceneId) {
    const scene = createSceneMockDatabase().scenes[sceneId]
    if (!scene) {
      throw new Error(`Unknown scene "${sceneId}"`)
    }

    return structuredClone(scene.execution)
  },
  async getSceneProse(sceneId) {
    const scene = createSceneMockDatabase().scenes[sceneId]
    if (!scene) {
      throw new Error(`Unknown scene "${sceneId}"`)
    }

    return {
      ...structuredClone(scene.prose),
      proseDraft: 'Midnight Platform keeps the accepted run draft visible while the next revision waits in the queue.',
      latestDiffSummary: 'Latest revision: rewrite pass prepared for review.',
      statusLabel: 'Revision queued',
      revisionQueueCount: 2,
      warningsCount: 1,
    }
  },
}

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

export const GeneratedFromAcceptedRun: Story = {
  args: {
    sceneId: 'scene-midnight-platform',
  },
  parameters: {
    sceneStory: {
      search: '?scope=scene&id=scene-midnight-platform&lens=draft&tab=prose',
      bridge: generatedFromRunBridge,
    },
  },
}

export const GeneratedFromRun: Story = GeneratedFromAcceptedRun

export const RevisionQueued: Story = {
  args: {
    sceneId: 'scene-midnight-platform',
  },
  parameters: {
    sceneStory: {
      search: '?scope=scene&id=scene-midnight-platform&lens=draft&tab=prose',
      bridge: revisionQueuedBridge,
    },
  },
}

export const NoDraftCannotRevise: Story = {
  args: {
    sceneId: 'scene-warehouse-bridge',
  },
  parameters: {
    sceneStory: {
      search: '?scope=scene&id=scene-warehouse-bridge&lens=draft&tab=prose',
    },
  },
}
