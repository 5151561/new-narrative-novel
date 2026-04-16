import { resolveAppLocale, type Locale } from '@/app/i18n'
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
import {
  SceneRuntimeCapabilityError,
  type SceneClient,
  type SceneRuntimeBridge,
  type SceneRuntimeCapability,
  type SceneRuntimeInfo,
  sceneRuntimeCapabilities,
} from './scene-runtime'

export type {
  SceneClient,
  SceneRuntimeBridge,
  SceneRuntimeCapability,
  SceneRuntimeInfo,
  SceneRuntimeSource,
} from './scene-runtime'
export { SceneRuntimeCapabilityError } from './scene-runtime'

declare global {
  interface Window {
    narrativeRuntimeBridge?: {
      scene?: SceneRuntimeBridge
    }
  }
}

interface CreateSceneClientOptions {
  database?: SceneMockDatabase
  databaseFactory?: (locale: Locale) => SceneMockDatabase
  bridgeResolver?: () => SceneRuntimeBridge | undefined
  localeResolver?: () => Locale
}

interface SceneRuntimeAdapter extends Omit<SceneClient, 'getRuntimeInfo'> {
  info: SceneRuntimeInfo
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function resolveWindowSceneBridge() {
  if (typeof window === 'undefined') {
    return undefined
  }

  return window.narrativeRuntimeBridge?.scene
}

function buildRuntimeInfo(bridge: SceneRuntimeBridge | undefined, locale: Locale): SceneRuntimeInfo {
  return {
    source: bridge ? 'preload-bridge' : 'mock-fallback',
    label: bridge ? (locale === 'zh-CN' ? '预加载桥接' : 'Preload Bridge') : locale === 'zh-CN' ? '预览数据' : 'Preview Data',
    capabilities: Object.fromEntries(
      sceneRuntimeCapabilities.map((capability) => [capability, Boolean(bridge?.[capability])]),
    ) as SceneRuntimeInfo['capabilities'],
  }
}

function getScene(database: SceneMockDatabase, sceneId: string) {
  const scene = database.scenes[sceneId]
  if (!scene) {
    throw new Error(`Unknown scene "${sceneId}"`)
  }

  return scene
}

function requireBridgeCapability<K extends SceneRuntimeCapability>(
  bridge: SceneRuntimeBridge,
  capability: K,
  runtimeInfo: SceneRuntimeInfo,
): NonNullable<SceneRuntimeBridge[K]> {
  const method = bridge[capability]
  if (!method) {
    throw new SceneRuntimeCapabilityError(capability, runtimeInfo)
  }

  return method as NonNullable<SceneRuntimeBridge[K]>
}

export function createSceneClient({
  database,
  databaseFactory = (locale) => createSceneMockDatabase(locale),
  bridgeResolver = resolveWindowSceneBridge,
  localeResolver = resolveAppLocale,
}: CreateSceneClientOptions = {}): SceneClient {
  const localeDatabases = new Map<Locale, SceneMockDatabase>()

  function getDatabase(locale: Locale) {
    if (database) {
      return database
    }

    const existingDatabase = localeDatabases.get(locale)
    if (existingDatabase) {
      return existingDatabase
    }

    const nextDatabase = databaseFactory(locale)
    localeDatabases.set(locale, nextDatabase)
    return nextDatabase
  }

  function createMockRuntime(locale: Locale): SceneRuntimeAdapter {
    const activeDatabase = getDatabase(locale)
    const runtimeInfo = buildRuntimeInfo(undefined, locale)

    return {
      info: runtimeInfo,
      async getSceneWorkspace(sceneId) {
        return clone(getScene(activeDatabase, sceneId).workspace)
      },
      async getSceneSetup(sceneId) {
        return clone(getScene(activeDatabase, sceneId).setup)
      },
      async getSceneExecution(sceneId) {
        return clone(getScene(activeDatabase, sceneId).execution)
      },
      async getSceneProse(sceneId) {
        return clone(getScene(activeDatabase, sceneId).prose)
      },
      async getSceneInspector(sceneId) {
        return clone(getScene(activeDatabase, sceneId).inspector)
      },
      async getSceneDockSummary(sceneId) {
        return getSceneDockSummary(activeDatabase, sceneId)
      },
      async getSceneDockTab(sceneId, tab) {
        return getSceneDockTab(activeDatabase, sceneId, tab)
      },
      async previewAcceptedPatch(sceneId) {
        return previewAcceptedPatch(activeDatabase, sceneId)
      },
      async commitAcceptedPatch(sceneId, patchId) {
        commitAcceptedPatch(activeDatabase, sceneId, patchId)
      },
      async saveSceneSetup(sceneId, setup) {
        saveSceneSetup(activeDatabase, sceneId, setup)
      },
      async reviseSceneProse(sceneId, revisionMode) {
        applyProseRevision(activeDatabase, sceneId, revisionMode)
      },
      async continueSceneRun(sceneId) {
        continueSceneRun(activeDatabase, sceneId)
      },
      async switchSceneThread(sceneId, threadId) {
        switchSceneThread(activeDatabase, sceneId, threadId)
      },
      async acceptProposal(sceneId, input) {
        applyProposalAction(activeDatabase, sceneId, 'accept', input)
      },
      async editAcceptProposal(sceneId, input) {
        applyProposalAction(activeDatabase, sceneId, 'editAccept', input)
      },
      async requestRewrite(sceneId, input) {
        applyProposalAction(activeDatabase, sceneId, 'requestRewrite', input)
      },
      async rejectProposal(sceneId, input) {
        applyProposalAction(activeDatabase, sceneId, 'reject', input)
      },
    }
  }

  function createBridgeRuntime(bridge: SceneRuntimeBridge, locale: Locale): SceneRuntimeAdapter {
    const runtimeInfo = buildRuntimeInfo(bridge, locale)

    return {
      info: runtimeInfo,
      async getSceneWorkspace(sceneId) {
        return clone(await requireBridgeCapability(bridge, 'getSceneWorkspace', runtimeInfo)(sceneId, locale))
      },
      async getSceneSetup(sceneId) {
        return clone(await requireBridgeCapability(bridge, 'getSceneSetup', runtimeInfo)(sceneId, locale))
      },
      async getSceneExecution(sceneId) {
        return clone(await requireBridgeCapability(bridge, 'getSceneExecution', runtimeInfo)(sceneId, locale))
      },
      async getSceneProse(sceneId) {
        return clone(await requireBridgeCapability(bridge, 'getSceneProse', runtimeInfo)(sceneId, locale))
      },
      async getSceneInspector(sceneId) {
        return clone(await requireBridgeCapability(bridge, 'getSceneInspector', runtimeInfo)(sceneId, locale))
      },
      async getSceneDockSummary(sceneId) {
        return clone(await requireBridgeCapability(bridge, 'getSceneDockSummary', runtimeInfo)(sceneId, locale))
      },
      async getSceneDockTab(sceneId, tab) {
        return clone(await requireBridgeCapability(bridge, 'getSceneDockTab', runtimeInfo)(sceneId, tab, locale))
      },
      async previewAcceptedPatch(sceneId) {
        return clone(await requireBridgeCapability(bridge, 'previewAcceptedPatch', runtimeInfo)(sceneId, locale))
      },
      async commitAcceptedPatch(sceneId, patchId) {
        await requireBridgeCapability(bridge, 'commitAcceptedPatch', runtimeInfo)(sceneId, patchId)
      },
      async saveSceneSetup(sceneId, setup) {
        await requireBridgeCapability(bridge, 'saveSceneSetup', runtimeInfo)(sceneId, setup)
      },
      async reviseSceneProse(sceneId, revisionMode) {
        await requireBridgeCapability(bridge, 'reviseSceneProse', runtimeInfo)(sceneId, revisionMode)
      },
      async continueSceneRun(sceneId) {
        await requireBridgeCapability(bridge, 'continueSceneRun', runtimeInfo)(sceneId)
      },
      async switchSceneThread(sceneId, threadId) {
        await requireBridgeCapability(bridge, 'switchSceneThread', runtimeInfo)(sceneId, threadId)
      },
      async acceptProposal(sceneId, input) {
        await requireBridgeCapability(bridge, 'acceptProposal', runtimeInfo)(sceneId, input)
      },
      async editAcceptProposal(sceneId, input) {
        await requireBridgeCapability(bridge, 'editAcceptProposal', runtimeInfo)(sceneId, input)
      },
      async requestRewrite(sceneId, input) {
        await requireBridgeCapability(bridge, 'requestRewrite', runtimeInfo)(sceneId, input)
      },
      async rejectProposal(sceneId, input) {
        await requireBridgeCapability(bridge, 'rejectProposal', runtimeInfo)(sceneId, input)
      },
    }
  }

  function resolveRuntime(): SceneRuntimeAdapter {
    const locale = localeResolver()
    const bridge = bridgeResolver()
    return bridge ? createBridgeRuntime(bridge, locale) : createMockRuntime(locale)
  }

  return {
    async getRuntimeInfo() {
      return resolveRuntime().info
    },
    async getSceneWorkspace(sceneId) {
      return resolveRuntime().getSceneWorkspace(sceneId)
    },
    async getSceneSetup(sceneId) {
      return resolveRuntime().getSceneSetup(sceneId)
    },
    async getSceneExecution(sceneId) {
      return resolveRuntime().getSceneExecution(sceneId)
    },
    async getSceneProse(sceneId) {
      return resolveRuntime().getSceneProse(sceneId)
    },
    async getSceneInspector(sceneId) {
      return resolveRuntime().getSceneInspector(sceneId)
    },
    async getSceneDockSummary(sceneId) {
      return resolveRuntime().getSceneDockSummary(sceneId)
    },
    async getSceneDockTab(sceneId, tab) {
      return resolveRuntime().getSceneDockTab(sceneId, tab)
    },
    async previewAcceptedPatch(sceneId) {
      return resolveRuntime().previewAcceptedPatch(sceneId)
    },
    async commitAcceptedPatch(sceneId, patchId) {
      await resolveRuntime().commitAcceptedPatch(sceneId, patchId)
    },
    async saveSceneSetup(sceneId, setup) {
      await resolveRuntime().saveSceneSetup(sceneId, setup)
    },
    async reviseSceneProse(sceneId, revisionMode) {
      await resolveRuntime().reviseSceneProse(sceneId, revisionMode)
    },
    async continueSceneRun(sceneId) {
      await resolveRuntime().continueSceneRun(sceneId)
    },
    async switchSceneThread(sceneId, threadId) {
      await resolveRuntime().switchSceneThread(sceneId, threadId)
    },
    async acceptProposal(sceneId, input: ProposalActionInput) {
      await resolveRuntime().acceptProposal(sceneId, input)
    },
    async editAcceptProposal(sceneId, input: ProposalActionInput) {
      await resolveRuntime().editAcceptProposal(sceneId, input)
    },
    async requestRewrite(sceneId, input: ProposalActionInput) {
      await resolveRuntime().requestRewrite(sceneId, input)
    },
    async rejectProposal(sceneId, input: ProposalActionInput) {
      await resolveRuntime().rejectProposal(sceneId, input)
    },
  }
}

export const sceneClient = createSceneClient()
