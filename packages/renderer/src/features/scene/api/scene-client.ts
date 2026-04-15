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

export type SceneRuntimeSource = 'preload-bridge' | 'mock-fallback'

export interface SceneRuntimeInfo {
  source: SceneRuntimeSource
  label: string
  capabilities: Record<string, boolean>
}

export interface SceneRuntimeBridge {
  getSceneWorkspace?: (sceneId: string, locale?: Locale) => Promise<SceneWorkspaceViewModel>
  getSceneSetup?: (sceneId: string, locale?: Locale) => Promise<SceneSetupViewModel>
  getSceneExecution?: (sceneId: string, locale?: Locale) => Promise<SceneExecutionViewModel>
  getSceneProse?: (sceneId: string, locale?: Locale) => Promise<SceneProseViewModel>
  getSceneInspector?: (sceneId: string, locale?: Locale) => Promise<SceneInspectorViewModel>
  getSceneDockSummary?: (sceneId: string, locale?: Locale) => Promise<SceneDockViewModel>
  getSceneDockTab?: (sceneId: string, tab: SceneDockTabId, locale?: Locale) => Promise<Partial<SceneDockViewModel>>
  previewAcceptedPatch?: (sceneId: string, locale?: Locale) => Promise<ScenePatchPreviewViewModel | null>
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
  databaseFactory?: (locale: Locale) => SceneMockDatabase
  bridgeResolver?: () => SceneRuntimeBridge | undefined
  localeResolver?: () => Locale
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

function buildRuntimeInfo(bridge: SceneRuntimeBridge | undefined, locale: Locale): SceneRuntimeInfo {
  return {
    source: bridge ? 'preload-bridge' : 'mock-fallback',
    label: bridge ? (locale === 'zh-CN' ? '预加载桥接' : 'Preload Bridge') : locale === 'zh-CN' ? '预览数据' : 'Preview Data',
    capabilities: Object.fromEntries(
      runtimeCapabilityList.map((capability) => [capability, Boolean(bridge?.[capability])]),
    ),
  }
}

export function createSceneClient({
  database,
  databaseFactory = (locale) => createSceneMockDatabase(locale),
  bridgeResolver = resolveWindowSceneBridge,
  localeResolver = resolveAppLocale,
}: CreateSceneClientOptions = {}): SceneClient {
  const localeDatabases = new Map<Locale, SceneMockDatabase>()

  function getDatabase() {
    if (database) {
      return database
    }

    const locale = localeResolver()
    const existingDatabase = localeDatabases.get(locale)
    if (existingDatabase) {
      return existingDatabase
    }

    const nextDatabase = databaseFactory(locale)
    localeDatabases.set(locale, nextDatabase)
    return nextDatabase
  }

  async function getScene(sceneId: string) {
    const activeDatabase = getDatabase()
    const scene = activeDatabase.scenes[sceneId]
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
      return buildRuntimeInfo(bridgeResolver(), localeResolver())
    },
    async getSceneWorkspace(sceneId) {
      const locale = localeResolver()
      const bridge = bridgeResolver()
      if (bridge?.getSceneWorkspace) {
        return bridge.getSceneWorkspace(sceneId, locale)
      }

      const scene = await getScene(sceneId)
      return clone(scene.workspace)
    },
    async getSceneSetup(sceneId) {
      const locale = localeResolver()
      const bridge = bridgeResolver()
      if (bridge?.getSceneSetup) {
        return bridge.getSceneSetup(sceneId, locale)
      }

      const scene = await getScene(sceneId)
      return clone(scene.setup)
    },
    async getSceneExecution(sceneId) {
      const locale = localeResolver()
      const bridge = bridgeResolver()
      if (bridge?.getSceneExecution) {
        return bridge.getSceneExecution(sceneId, locale)
      }

      const scene = await getScene(sceneId)
      return clone(scene.execution)
    },
    async getSceneProse(sceneId) {
      const locale = localeResolver()
      const bridge = bridgeResolver()
      if (bridge?.getSceneProse) {
        return bridge.getSceneProse(sceneId, locale)
      }

      const scene = await getScene(sceneId)
      return clone(scene.prose)
    },
    async getSceneInspector(sceneId) {
      const locale = localeResolver()
      const bridge = bridgeResolver()
      if (bridge?.getSceneInspector) {
        return bridge.getSceneInspector(sceneId, locale)
      }

      const scene = await getScene(sceneId)
      return clone(scene.inspector)
    },
    async getSceneDockSummary(sceneId) {
      const locale = localeResolver()
      const bridge = bridgeResolver()
      if (bridge?.getSceneDockSummary) {
        return bridge.getSceneDockSummary(sceneId, locale)
      }

      return getSceneDockSummary(getDatabase(), sceneId)
    },
    async getSceneDockTab(sceneId, tab) {
      const locale = localeResolver()
      const bridge = bridgeResolver()
      if (bridge?.getSceneDockTab) {
        return bridge.getSceneDockTab(sceneId, tab, locale)
      }

      return getSceneDockTab(getDatabase(), sceneId, tab)
    },
    async previewAcceptedPatch(sceneId) {
      const locale = localeResolver()
      const bridge = bridgeResolver()
      if (bridge?.previewAcceptedPatch) {
        return bridge.previewAcceptedPatch(sceneId, locale)
      }

      return previewAcceptedPatch(getDatabase(), sceneId)
    },
    async commitAcceptedPatch(sceneId, patchId) {
      const activeDatabase = getDatabase()
      const bridge = bridgeResolver()
      if (bridge?.commitAcceptedPatch) {
        await bridge.commitAcceptedPatch(sceneId, patchId)
        const localPreview = previewAcceptedPatch(activeDatabase, sceneId)
        if (localPreview?.patchId === patchId) {
          commitAcceptedPatch(activeDatabase, sceneId, patchId)
        }
        return
      }

      commitAcceptedPatch(activeDatabase, sceneId, patchId)
    },
    async saveSceneSetup(sceneId, setup) {
      const activeDatabase = getDatabase()
      const bridge = bridgeResolver()
      await runWriteThrough(
        bridge?.saveSceneSetup ? () => bridge.saveSceneSetup!(sceneId, setup) : undefined,
        () => saveSceneSetup(activeDatabase, sceneId, setup),
      )
    },
    async reviseSceneProse(sceneId, revisionMode) {
      const activeDatabase = getDatabase()
      const bridge = bridgeResolver()
      await runWriteThrough(
        bridge?.reviseSceneProse ? () => bridge.reviseSceneProse!(sceneId, revisionMode) : undefined,
        () => applyProseRevision(activeDatabase, sceneId, revisionMode),
      )
    },
    async continueSceneRun(sceneId) {
      const activeDatabase = getDatabase()
      const bridge = bridgeResolver()
      await runWriteThrough(
        bridge?.continueSceneRun ? () => bridge.continueSceneRun!(sceneId) : undefined,
        () => continueSceneRun(activeDatabase, sceneId),
      )
    },
    async switchSceneThread(sceneId, threadId) {
      const activeDatabase = getDatabase()
      const bridge = bridgeResolver()
      await runWriteThrough(
        bridge?.switchSceneThread ? () => bridge.switchSceneThread!(sceneId, threadId) : undefined,
        () => switchSceneThread(activeDatabase, sceneId, threadId),
      )
    },
    async acceptProposal(sceneId, input) {
      const activeDatabase = getDatabase()
      const bridge = bridgeResolver()
      await runWriteThrough(
        bridge?.acceptProposal ? () => bridge.acceptProposal!(sceneId, input) : undefined,
        () => applyProposalAction(activeDatabase, sceneId, 'accept', input),
      )
    },
    async editAcceptProposal(sceneId, input) {
      const activeDatabase = getDatabase()
      const bridge = bridgeResolver()
      await runWriteThrough(
        bridge?.editAcceptProposal ? () => bridge.editAcceptProposal!(sceneId, input) : undefined,
        () => applyProposalAction(activeDatabase, sceneId, 'editAccept', input),
      )
    },
    async requestRewrite(sceneId, input) {
      const activeDatabase = getDatabase()
      const bridge = bridgeResolver()
      await runWriteThrough(
        bridge?.requestRewrite ? () => bridge.requestRewrite!(sceneId, input) : undefined,
        () => applyProposalAction(activeDatabase, sceneId, 'requestRewrite', input),
      )
    },
    async rejectProposal(sceneId, input) {
      const activeDatabase = getDatabase()
      const bridge = bridgeResolver()
      await runWriteThrough(
        bridge?.rejectProposal ? () => bridge.rejectProposal!(sceneId, input) : undefined,
        () => applyProposalAction(activeDatabase, sceneId, 'reject', input),
      )
    },
  }
}

export const sceneClient = createSceneClient()
