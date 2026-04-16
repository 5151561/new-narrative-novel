import type { Locale } from '@/app/i18n'

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

export const sceneRuntimeCapabilities = [
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

export type SceneRuntimeCapability = (typeof sceneRuntimeCapabilities)[number]

export interface SceneRuntimeInfo {
  source: SceneRuntimeSource
  label: string
  capabilities: Record<SceneRuntimeCapability, boolean>
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

export class SceneRuntimeCapabilityError extends Error {
  capability: SceneRuntimeCapability
  source: SceneRuntimeSource

  constructor(capability: SceneRuntimeCapability, runtimeInfo: Pick<SceneRuntimeInfo, 'source'>) {
    super(`Scene runtime capability "${capability}" is unavailable for ${runtimeInfo.source}.`)
    this.name = 'SceneRuntimeCapabilityError'
    this.capability = capability
    this.source = runtimeInfo.source
  }
}
