import type {
  RunFailureClass,
  RunArtifactGeneratedRefRecord,
  RunEventRecord,
  RunRecord,
  RunReviewDecisionKind,
  RunSelectedProposalVariantRecord,
  StartSceneRunInput,
} from '../../contracts/api-records.js'
import type { ScenePlannerGatewayProvenance } from '../modelGateway/scenePlannerGateway.js'
import type { ScenePlannerOutput } from '../modelGateway/scenePlannerOutputSchema.js'
import type { SceneProseWriterGatewayProvenance } from '../modelGateway/sceneProseWriterGateway.js'
import type { SceneProseWriterOutput } from '../modelGateway/sceneProseWriterOutputSchema.js'
import type { SceneContextPacketRecord } from '../contextBuilder/sceneContextBuilder.js'

export type SceneRunArtifactKind =
  | 'context-packet'
  | 'agent-invocation'
  | 'proposal-set'
  | 'canon-patch'
  | 'prose-draft'

export type SceneRunArtifactMetaValue =
  | string
  | number
  | boolean
  | null
  | RunArtifactGeneratedRefRecord
  | SceneProseWriterOutput
  | SceneContextPacketRecord
  | SceneRunArtifactMetaValue[]
  | SceneRunArtifactMetaRecord

export interface SceneRunArtifactMetaRecord {
  [key: string]: SceneRunArtifactMetaValue | undefined
}

export interface SceneRunCanonicalPlannerVariantRecord extends SceneRunArtifactMetaRecord {
  id: string
  label: string
  summary: string
  rationale: string
  tradeoffLabel?: string
  riskLabel?: string
}

export interface SceneRunCanonicalPlannerProposalRecord extends SceneRunArtifactMetaRecord {
  id: string
  title: string
  summary: string
  changeKind: ScenePlannerOutput['proposals'][number]['changeKind']
  riskLabel: string
  variants?: SceneRunCanonicalPlannerVariantRecord[]
}

export interface SceneRunArtifactRecord {
  kind: SceneRunArtifactKind
  id: string
  runId: string
  sceneId: string
  title: string
  summary: string
  status?: string
  meta?: SceneRunArtifactMetaRecord
}

export interface SceneRunWorkflowStartInput extends StartSceneRunInput {
  sequence: number
  plannerOutput: ScenePlannerOutput
  plannerProvenance: ScenePlannerGatewayProvenance
  contextPacket?: SceneContextPacketRecord
  retryOfRunId?: string
  resumableFromEventId?: string
  resumeSourceRunId?: string
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
  selectedVariants?: RunSelectedProposalVariantRecord[]
  proseGeneration?: {
    output: SceneProseWriterOutput
    provenance: SceneProseWriterGatewayProvenance
  }
}

export interface SceneRunReviewTransitionOptions {
  buildTimelineLabel?: SceneRunTimelineLabelBuilder
}

export interface SceneRunReviewTransitionNextRunState {
  status: RunRecord['status']
  summary: string
  completedAtLabel?: string
  pendingReviewId?: string
  cancelRequestedAtLabel?: string
  failureClass?: RunFailureClass
  failureMessage?: string
  resumableFromEventId?: string
}

export interface SceneRunReviewTransitionState {
  appendedEvents: RunEventRecord[]
  generatedArtifacts: SceneRunArtifactRecord[]
  nextRun: SceneRunReviewTransitionNextRunState
}

export interface SceneRunRetryTransitionInput {
  runId: string
  priorEventCount: number
  nextRunId: string
  mode: StartSceneRunInput['mode']
}

export interface SceneRunCancelTransitionInput {
  runId: string
  priorEventCount: number
  reason?: string
}
