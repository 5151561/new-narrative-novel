import type { Meta, StoryObj } from '@storybook/react'

import type { SceneRuntimeBridge } from '@/features/scene/api/scene-client'
import type { SceneProseViewModel } from '@/features/scene/types/scene-view-models'
import { createSceneMockDatabase } from '@/mock/scene-fixtures'

import { SceneProseContainer } from './SceneProseContainer'
import { withSceneStoryShell } from './scene-storybook'

function getSceneRecord(sceneId: string) {
  const scene = createSceneMockDatabase().scenes[sceneId]
  if (!scene) {
    throw new Error(`Unknown scene "${sceneId}"`)
  }

  return scene
}

function createProseBridge(buildProse: (baseProse: SceneProseViewModel, sceneId: string) => SceneProseViewModel): SceneRuntimeBridge {
  return {
    async getSceneWorkspace(sceneId) {
      return structuredClone(getSceneRecord(sceneId).workspace)
    },
    async getSceneExecution(sceneId) {
      return structuredClone(getSceneRecord(sceneId).execution)
    },
    async getSceneProse(sceneId) {
      return buildProse(structuredClone(getSceneRecord(sceneId).prose), sceneId)
    },
  }
}

const generatedFromRunBridge = createProseBridge((baseProse) => ({
  ...baseProse,
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
}))

const revisionCandidateBridge = createProseBridge((baseProse) => ({
  ...baseProse,
  proseDraft: 'Midnight Platform keeps the accepted run draft visible while the revision candidate waits for review.',
  latestDiffSummary: 'Expanded witness-facing beats while preserving accepted provenance.',
  statusLabel: 'Revision candidate ready',
  revisionQueueCount: 1,
  draftWordCount: 18,
  revisionCandidate: {
    revisionId: 'revision-scene-midnight-platform-001',
    revisionMode: 'expand',
    instruction: 'Keep the witness pressure public.',
    proseBody:
      'Midnight Platform now runs an expand revision pass against the accepted draft. Editorial instruction: Keep the witness pressure public. The candidate keeps the ledger visible and the bargain public without changing accepted canon facts.',
    diffSummary: 'Expanded witness-facing beats while preserving accepted provenance.',
    sourceProseDraftId: 'prose-draft-scene-midnight-platform-002',
    sourceCanonPatchId: 'canon-patch-scene-midnight-platform-002',
    contextPacketId: 'ctx-scene-midnight-platform-run-002',
    fallbackProvenance: {
      provider: 'fixture',
      modelId: 'fixture-scene-prose-writer',
    },
  },
  traceSummary: {
    sourcePatchId: 'canon-patch-scene-midnight-platform-002',
    sourceProseDraftId: 'prose-draft-scene-midnight-platform-002',
    contextPacketId: 'ctx-scene-midnight-platform-run-002',
    sourceProposals: [
      {
        proposalId: 'proposal-set-scene-midnight-platform-run-002-proposal-001',
        title: 'Anchor the arrival beat',
      },
    ],
    acceptedFactIds: ['canon-patch-scene-midnight-platform-002-fact-001'],
    relatedAssets: [{ assetId: 'asset-ren-voss', title: 'Ren Voss', kind: 'character' }],
    missingLinks: [],
  },
}))

const acceptedRevisionBridge = createProseBridge((baseProse) => ({
  ...baseProse,
  proseDraft:
    'Midnight Platform now runs an expand revision pass against the accepted draft. Editorial instruction: Keep the witness pressure public. The accepted draft keeps the ledger visible and the bargain public without changing accepted canon facts.',
  latestDiffSummary: 'Expanded witness-facing beats while preserving accepted provenance.',
  statusLabel: 'Updated',
  revisionQueueCount: 0,
  draftWordCount: 35,
  traceSummary: {
    sourcePatchId: 'canon-patch-scene-midnight-platform-002',
    sourceProseDraftId: 'accepted-prose-revision-revision-scene-midnight-platform-001',
    contextPacketId: 'ctx-scene-midnight-platform-run-002',
    sourceProposals: baseProse.traceSummary?.sourceProposals,
    acceptedFactIds: ['canon-patch-scene-midnight-platform-002-fact-001'],
    relatedAssets: baseProse.traceSummary?.relatedAssets,
    missingLinks: [],
  },
}))

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
  name: 'Scene / Draft / Current Prose',
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

export const RevisionCandidatePendingReview: Story = {
  name: 'Scene / Draft / Pending Revision Candidate',
  args: {
    sceneId: 'scene-midnight-platform',
  },
  parameters: {
    sceneStory: {
      search: '?scope=scene&id=scene-midnight-platform&lens=draft&tab=prose',
      bridge: revisionCandidateBridge,
    },
  },
}

export const AcceptedRevisionCurrentDraft: Story = {
  args: {
    sceneId: 'scene-midnight-platform',
  },
  parameters: {
    sceneStory: {
      search: '?scope=scene&id=scene-midnight-platform&lens=draft&tab=prose',
      bridge: acceptedRevisionBridge,
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
