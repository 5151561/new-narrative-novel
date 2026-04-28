import type {
  AssetContextActivationReasonKindRecord,
  AssetContextBudgetRecord,
  CanonicalAssetKind,
  AssetContextTargetAgentRecord,
  AssetContextVisibilityRecord,
} from '@/features/asset/api/asset-records'
import type {
  RunEventRefRecord,
  RunReviewDecisionKind,
  RunSelectedProposalVariantRecord,
  RunUsageRecord,
} from './run-records'

export interface LocalizedTextRecord {
  en: string
  'zh-CN': string
}

export type RunArtifactKind =
  | 'context-packet'
  | 'agent-invocation'
  | 'proposal-set'
  | 'canon-patch'
  | 'prose-draft'

export interface RunArtifactSummaryRecord {
  id: string
  runId: string
  kind: RunArtifactKind
  title: LocalizedTextRecord
  summary: LocalizedTextRecord
  statusLabel: LocalizedTextRecord
  createdAtLabel: LocalizedTextRecord
  sourceEventIds: string[]
  usage?: RunUsageRecord
}

export interface RunFailureDetailRecord {
  failureClass: 'provider_error' | 'model_timeout' | 'invalid_output' | 'cancelled' | 'unknown'
  message: string
  provider?: string
  modelId?: string
  retryable: boolean
  sourceEventIds: string[]
}

export type SceneRunAgentRole = 'scene-planner' | 'scene-writer'
export type RunArtifactAssetKind = CanonicalAssetKind
export type ProposalChangeKind = 'action' | 'reveal' | 'state-change' | 'continuity-note'

export interface RunArtifactSectionRecord {
  id: string
  title: LocalizedTextRecord
  summary: LocalizedTextRecord
  itemCount: number
}

export interface RunArtifactCanonFactRecord {
  id: string
  label: LocalizedTextRecord
  value: LocalizedTextRecord
}

export interface RunArtifactRelatedAssetRecord {
  assetId: string
  kind: RunArtifactAssetKind
  label: LocalizedTextRecord
}

export interface RunArtifactIncludedAssetRecord extends RunArtifactRelatedAssetRecord {
  reason: LocalizedTextRecord
}

export interface RunArtifactExcludedFactRecord {
  id: string
  label: LocalizedTextRecord
  reason: LocalizedTextRecord
}

export interface RunArtifactGeneratedRefRecord {
  kind: 'proposal-set' | 'artifact'
  id: string
  label: LocalizedTextRecord
}

export interface ProposalVariantRecord {
  id: string
  label: LocalizedTextRecord
  summary: LocalizedTextRecord
  rationale: LocalizedTextRecord
  tradeoffLabel?: LocalizedTextRecord
  riskLabel?: LocalizedTextRecord
  relatedAssets?: RunArtifactRelatedAssetRecord[]
}

export interface ProposalSetArtifactProposalRecord {
  id: string
  title: LocalizedTextRecord
  summary: LocalizedTextRecord
  changeKind: ProposalChangeKind
  riskLabel: LocalizedTextRecord
  relatedAssets: RunArtifactRelatedAssetRecord[]
  variants?: ProposalVariantRecord[]
  defaultVariantId?: string
  selectedVariantId?: string
}

export interface ProposalSetReviewOptionRecord {
  decision: RunReviewDecisionKind
  label: LocalizedTextRecord
  description: LocalizedTextRecord
}

export interface CanonPatchAcceptedFactRecord {
  id: string
  label: LocalizedTextRecord
  value: LocalizedTextRecord
  sourceProposalIds: string[]
  selectedVariants?: RunSelectedProposalVariantRecord[]
  relatedAssets: RunArtifactRelatedAssetRecord[]
}

export type RunContextAssetActivationDecisionRecord = 'included' | 'excluded' | 'redacted'

export interface RunContextAssetActivationRecord {
  id: string
  assetId: string
  assetTitle: LocalizedTextRecord
  assetKind: RunArtifactAssetKind
  decision: RunContextAssetActivationDecisionRecord
  reasonKind: AssetContextActivationReasonKindRecord
  reasonLabel: LocalizedTextRecord
  visibility: AssetContextVisibilityRecord
  budget: AssetContextBudgetRecord
  targetAgents: AssetContextTargetAgentRecord[]
  sourceRefs?: RunEventRefRecord[]
  policyRuleIds?: string[]
  note?: LocalizedTextRecord
}

export interface RunContextActivationSummaryRecord {
  includedAssetCount: number
  excludedAssetCount: number
  redactedAssetCount: number
  targetAgentCount: number
  warningCount: number
}

export interface ContextPacketArtifactDetailRecord extends RunArtifactSummaryRecord {
  kind: 'context-packet'
  sceneId: string
  sections: RunArtifactSectionRecord[]
  includedCanonFacts: RunArtifactCanonFactRecord[]
  includedAssets: RunArtifactIncludedAssetRecord[]
  excludedPrivateFacts: RunArtifactExcludedFactRecord[]
  assetActivations?: RunContextAssetActivationRecord[]
  activationSummary?: RunContextActivationSummaryRecord
  outputSchemaLabel: LocalizedTextRecord
  tokenBudgetLabel: LocalizedTextRecord
}

export interface AgentInvocationArtifactDetailRecord extends RunArtifactSummaryRecord {
  kind: 'agent-invocation'
  agentRole: SceneRunAgentRole
  modelLabel: LocalizedTextRecord
  inputSummary: LocalizedTextRecord
  outputSummary: LocalizedTextRecord
  contextPacketId?: string
  outputSchemaLabel: LocalizedTextRecord
  generatedRefs: RunArtifactGeneratedRefRecord[]
  failureDetail?: RunFailureDetailRecord
}

export interface ProposalSetArtifactDetailRecord extends RunArtifactSummaryRecord {
  kind: 'proposal-set'
  reviewId: string
  sourceInvocationIds: string[]
  proposals: ProposalSetArtifactProposalRecord[]
  reviewOptions: ProposalSetReviewOptionRecord[]
  failureDetail?: RunFailureDetailRecord
}

export interface CanonPatchArtifactDetailRecord extends RunArtifactSummaryRecord {
  kind: 'canon-patch'
  decision: Extract<RunReviewDecisionKind, 'accept' | 'accept-with-edit'>
  sourceProposalSetId: string
  acceptedProposalIds: string[]
  selectedVariants?: RunSelectedProposalVariantRecord[]
  acceptedFacts: CanonPatchAcceptedFactRecord[]
  traceLinkIds: string[]
}

export interface ProseDraftArtifactDetailRecord extends RunArtifactSummaryRecord {
  kind: 'prose-draft'
  sourceCanonPatchId: string
  contextPacketId: string
  sourceProposalIds: string[]
  selectedVariants?: RunSelectedProposalVariantRecord[]
  body?: LocalizedTextRecord
  excerpt: LocalizedTextRecord
  wordCount: number
  relatedAssets: RunArtifactRelatedAssetRecord[]
  traceLinkIds: string[]
  failureDetail?: RunFailureDetailRecord
}

export type RunArtifactDetailRecord =
  | ContextPacketArtifactDetailRecord
  | AgentInvocationArtifactDetailRecord
  | ProposalSetArtifactDetailRecord
  | CanonPatchArtifactDetailRecord
  | ProseDraftArtifactDetailRecord

export interface RunArtifactListResponse {
  runId: string
  artifacts: RunArtifactSummaryRecord[]
}

export interface RunArtifactDetailResponse {
  artifact: RunArtifactDetailRecord
}
