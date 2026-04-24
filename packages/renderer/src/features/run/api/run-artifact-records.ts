import type { RunReviewDecisionKind } from './run-records'

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
}

export type SceneRunAgentRole = 'scene-planner' | 'scene-writer'
export type RunArtifactAssetKind = 'character' | 'location' | 'rule'
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

export interface ProposalSetArtifactProposalRecord {
  id: string
  title: LocalizedTextRecord
  summary: LocalizedTextRecord
  changeKind: ProposalChangeKind
  riskLabel: LocalizedTextRecord
  relatedAssets: RunArtifactRelatedAssetRecord[]
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
  relatedAssets: RunArtifactRelatedAssetRecord[]
}

export interface ContextPacketArtifactDetailRecord extends RunArtifactSummaryRecord {
  kind: 'context-packet'
  sceneId: string
  sections: RunArtifactSectionRecord[]
  includedCanonFacts: RunArtifactCanonFactRecord[]
  includedAssets: RunArtifactIncludedAssetRecord[]
  excludedPrivateFacts: RunArtifactExcludedFactRecord[]
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
}

export interface ProposalSetArtifactDetailRecord extends RunArtifactSummaryRecord {
  kind: 'proposal-set'
  reviewId: string
  sourceInvocationIds: string[]
  proposals: ProposalSetArtifactProposalRecord[]
  reviewOptions: ProposalSetReviewOptionRecord[]
}

export interface CanonPatchArtifactDetailRecord extends RunArtifactSummaryRecord {
  kind: 'canon-patch'
  decision: Extract<RunReviewDecisionKind, 'accept' | 'accept-with-edit'>
  sourceProposalSetId: string
  acceptedProposalIds: string[]
  acceptedFacts: CanonPatchAcceptedFactRecord[]
  traceLinkIds: string[]
}

export interface ProseDraftArtifactDetailRecord extends RunArtifactSummaryRecord {
  kind: 'prose-draft'
  sourceCanonPatchId: string
  sourceProposalIds: string[]
  excerpt: LocalizedTextRecord
  wordCount: number
  relatedAssets: RunArtifactRelatedAssetRecord[]
  traceLinkIds: string[]
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
