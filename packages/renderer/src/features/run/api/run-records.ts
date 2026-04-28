export type RunMode = 'continue' | 'rewrite' | 'from-scratch'
export type RunFailureClass = 'provider_error' | 'model_timeout' | 'invalid_output' | 'cancelled' | 'unknown'

export interface StartSceneRunInput {
  sceneId: string
  mode?: RunMode
  note?: string
}

export interface RetryRunInput {
  runId: string
  mode?: RunMode
}

export interface CancelRunInput {
  runId: string
  reason?: string
}

export interface ResumeRunInput {
  runId: string
}

export type RunScope = 'scene' | 'chapter' | 'book'

export type RunStatus = 'queued' | 'running' | 'waiting_review' | 'completed' | 'failed' | 'cancelled'

export interface RunRecord {
  id: string
  scope: RunScope
  scopeId: string
  status: RunStatus
  title: string
  summary: string
  startedAtLabel?: string
  completedAtLabel?: string
  pendingReviewId?: string
  latestEventId?: string
  failureClass?: RunFailureClass
  failureMessage?: string
  retryOfRunId?: string
  resumableFromEventId?: string
  cancelRequestedAtLabel?: string
  usage?: RunUsageRecord
  runtimeSummary?: RunRuntimeSummaryRecord
  eventCount: number
}

export interface RunUsageRecord {
  inputTokens: number
  outputTokens: number
  estimatedCostUsd: number
  actualCostUsd?: number
  provider: string
  modelId: string
}

export interface RunRuntimeSummaryRecord {
  health: 'stable' | 'attention' | 'failed' | 'cancelled'
  costLabel: string
  tokenLabel: string
  failureClassLabel: string
  nextActionLabel: string
}

export type RunEventKind =
  | 'run_created'
  | 'run_started'
  | 'context_packet_built'
  | 'agent_invocation_started'
  | 'agent_invocation_completed'
  | 'proposal_created'
  | 'review_requested'
  | 'review_decision_submitted'
  | 'canon_patch_applied'
  | 'prose_generated'
  | 'run_completed'
  | 'run_failed'
  | 'run_retry_scheduled'
  | 'run_cancel_requested'
  | 'run_cancelled'
  | 'run_resumed'

export type RunEventRefKind =
  | 'context-packet'
  | 'agent-invocation'
  | 'proposal-set'
  | 'review'
  | 'canon-patch'
  | 'prose-draft'
  | 'artifact'

export interface RunEventRefRecord {
  kind: RunEventRefKind
  id: string
  label?: string
}

export interface RunEventRecord {
  id: string
  runId: string
  order: number
  kind: RunEventKind
  label: string
  summary: string
  createdAtLabel: string
  severity?: 'info' | 'warning' | 'error'
  refs?: RunEventRefRecord[]
  usage?: RunUsageRecord
  metadata?: Record<string, string | number | boolean | null>
}

export interface RunEventsPageRecord {
  runId: string
  events: RunEventRecord[]
  nextCursor?: string
}

export type RunReviewDecisionKind = 'accept' | 'accept-with-edit' | 'request-rewrite' | 'reject'

export interface RunSelectedProposalVariantRecord {
  proposalId: string
  variantId: string
}

export interface SubmitRunReviewDecisionInput {
  runId: string
  reviewId: string
  decision: RunReviewDecisionKind
  note?: string
  patchId?: string
  selectedVariants?: RunSelectedProposalVariantRecord[]
}
