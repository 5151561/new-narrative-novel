import type {
  RunEventRecord,
  RunRecord,
  StartSceneRunInput,
} from '../../contracts/api-records.js'

export type SceneRunArtifactKind =
  | 'context-packet'
  | 'agent-invocation'
  | 'proposal-set'
  | 'canon-patch'
  | 'prose-draft'

export type SceneRunArtifactMetaValue = string | number | boolean | null | undefined

export interface SceneRunArtifactRecord {
  kind: SceneRunArtifactKind
  id: string
  runId: string
  sceneId: string
  title: string
  summary: string
  status?: string
  meta?: Record<string, SceneRunArtifactMetaValue>
}

export interface SceneRunWorkflowStartInput extends StartSceneRunInput {
  sequence: number
}

export type SceneRunTimelineLabelBuilder = (order: number) => string

export interface SceneRunWorkflowStartOptions {
  buildTimelineLabel?: SceneRunTimelineLabelBuilder
}

export interface SceneRunWorkflowState {
  run: RunRecord
  events: RunEventRecord[]
  artifacts: SceneRunArtifactRecord[]
}
