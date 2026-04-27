import { resolveAppLocale, type Locale } from '@/app/i18n'
import { ApiRequestError } from '@/app/project-runtime/api-transport'
import {
  applyProposalAction,
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
  SceneProseRevisionRequestInput,
  SceneProseViewModel,
  SceneSetupViewModel,
  SceneWorkspaceViewModel,
} from '../types/scene-view-models'
import {
  MAX_SCENE_PROSE_REVISION_INSTRUCTION_LENGTH,
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

function normalizeRevisionInput(
  input: SceneProseRevisionRequestInput | SceneProseViewModel['revisionModes'][number],
  instruction?: string,
): SceneProseRevisionRequestInput {
  const normalizedInstruction =
    typeof input === 'string'
      ? instruction?.trim()
      : input.instruction?.trim()

  if (normalizedInstruction && normalizedInstruction.length > MAX_SCENE_PROSE_REVISION_INSTRUCTION_LENGTH) {
    throw new ApiRequestError({
      status: 400,
      message: `instruction must be at most ${MAX_SCENE_PROSE_REVISION_INSTRUCTION_LENGTH} characters.`,
      code: 'INVALID_REVISION_INSTRUCTION',
      detail: {
        body:
          typeof input === 'string'
            ? { revisionMode: input, instruction }
            : { revisionMode: input.revisionMode, instruction: input.instruction },
        maxLength: MAX_SCENE_PROSE_REVISION_INSTRUCTION_LENGTH,
      },
    })
  }

  if (typeof input === 'string') {
    return {
      revisionMode: input,
      ...(normalizedInstruction ? { instruction: normalizedInstruction } : {}),
    }
  }

  return {
    revisionMode: input.revisionMode,
    ...(normalizedInstruction ? { instruction: normalizedInstruction } : {}),
  }
}

function countDraftWords(locale: Locale, proseDraft: string) {
  const trimmed = proseDraft.trim()
  if (trimmed.length === 0) {
    return 0
  }

  if (locale === 'zh-CN') {
    return trimmed.replace(/\s+/g, '').length
  }

  return trimmed.split(/\s+/).filter(Boolean).length
}

function buildMockRevisionDiffSummary(revisionMode: SceneProseViewModel['revisionModes'][number]) {
  switch (revisionMode) {
    case 'compress':
      return 'Compressed repeated witness beats while preserving accepted provenance.'
    case 'expand':
      return 'Expanded witness-facing beats while preserving accepted provenance.'
    case 'tone_adjust':
      return 'Adjusted bargaining tone while preserving accepted provenance.'
    case 'continuity_fix':
      return 'Reconciled continuity edges while preserving accepted provenance.'
    case 'rewrite':
    default:
      return 'Rebuilt witness-facing beats while preserving accepted provenance.'
  }
}

function buildMockRevisionBody(input: {
  sceneId: string
  proseDraft: string
  revisionMode: SceneProseViewModel['revisionModes'][number]
  instruction?: string
  sourceProseDraftId: string
  sourceCanonPatchId: string
}) {
  const sceneLabel = input.sceneId.replace(/^scene-/, '').replace(/-/g, ' ')
  const revisionLabel =
    input.revisionMode === 'tone_adjust'
      ? 'tone-adjust'
      : input.revisionMode === 'continuity_fix'
        ? 'continuity-fix'
        : input.revisionMode
  const instructionLine = input.instruction?.trim() ? ` Editorial instruction: ${input.instruction.trim()}.` : ''

  return `${sceneLabel} now runs a ${revisionLabel} revision pass against the accepted draft. ${input.proseDraft}${instructionLine} The candidate keeps provenance anchored to ${input.sourceProseDraftId} and ${input.sourceCanonPatchId} while remaining reviewable in the main stage.`
}

function applyMockSceneProseRevision(
  prose: SceneProseViewModel,
  sceneId: string,
  locale: Locale,
  input: SceneProseRevisionRequestInput,
) {
  const proseDraft = prose.proseDraft?.trim()
  if (!proseDraft) {
    throw new Error(`Scene ${sceneId} requires a prose draft before revision can be requested.`)
  }

  const sourceProseDraftId = prose.traceSummary?.sourceProseDraftId?.trim() || `prose-draft-${sceneId}-current`
  const sourceCanonPatchId = prose.traceSummary?.sourcePatchId?.trim() || `canon-patch-${sceneId}-current`
  const contextPacketId = prose.traceSummary?.contextPacketId?.trim() || `ctx-${sceneId}-current`
  const diffSummary = buildMockRevisionDiffSummary(input.revisionMode)

  return {
    ...prose,
    latestDiffSummary: diffSummary,
    revisionQueueCount: 1,
    statusLabel: 'Revision candidate ready',
    warningsCount: input.revisionMode === 'continuity_fix' ? 0 : prose.warningsCount,
    revisionCandidate: {
      revisionId: `revision-${sceneId}-${globalThis.crypto.randomUUID()}`,
      revisionMode: input.revisionMode,
      ...(input.instruction ? { instruction: input.instruction } : {}),
      proseBody: buildMockRevisionBody({
        sceneId,
        proseDraft,
        revisionMode: input.revisionMode,
        instruction: input.instruction,
        sourceProseDraftId,
        sourceCanonPatchId,
      }),
      diffSummary,
      sourceProseDraftId,
      sourceCanonPatchId,
      contextPacketId,
      fallbackProvenance: {
        provider: 'fixture',
        modelId: locale === 'zh-CN' ? 'fixture-scene-prose-writer-zh' : 'fixture-scene-prose-writer',
      },
    },
  } satisfies SceneProseViewModel
}

function acceptMockSceneProseRevision(
  prose: SceneProseViewModel,
  locale: Locale,
  revisionId: string,
) {
  const candidate = prose.revisionCandidate
  if (!candidate || candidate.revisionId !== revisionId) {
    throw new ApiRequestError({
      status: 409,
      message: `Scene ${prose.sceneId} does not have revision candidate ${revisionId}.`,
      code: 'SCENE_PROSE_REVISION_NOT_FOUND',
      detail: {
        sceneId: prose.sceneId,
        revisionId,
      },
    })
  }

  return {
    ...prose,
    proseDraft: candidate.proseBody,
    draftWordCount: countDraftWords(locale, candidate.proseBody),
    latestDiffSummary: candidate.diffSummary,
    revisionQueueCount: 0,
    statusLabel: 'Updated',
    revisionCandidate: undefined,
    traceSummary: {
      ...prose.traceSummary,
      sourcePatchId: candidate.sourceCanonPatchId,
      sourceProseDraftId: `accepted-prose-revision-${candidate.revisionId}`,
      contextPacketId: candidate.contextPacketId,
    },
  } satisfies SceneProseViewModel
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
      async reviseSceneProse(sceneId, input, instruction) {
        const scene = getScene(activeDatabase, sceneId)
        scene.prose = applyMockSceneProseRevision(scene.prose, sceneId, locale, normalizeRevisionInput(input, instruction))
      },
      async acceptSceneProseRevision(sceneId, revisionId) {
        const scene = getScene(activeDatabase, sceneId)
        scene.prose = acceptMockSceneProseRevision(scene.prose, locale, revisionId)
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
      async reviseSceneProse(sceneId, input, instruction) {
        await requireBridgeCapability(bridge, 'reviseSceneProse', runtimeInfo)(
          sceneId,
          normalizeRevisionInput(input, instruction),
        )
      },
      async acceptSceneProseRevision(sceneId, revisionId) {
        await requireBridgeCapability(bridge, 'acceptSceneProseRevision', runtimeInfo)(sceneId, revisionId)
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
    async reviseSceneProse(sceneId, input, instruction) {
      await resolveRuntime().reviseSceneProse(sceneId, input, instruction)
    },
    async acceptSceneProseRevision(sceneId, revisionId) {
      await resolveRuntime().acceptSceneProseRevision(sceneId, revisionId)
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
