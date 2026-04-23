import type {
  RunEventRecord,
  RunRecord,
  RunReviewDecisionKind,
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

export interface SceneRunReviewTransitionInput {
  runId: string
  sceneId: string
  sequence: number
  priorEventCount: number
  reviewId: string
  decision: RunReviewDecisionKind
  note?: string
  patchId?: string
}

export interface SceneRunReviewTransitionOptions {
  buildTimelineLabel?: SceneRunTimelineLabelBuilder
}

export interface SceneRunReviewTransitionNextRunState {
  status: RunRecord['status']
  summary: string
  completedAtLabel?: string
  pendingReviewId?: string
}

export interface SceneRunReviewTransitionState {
  appendedEvents: RunEventRecord[]
  generatedArtifacts: SceneRunArtifactRecord[]
  nextRun: SceneRunReviewTransitionNextRunState
}
