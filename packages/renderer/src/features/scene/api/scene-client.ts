import {
  applyProposalAction,
  applyProseRevision,
  createSceneMockDatabase,
  saveSceneSetup,
  type SceneMockDatabase,
} from '@/mock/scene-fixtures'

import type {
  ProposalActionInput,
  SceneDockViewModel,
  SceneExecutionViewModel,
  SceneInspectorViewModel,
  SceneProseViewModel,
  SceneSetupViewModel,
  SceneWorkspaceViewModel,
} from '../types/scene-view-models'

function clone<T>(value: T): T {
  return structuredClone(value)
}

export interface SceneClient {
  getSceneWorkspace(sceneId: string): Promise<SceneWorkspaceViewModel>
  getSceneSetup(sceneId: string): Promise<SceneSetupViewModel>
  getSceneExecution(sceneId: string): Promise<SceneExecutionViewModel>
  getSceneProse(sceneId: string): Promise<SceneProseViewModel>
  getSceneInspector(sceneId: string): Promise<SceneInspectorViewModel>
  getSceneDock(sceneId: string): Promise<SceneDockViewModel>
  saveSceneSetup(sceneId: string, setup: SceneSetupViewModel): Promise<void>
  reviseSceneProse(sceneId: string, revisionMode: SceneProseViewModel['revisionModes'][number]): Promise<void>
  acceptProposal(sceneId: string, input: ProposalActionInput): Promise<void>
  editAcceptProposal(sceneId: string, input: ProposalActionInput): Promise<void>
  requestRewrite(sceneId: string, input: ProposalActionInput): Promise<void>
  rejectProposal(sceneId: string, input: ProposalActionInput): Promise<void>
}

export function createSceneClient(database: SceneMockDatabase = createSceneMockDatabase()): SceneClient {
  async function getScene(sceneId: string) {
    const scene = database.scenes[sceneId]
    if (!scene) {
      throw new Error(`Unknown scene "${sceneId}"`)
    }

    return scene
  }

  return {
    async getSceneWorkspace(sceneId) {
      const scene = await getScene(sceneId)
      return clone(scene.workspace)
    },
    async getSceneSetup(sceneId) {
      const scene = await getScene(sceneId)
      return clone(scene.setup)
    },
    async getSceneExecution(sceneId) {
      const scene = await getScene(sceneId)
      return clone(scene.execution)
    },
    async getSceneProse(sceneId) {
      const scene = await getScene(sceneId)
      return clone(scene.prose)
    },
    async getSceneInspector(sceneId) {
      const scene = await getScene(sceneId)
      return clone(scene.inspector)
    },
    async getSceneDock(sceneId) {
      const scene = await getScene(sceneId)
      return clone(scene.dock)
    },
    async saveSceneSetup(sceneId, setup) {
      saveSceneSetup(database, sceneId, setup)
    },
    async reviseSceneProse(sceneId, revisionMode) {
      applyProseRevision(database, sceneId, revisionMode)
    },
    async acceptProposal(sceneId, input) {
      applyProposalAction(database, sceneId, 'accept', input)
    },
    async editAcceptProposal(sceneId, input) {
      applyProposalAction(database, sceneId, 'editAccept', input)
    },
    async requestRewrite(sceneId, input) {
      applyProposalAction(database, sceneId, 'requestRewrite', input)
    },
    async rejectProposal(sceneId, input) {
      applyProposalAction(database, sceneId, 'reject', input)
    },
  }
}

export const sceneClient = createSceneClient()
