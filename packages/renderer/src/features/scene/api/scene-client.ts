import {
  applyProposalAction,
  applyProseRevision,
  commitAcceptedPatch,
  continueSceneRun,
  createSceneMockDatabase,
  getSceneDockSummary,
  getSceneDockTab,
  previewAcceptedPatch,
  saveSceneSetup,
  switchSceneThread,
  type SceneMockDatabase,
} from '@/mock/scene-fixtures'

import type {
  ProposalActionInput,
  SceneDockTabId,
  SceneDockViewModel,
  SceneExecutionViewModel,
  SceneInspectorViewModel,
  ScenePatchPreviewViewModel,
  SceneProseViewModel,
  SceneSetupViewModel,
  SceneWorkspaceViewModel,
} from '../types/scene-view-models'

export type SceneRuntimeSource = 'preload-bridge' | 'mock-fallback'

export interface SceneRuntimeInfo {
  source: SceneRuntimeSource
  label: string
  capabilities: Record<string, boolean>
}

export interface SceneRuntimeBridge {
  getSceneWorkspace?: (sceneId: string) => Promise<SceneWorkspaceViewModel>
  getSceneSetup?: (sceneId: string) => Promise<SceneSetupViewModel>
  getSceneExecution?: (sceneId: string) => Promise<SceneExecutionViewModel>
  getSceneProse?: (sceneId: string) => Promise<SceneProseViewModel>
  getSceneInspector?: (sceneId: string) => Promise<SceneInspectorViewModel>
  getSceneDockSummary?: (sceneId: string) => Promise<SceneDockViewModel>
  getSceneDockTab?: (sceneId: string, tab: SceneDockTabId) => Promise<Partial<SceneDockViewModel>>
  previewAcceptedPatch?: (sceneId: string) => Promise<ScenePatchPreviewViewModel | null>
  commitAcceptedPatch?: (sceneId: string, patchId: string) => Promise<void>
  saveSceneSetup?: (sceneId: string, setup: SceneSetupViewModel) => Promise<void>
  reviseSceneProse?: (sceneId: string, revisionMode: SceneProseViewModel['revisionModes'][number]) => Promise<void>
  continueSceneRun?: (sceneId: string) => Promise<void>
  switchSceneThread?: (sceneId: string, threadId: string) => Promise<void>
  acceptProposal?: (sceneId: string, input: ProposalActionInput) => Promise<void>
  editAcceptProposal?: (sceneId: string, input: ProposalActionInput) => Promise<void>
  requestRewrite?: (sceneId: string, input: ProposalActionInput) => Promise<void>
  rejectProposal?: (sceneId: string, input: ProposalActionInput) => Promise<void>
}

declare global {
  interface Window {
    narrativeRuntimeBridge?: {
      scene?: SceneRuntimeBridge
    }
  }
}

export interface SceneClient {
  getRuntimeInfo(): Promise<SceneRuntimeInfo>
  getSceneWorkspace(sceneId: string): Promise<SceneWorkspaceViewModel>
  getSceneSetup(sceneId: string): Promise<SceneSetupViewModel>
  getSceneExecution(sceneId: string): Promise<SceneExecutionViewModel>
  getSceneProse(sceneId: string): Promise<SceneProseViewModel>
  getSceneInspector(sceneId: string): Promise<SceneInspectorViewModel>
  getSceneDockSummary(sceneId: string): Promise<SceneDockViewModel>
  getSceneDockTab(sceneId: string, tab: SceneDockTabId): Promise<Partial<SceneDockViewModel>>
  previewAcceptedPatch(sceneId: string): Promise<ScenePatchPreviewViewModel | null>
  commitAcceptedPatch(sceneId: string, patchId: string): Promise<void>
  saveSceneSetup(sceneId: string, setup: SceneSetupViewModel): Promise<void>
  reviseSceneProse(sceneId: string, revisionMode: SceneProseViewModel['revisionModes'][number]): Promise<void>
  continueSceneRun(sceneId: string): Promise<void>
  switchSceneThread(sceneId: string, threadId: string): Promise<void>
  acceptProposal(sceneId: string, input: ProposalActionInput): Promise<void>
  editAcceptProposal(sceneId: string, input: ProposalActionInput): Promise<void>
  requestRewrite(sceneId: string, input: ProposalActionInput): Promise<void>
  rejectProposal(sceneId: string, input: ProposalActionInput): Promise<void>
}

interface CreateSceneClientOptions {
  database?: SceneMockDatabase
  bridgeResolver?: () => SceneRuntimeBridge | undefined
}

const runtimeCapabilityList = [
  'getSceneWorkspace',
  'getSceneSetup',
  'getSceneExecution',
  'getSceneProse',
  'getSceneInspector',
  'getSceneDockSummary',
  'getSceneDockTab',
  'previewAcceptedPatch',
  'commitAcceptedPatch',
  'saveSceneSetup',
  'reviseSceneProse',
  'continueSceneRun',
  'switchSceneThread',
  'acceptProposal',
  'editAcceptProposal',
  'requestRewrite',
  'rejectProposal',
] as const

function clone<T>(value: T): T {
  return structuredClone(value)
}

function resolveWindowSceneBridge() {
  if (typeof window === 'undefined') {
    return undefined
  }

  return window.narrativeRuntimeBridge?.scene
}

function buildRuntimeInfo(bridge: SceneRuntimeBridge | undefined): SceneRuntimeInfo {
  return {
    source: bridge ? 'preload-bridge' : 'mock-fallback',
    label: bridge ? 'Preload Bridge' : 'Preview Data',
    capabilities: Object.fromEntries(
      runtimeCapabilityList.map((capability) => [capability, Boolean(bridge?.[capability])]),
    ),
  }
}

export function createSceneClient({
  database = createSceneMockDatabase(),
  bridgeResolver = resolveWindowSceneBridge,
}: CreateSceneClientOptions = {}): SceneClient {
  async function getScene(sceneId: string) {
    const scene = database.scenes[sceneId]
    if (!scene) {
      throw new Error(`Unknown scene "${sceneId}"`)
    }

    return scene
  }

  async function runWriteThrough(
    bridgeWrite: (() => Promise<void>) | undefined,
    fallbackWrite: () => void,
  ) {
    if (bridgeWrite) {
      await bridgeWrite()
      fallbackWrite()
      return
    }

    fallbackWrite()
  }

  return {
    async getRuntimeInfo() {
      return buildRuntimeInfo(bridgeResolver())
    },
    async getSceneWorkspace(sceneId) {
      const bridge = bridgeResolver()
      if (bridge?.getSceneWorkspace) {
        return bridge.getSceneWorkspace(sceneId)
      }

      const scene = await getScene(sceneId)
      return clone(scene.workspace)
    },
    async getSceneSetup(sceneId) {
      const bridge = bridgeResolver()
      if (bridge?.getSceneSetup) {
        return bridge.getSceneSetup(sceneId)
      }

      const scene = await getScene(sceneId)
      return clone(scene.setup)
    },
    async getSceneExecution(sceneId) {
      const bridge = bridgeResolver()
      if (bridge?.getSceneExecution) {
        return bridge.getSceneExecution(sceneId)
      }

      const scene = await getScene(sceneId)
      return clone(scene.execution)
    },
    async getSceneProse(sceneId) {
      const bridge = bridgeResolver()
      if (bridge?.getSceneProse) {
        return bridge.getSceneProse(sceneId)
      }

      const scene = await getScene(sceneId)
      return clone(scene.prose)
    },
    async getSceneInspector(sceneId) {
      const bridge = bridgeResolver()
      if (bridge?.getSceneInspector) {
        return bridge.getSceneInspector(sceneId)
      }

      const scene = await getScene(sceneId)
      return clone(scene.inspector)
    },
    async getSceneDockSummary(sceneId) {
      const bridge = bridgeResolver()
      if (bridge?.getSceneDockSummary) {
        return bridge.getSceneDockSummary(sceneId)
      }

      return getSceneDockSummary(database, sceneId)
    },
    async getSceneDockTab(sceneId, tab) {
      const bridge = bridgeResolver()
      if (bridge?.getSceneDockTab) {
        return bridge.getSceneDockTab(sceneId, tab)
      }

      return getSceneDockTab(database, sceneId, tab)
    },
    async previewAcceptedPatch(sceneId) {
      const bridge = bridgeResolver()
      if (bridge?.previewAcceptedPatch) {
        return bridge.previewAcceptedPatch(sceneId)
      }

      return previewAcceptedPatch(database, sceneId)
    },
    async commitAcceptedPatch(sceneId, patchId) {
      const bridge = bridgeResolver()
      if (bridge?.commitAcceptedPatch) {
        await bridge.commitAcceptedPatch(sceneId, patchId)
        const localPreview = previewAcceptedPatch(database, sceneId)
        if (localPreview?.patchId === patchId) {
          commitAcceptedPatch(database, sceneId, patchId)
        }
        return
      }

      commitAcceptedPatch(database, sceneId, patchId)
    },
    async saveSceneSetup(sceneId, setup) {
      const bridge = bridgeResolver()
      await runWriteThrough(
        bridge?.saveSceneSetup ? () => bridge.saveSceneSetup!(sceneId, setup) : undefined,
        () => saveSceneSetup(database, sceneId, setup),
      )
    },
    async reviseSceneProse(sceneId, revisionMode) {
      const bridge = bridgeResolver()
      await runWriteThrough(
        bridge?.reviseSceneProse ? () => bridge.reviseSceneProse!(sceneId, revisionMode) : undefined,
        () => applyProseRevision(database, sceneId, revisionMode),
      )
    },
    async continueSceneRun(sceneId) {
      const bridge = bridgeResolver()
      await runWriteThrough(
        bridge?.continueSceneRun ? () => bridge.continueSceneRun!(sceneId) : undefined,
        () => continueSceneRun(database, sceneId),
      )
    },
    async switchSceneThread(sceneId, threadId) {
      const bridge = bridgeResolver()
      await runWriteThrough(
        bridge?.switchSceneThread ? () => bridge.switchSceneThread!(sceneId, threadId) : undefined,
        () => switchSceneThread(database, sceneId, threadId),
      )
    },
    async acceptProposal(sceneId, input) {
      const bridge = bridgeResolver()
      await runWriteThrough(
        bridge?.acceptProposal ? () => bridge.acceptProposal!(sceneId, input) : undefined,
        () => applyProposalAction(database, sceneId, 'accept', input),
      )
    },
    async editAcceptProposal(sceneId, input) {
      const bridge = bridgeResolver()
      await runWriteThrough(
        bridge?.editAcceptProposal ? () => bridge.editAcceptProposal!(sceneId, input) : undefined,
        () => applyProposalAction(database, sceneId, 'editAccept', input),
      )
    },
    async requestRewrite(sceneId, input) {
      const bridge = bridgeResolver()
      await runWriteThrough(
        bridge?.requestRewrite ? () => bridge.requestRewrite!(sceneId, input) : undefined,
        () => applyProposalAction(database, sceneId, 'requestRewrite', input),
      )
    },
    async rejectProposal(sceneId, input) {
      const bridge = bridgeResolver()
      await runWriteThrough(
        bridge?.rejectProposal ? () => bridge.rejectProposal!(sceneId, input) : undefined,
        () => applyProposalAction(database, sceneId, 'reject', input),
      )
    },
  }
}

export const sceneClient = createSceneClient()
