export interface ApiErrorResponse {
  status: number
  message: string
  code?: string
  detail?: unknown
}

export type ProjectRuntimeKind = 'fixture-demo' | 'mock-storybook' | 'real-local-project'
export type ProjectRuntimeSource = 'mock' | 'api'

export type ProjectRuntimeHealthStatus =
  | 'healthy'
  | 'checking'
  | 'unavailable'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'unknown'

export interface ProjectRuntimeCapabilitiesRecord {
  read: boolean
  write: boolean
  runEvents: boolean
  runEventPolling: boolean
  runEventStream: boolean
  reviewDecisions: boolean
  contextPacketRefs: boolean
  proposalSetRefs: boolean
}

export interface ProjectRuntimeInfoRecord {
  projectId: string
  projectTitle: string
  runtimeKind: ProjectRuntimeKind
  source: ProjectRuntimeSource
  status: ProjectRuntimeHealthStatus
  summary: string
  checkedAtLabel?: string
  apiBaseUrl?: string
  versionLabel?: string
  capabilities: ProjectRuntimeCapabilitiesRecord
}

export interface LocalizedTextRecord {
  en: string
  'zh-CN': string
}

export type BookStructureView = 'sequence' | 'outliner' | 'signals'
export type ChapterStructureView = 'sequence' | 'outliner' | 'assembly' | 'backlog'
export type AssetKnowledgeView = 'profile' | 'mentions' | 'relations' | 'context'
export type ChapterLens = 'structure' | 'draft'
export type SceneLens = 'structure' | 'orchestrate' | 'draft'

export interface BookStructureRecord {
  bookId: string
  title: LocalizedTextRecord
  summary: LocalizedTextRecord
  chapterIds: string[]
  viewsMeta?: {
    availableViews: BookStructureView[]
  }
}

export interface BookManuscriptCheckpointSceneRecord {
  sceneId: string
  order: number
  title: LocalizedTextRecord
  summary: LocalizedTextRecord
  proseDraft?: string
  draftWordCount?: number
  warningsCount: number
  traceReady: boolean
}

export interface BookManuscriptCheckpointChapterRecord {
  chapterId: string
  order: number
  title: LocalizedTextRecord
  summary: LocalizedTextRecord
  scenes: BookManuscriptCheckpointSceneRecord[]
}

export interface BookManuscriptCheckpointRecord {
  checkpointId: string
  bookId: string
  title: LocalizedTextRecord
  createdAtLabel: LocalizedTextRecord
  summary: LocalizedTextRecord
  chapters: BookManuscriptCheckpointChapterRecord[]
}

export interface BookDraftAssemblyTraceRollupRecord {
  acceptedFactCount: number
  relatedAssetCount: number
  sourceProposalCount: number
  missingLinks: string[]
}

export interface BookDraftAssemblySceneRecordBase {
  sceneId: string
  order: number
  title: LocalizedTextRecord
  summary: LocalizedTextRecord
  proseStatusLabel: LocalizedTextRecord
  latestDiffSummary?: string
  warningsCount: number
  revisionQueueCount?: number
  draftWordCount?: number
  traceReady: boolean
  traceRollup: BookDraftAssemblyTraceRollupRecord
}

export interface BookDraftAssemblySceneDraftRecord extends BookDraftAssemblySceneRecordBase {
  kind: 'draft'
  proseDraft: string
  sourcePatchId?: string
  sourceProposals: SceneTraceProposalRefModel[]
  acceptedFactIds: string[]
  relatedAssets: SceneTraceAssetRefModel[]
}

export interface BookDraftAssemblySceneGapRecord extends BookDraftAssemblySceneRecordBase {
  kind: 'gap'
  gapReason: LocalizedTextRecord
}

export type BookDraftAssemblySceneRecord =
  | BookDraftAssemblySceneDraftRecord
  | BookDraftAssemblySceneGapRecord

export interface BookDraftAssemblyChapterRecord {
  chapterId: string
  order: number
  title: LocalizedTextRecord
  summary: LocalizedTextRecord
  sceneCount: number
  draftedSceneCount: number
  missingDraftCount: number
  assembledWordCount: number
  warningsCount: number
  queuedRevisionCount: number
  tracedSceneCount: number
  missingTraceSceneCount: number
  scenes: BookDraftAssemblySceneRecord[]
}

export interface BookDraftAssemblyRecord {
  bookId: string
  title: LocalizedTextRecord
  summary: LocalizedTextRecord
  chapterCount: number
  sceneCount: number
  draftedSceneCount: number
  missingDraftSceneCount: number
  assembledWordCount: number
  chapters: BookDraftAssemblyChapterRecord[]
}

export type BookExportProfileKind = 'review_packet' | 'submission_preview' | 'archive_snapshot'

export interface BookExportProfileIncludesRecord {
  manuscriptBody: boolean
  chapterSummaries: boolean
  sceneHeadings: boolean
  traceAppendix: boolean
  compareSummary: boolean
  readinessChecklist: boolean
}

export interface BookExportProfileRulesRecord {
  requireAllScenesDrafted: boolean
  requireTraceReady: boolean
  allowWarnings: boolean
  allowDraftMissing: boolean
}

export interface BookExportProfileRecord {
  exportProfileId: string
  bookId: string
  kind: BookExportProfileKind
  title: LocalizedTextRecord
  summary: LocalizedTextRecord
  createdAtLabel: LocalizedTextRecord
  includes: BookExportProfileIncludesRecord
  rules: BookExportProfileRulesRecord
}

export type BookExportArtifactFormat = 'markdown' | 'plain_text'
export type BookExportArtifactBuildStatus = 'ready'

export interface BookExportArtifactReadinessSnapshot {
  status: 'ready' | 'attention' | 'blocked'
  blockerCount: number
  warningCount: number
  infoCount: number
}

export interface BookExportArtifactReviewGateSnapshot {
  openBlockerCount: number
  checkedFixCount: number
  blockedFixCount: number
  staleFixCount: number
}

export interface BookExportArtifactRecord {
  id: string
  bookId: string
  exportProfileId: string
  checkpointId?: string
  format: BookExportArtifactFormat
  status: BookExportArtifactBuildStatus
  filename: string
  mimeType: string
  title: string
  summary: string
  content: string
  sourceSignature: string
  chapterCount: number
  sceneCount: number
  wordCount: number
  readinessSnapshot: BookExportArtifactReadinessSnapshot
  reviewGateSnapshot: BookExportArtifactReviewGateSnapshot
  createdAtLabel: string
  createdByLabel: string
}

export interface BuildBookExportArtifactInput {
  bookId: string
  exportProfileId: string
  checkpointId?: string
  format: BookExportArtifactFormat
  filename: string
  mimeType: string
  title: string
  summary: string
  content: string
  sourceSignature: string
  chapterCount: number
  sceneCount: number
  wordCount: number
  readinessSnapshot: BookExportArtifactReadinessSnapshot
  reviewGateSnapshot: BookExportArtifactReviewGateSnapshot
}

export type BookExperimentBranchStatus = 'active' | 'review' | 'archived'

export interface BookExperimentBranchSceneRecord {
  sceneId: string
  title: LocalizedTextRecord
  summary: LocalizedTextRecord
  proseDraft?: LocalizedTextRecord
  draftWordCount?: number
  traceReady: boolean
  warningsCount: number
  sourceProposalCount: number
}

export interface BookExperimentBranchChapterRecord {
  chapterId: string
  title: LocalizedTextRecord
  summary: LocalizedTextRecord
  sceneSnapshots: BookExperimentBranchSceneRecord[]
}

export interface BookExperimentBranchRecord {
  branchId: string
  bookId: string
  title: LocalizedTextRecord
  summary: LocalizedTextRecord
  rationale: LocalizedTextRecord
  createdAtLabel: LocalizedTextRecord
  basedOnCheckpointId?: string
  status: BookExperimentBranchStatus
  chapterSnapshots: BookExperimentBranchChapterRecord[]
}

export interface ChapterStructureProblemSummaryRecord {
  id: string
  label: LocalizedTextRecord
  detail: LocalizedTextRecord
}

export interface ChapterStructureAssemblyHintRecord {
  id: string
  label: LocalizedTextRecord
  detail: LocalizedTextRecord
}

export type ChapterSceneBacklogStatus = 'planned' | 'running' | 'needs_review' | 'drafted' | 'revised'

export interface ChapterBacklogConstraintRecord {
  id: string
  label: LocalizedTextRecord
  detail: LocalizedTextRecord
}

export interface ChapterBacklogProposalSceneRecord {
  proposalSceneId: string
  sceneId: string
  order: number
  title: LocalizedTextRecord
  summary: LocalizedTextRecord
  purpose: LocalizedTextRecord
  pov: LocalizedTextRecord
  location: LocalizedTextRecord
  conflict: LocalizedTextRecord
  reveal: LocalizedTextRecord
  backlogStatus: ChapterSceneBacklogStatus
  plannerNotes: LocalizedTextRecord
}

export interface ChapterBacklogProposalRecord {
  proposalId: string
  chapterId: string
  goalSnapshot: LocalizedTextRecord
  constraintSnapshot: ChapterBacklogConstraintRecord[]
  scenes: ChapterBacklogProposalSceneRecord[]
  status: 'draft' | 'accepted'
}

export interface ChapterBacklogPlanningRecord {
  goal: LocalizedTextRecord
  constraints: ChapterBacklogConstraintRecord[]
  proposals: ChapterBacklogProposalRecord[]
  acceptedProposalId?: string
}

export interface ChapterStructureSceneRecord {
  id: string
  order: number
  title: LocalizedTextRecord
  summary: LocalizedTextRecord
  purpose: LocalizedTextRecord
  pov: LocalizedTextRecord
  location: LocalizedTextRecord
  conflict: LocalizedTextRecord
  reveal: LocalizedTextRecord
  backlogStatus: ChapterSceneBacklogStatus
  statusLabel: LocalizedTextRecord
  proseStatusLabel: LocalizedTextRecord
  runStatusLabel: LocalizedTextRecord
  unresolvedCount: number
  lastRunLabel: LocalizedTextRecord
}

export interface ChapterStructureInspectorRecord {
  chapterNotes: LocalizedTextRecord[]
  problemsSummary: ChapterStructureProblemSummaryRecord[]
  assemblyHints: ChapterStructureAssemblyHintRecord[]
}

export interface ChapterStructureWorkspaceRecord {
  chapterId: string
  title: LocalizedTextRecord
  summary: LocalizedTextRecord
  planning: ChapterBacklogPlanningRecord
  scenes: ChapterStructureSceneRecord[]
  inspector: ChapterStructureInspectorRecord
  viewsMeta?: {
    availableViews: ChapterStructureView[]
  }
}

export type ChapterSceneStructureField = 'summary' | 'purpose' | 'pov' | 'location' | 'conflict' | 'reveal'
export type ChapterSceneStructurePatch = Partial<Record<ChapterSceneStructureField, string>>

export interface PatchChapterBacklogPlanningInput {
  locale: 'en' | 'zh-CN'
  goal?: string
  constraints?: string[]
}

export interface UpdateChapterBacklogProposalSceneInput {
  locale: 'en' | 'zh-CN'
  patch?: Partial<Record<'title' | 'summary' | 'purpose' | 'pov' | 'location' | 'conflict' | 'reveal' | 'plannerNotes', string>>
  order?: number
  backlogStatus?: ChapterSceneBacklogStatus
}

export interface StartNextChapterSceneRunInput {
  locale: 'en' | 'zh-CN'
  mode?: RunMode
  note?: string
}

export interface ChapterRunNextSceneRecord {
  chapterId: string
  sceneId: string
  order: number
  title: LocalizedTextRecord
  backlogStatus: ChapterSceneBacklogStatus
}

export interface StartNextChapterSceneRunRecord {
  chapter: ChapterStructureWorkspaceRecord
  run: RunRecord
  selectedScene: ChapterRunNextSceneRecord
}

export type StoredReviewDecisionStatus = 'reviewed' | 'deferred' | 'dismissed'

export interface ReviewIssueDecisionRecord {
  id: string
  bookId: string
  issueId: string
  issueSignature: string
  status: StoredReviewDecisionStatus
  note?: string
  updatedAtLabel: string
  updatedByLabel: string
}

export interface SetReviewIssueDecisionInput {
  bookId: string
  issueId: string
  issueSignature: string
  status: StoredReviewDecisionStatus
  note?: string
}

export type ReviewFixActionStatus = 'started' | 'checked' | 'blocked'
export type ReviewFixActionTargetScope = 'book' | 'chapter' | 'scene' | 'asset'

export interface ReviewIssueFixActionRecord {
  id: string
  bookId: string
  issueId: string
  issueSignature: string
  sourceHandoffId: string
  sourceHandoffLabel: string
  targetScope: ReviewFixActionTargetScope
  status: ReviewFixActionStatus
  note?: string
  startedAtLabel: string
  updatedAtLabel: string
  updatedByLabel: string
}

export interface SetReviewIssueFixActionInput {
  bookId: string
  issueId: string
  issueSignature: string
  sourceHandoffId: string
  sourceHandoffLabel: string
  targetScope: ReviewFixActionTargetScope
  status: ReviewFixActionStatus
  note?: string
}

export type AssetKind = 'character' | 'location' | 'rule'
export type AssetMentionBackingKind = 'canon' | 'draft_context' | 'unlinked'
export type AssetContextVisibilityRecord =
  | 'public'
  | 'character-known'
  | 'private'
  | 'spoiler'
  | 'editor-only'
export type AssetContextBudgetRecord =
  | 'summary-only'
  | 'selected-facts'
  | 'mentions-excerpts'
  | 'full-profile'
export type AssetContextTargetAgentRecord =
  | 'scene-manager'
  | 'character-agent'
  | 'continuity-reviewer'
  | 'prose-agent'
export type AssetContextActivationReasonKindRecord =
  | 'explicit-link'
  | 'scene-cast'
  | 'scene-location'
  | 'rule-dependency'
  | 'review-issue'
  | 'proposal-variant'
  | 'manual-pin'

export interface AssetContextActivationRuleRecord {
  id: string
  reasonKind: AssetContextActivationReasonKindRecord
  label: LocalizedTextRecord
  summary: LocalizedTextRecord
  targetAgents: AssetContextTargetAgentRecord[]
  visibility: AssetContextVisibilityRecord
  budget: AssetContextBudgetRecord
  priorityLabel?: LocalizedTextRecord
  guardrailLabel?: LocalizedTextRecord
}

export interface AssetContextPolicyRecord {
  assetId: string
  status: 'active' | 'limited' | 'blocked' | 'draft'
  summary: LocalizedTextRecord
  defaultVisibility: AssetContextVisibilityRecord
  defaultBudget: AssetContextBudgetRecord
  activationRules: AssetContextActivationRuleRecord[]
  exclusions?: Array<{ id: string; label: LocalizedTextRecord; summary: LocalizedTextRecord }>
  warnings?: LocalizedTextRecord[]
}

export interface AssetProfileFactRecord {
  id: string
  label: LocalizedTextRecord
  value: LocalizedTextRecord
}

export interface AssetProfileSectionRecord {
  id: string
  title: LocalizedTextRecord
  facts: AssetProfileFactRecord[]
}

export interface AssetProfileRecord {
  sections: AssetProfileSectionRecord[]
}

export interface AssetMentionBackingRecord {
  kind: AssetMentionBackingKind
  sceneId?: string
  acceptedFactIds?: string[]
  proposalIds?: string[]
  patchId?: string
}

interface AssetMentionRecordBase {
  id: string
  targetScope: 'scene' | 'chapter'
  targetId: string
  targetLabel: LocalizedTextRecord
  relationLabel: LocalizedTextRecord
  excerpt: LocalizedTextRecord
  backing?: AssetMentionBackingRecord
}

export interface AssetSceneMentionRecord extends AssetMentionRecordBase {
  targetScope: 'scene'
  chapterId?: string
  sceneId: string
  recommendedLens?: Extract<SceneLens, 'draft' | 'orchestrate'>
}

export interface AssetChapterMentionRecord extends AssetMentionRecordBase {
  targetScope: 'chapter'
  chapterId: string
  sceneId?: undefined
  recommendedLens?: Extract<ChapterLens, 'structure' | 'draft'>
}

export type AssetMentionRecord = AssetSceneMentionRecord | AssetChapterMentionRecord

export interface AssetRelationRecord {
  id: string
  targetAssetId: string
  relationLabel: LocalizedTextRecord
  summary: LocalizedTextRecord
}

export interface AssetRecord {
  id: string
  kind: AssetKind
  title: LocalizedTextRecord
  summary: LocalizedTextRecord
  profile: AssetProfileRecord
  mentions: AssetMentionRecord[]
  relations: AssetRelationRecord[]
  contextPolicy?: AssetContextPolicyRecord
  warnings?: LocalizedTextRecord[]
  notes?: LocalizedTextRecord[]
}

export interface AssetKnowledgeWorkspaceRecord {
  assetId: string
  assets: AssetRecord[]
  viewsMeta: {
    availableViews: AssetKnowledgeView[]
  }
}

export type SceneTab = 'setup' | 'execution' | 'prose'
export type SceneStatus = 'draft' | 'running' | 'review' | 'ready' | 'committed'
export type SceneRunStatus = 'idle' | 'running' | 'paused' | 'failed' | 'completed'
export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'rewrite-requested'
export type ProposalKind = 'action' | 'intent' | 'conflict' | 'state-change' | 'dialogue'
export type ProposalSeverity = 'info' | 'warn' | 'high'
export type SceneDockTabId = 'events' | 'trace' | 'consistency' | 'problems' | 'cost'

export interface SceneWorkspaceViewModel {
  id: string
  title: string
  chapterId: string
  chapterTitle: string
  status: SceneStatus
  runStatus: SceneRunStatus
  objective: string
  castIds: string[]
  locationId?: string
  latestRunId?: string
  pendingProposalCount: number
  warningCount: number
  currentVersionLabel?: string
  activeThreadId?: string
  availableThreads: Array<{ id: string; label: string }>
}

export interface SceneObjectiveModel {
  goal: string
  tensionLabel?: string
  pacingLabel?: string
  cast: Array<{ id: string; name: string; role?: string }>
  location?: { id: string; name: string }
  warningsCount: number
  unresolvedCount: number
  constraintSummary: string[]
}

export interface BeatRailItemModel {
  id: string
  index: number
  title: string
  status: 'todo' | 'running' | 'review' | 'accepted' | 'blocked'
  proposalCount: number
  warningCount: number
  summary?: string
}

export interface ProposalFilters {
  status?: ProposalStatus
  kind?: ProposalKind
  beatId?: string
  actorId?: string
  severity?: ProposalSeverity
}

export interface ProposalCardModel {
  id: string
  beatId?: string
  actor: {
    id: string
    name: string
    type: 'scene-manager' | 'character' | 'system'
  }
  kind: ProposalKind
  title: string
  summary: string
  detail?: string
  status: ProposalStatus
  impactTags: string[]
  affects: Array<{
    path: string
    label: string
    deltaSummary: string
  }>
  risks?: Array<{
    severity: ProposalSeverity
    message: string
  }>
  evidencePeek?: string[]
  sourceTraceId?: string
}

export interface SceneTraceProposalRefModel {
  proposalId: string
  title?: string
  sourceTraceId?: string
}

export interface SceneTraceAssetRefModel {
  assetId: string
  title: string
  kind?: AssetKind
}

export interface SceneAcceptedFactModel {
  id: string
  label: string
  value: string
  sourceProposals?: SceneTraceProposalRefModel[]
  relatedAssets?: SceneTraceAssetRefModel[]
}

export interface SceneAcceptedSummaryModel {
  sceneSummary: string
  acceptedFacts: SceneAcceptedFactModel[]
  readiness: 'not-ready' | 'draftable' | 'ready'
  pendingProposalCount: number
  warningCount: number
  patchCandidateCount?: number
}

export interface SceneRuntimeSummaryModel {
  runHealth: 'stable' | 'attention' | 'blocked'
  latencyLabel: string
  tokenLabel: string
  costLabel: string
  latestFailureSummary?: string
}

export interface SceneConsistencySummaryModel {
  warningsCount: number
  topIssues: string[]
}

export interface SceneExecutionViewModel {
  runId?: string
  objective: SceneObjectiveModel
  beats: BeatRailItemModel[]
  proposals: ProposalCardModel[]
  acceptedSummary: SceneAcceptedSummaryModel
  runtimeSummary: SceneRuntimeSummaryModel
  consistencySummary?: SceneConsistencySummaryModel
  canContinueRun: boolean
  canOpenProse: boolean
}

export interface SceneProseViewModel {
  sceneId: string
  proseDraft?: string
  revisionModes: Array<'rewrite' | 'compress' | 'expand' | 'tone_adjust' | 'continuity_fix'>
  latestDiffSummary?: string
  warningsCount: number
  focusModeAvailable: boolean
  revisionQueueCount?: number
  draftWordCount?: number
  statusLabel?: string
  revisionCandidate?: {
    revisionId: string
    revisionMode: 'rewrite' | 'compress' | 'expand' | 'tone_adjust' | 'continuity_fix'
    instruction?: string
    proseBody: string
    diffSummary: string
    sourceProseDraftId: string
    sourceCanonPatchId: string
    contextPacketId: string
    fallbackProvenance?: {
      provider: 'fixture'
      modelId: string
      fallbackReason?: 'missing-config' | 'provider-error' | 'invalid-output'
    }
  }
  traceSummary?: {
    sourcePatchId?: string
    sourceProseDraftId?: string
    contextPacketId?: string
    sourceProposals?: SceneTraceProposalRefModel[]
    acceptedFactIds?: string[]
    relatedAssets?: SceneTraceAssetRefModel[]
    missingLinks?: string[]
  }
}

export interface ProposalActionInput {
  proposalId: string
  note?: string
  editedSummary?: string
  editedFields?: Record<string, unknown>
}

export interface SceneSetupIdentityModel {
  title: string
  chapterLabel: string
  locationLabel: string
  povCharacterId: string
  timeboxLabel: string
  summary: string
}

export interface SceneSetupObjectiveModel {
  externalGoal: string
  emotionalGoal: string
  successSignal: string
  failureCost: string
}

export interface SceneSetupCastMemberModel {
  id: string
  name: string
  role: string
  agenda: string
  selected: boolean
}

export interface SceneSetupConstraintModel {
  id: string
  label: string
  kind: 'canon' | 'staging' | 'tone' | 'timing'
  summary: string
}

export interface SceneKnowledgeBoundaryModel {
  id: string
  label: string
  summary: string
  status: 'known' | 'guarded' | 'open-question'
}

export interface SceneRuntimePresetOptionModel {
  id: string
  label: string
  focus: string
  intensity: string
  summary: string
}

export interface SceneRuntimePresetModel {
  selectedPresetId: string
  presetOptions: SceneRuntimePresetOptionModel[]
}

export interface SceneSetupViewModel {
  sceneId: string
  identity: SceneSetupIdentityModel
  objective: SceneSetupObjectiveModel
  cast: SceneSetupCastMemberModel[]
  constraints: SceneSetupConstraintModel[]
  knowledgeBoundaries: SceneKnowledgeBoundaryModel[]
  runtimePreset: SceneRuntimePresetModel
}

export interface SceneInspectorContextModel {
  acceptedFacts: SceneAcceptedFactModel[]
  privateInfoGuard: {
    summary: string
    items: Array<{
      id: string
      label: string
      summary: string
      status: 'guarded' | 'watching' | 'clear'
    }>
  }
  actorKnowledgeBoundaries: Array<{
    actor: {
      id: string
      name: string
      role?: string
    }
    boundaries: SceneKnowledgeBoundaryModel[]
  }>
  localState: Array<{ id: string; label: string; value: string }>
  overrides: Array<{
    id: string
    label: string
    summary: string
    status: 'active' | 'watching' | 'cleared'
  }>
}

export interface SceneInspectorVersionsModel {
  checkpoints: Array<{
    id: string
    label: string
    summary: string
    status: 'accepted' | 'review' | 'watch'
  }>
  acceptanceTimeline: Array<{
    id: string
    title: string
    detail: string
    meta: string
    tone: 'neutral' | 'accent' | 'success' | 'warn'
  }>
  patchCandidates: Array<{
    id: string
    label: string
    summary: string
    status: 'ready_for_commit' | 'needs_review' | 'deferred'
  }>
}

export interface SceneInspectorRuntimeModel {
  profile: {
    label: string
    summary: string
  }
  runHealth: 'stable' | 'attention' | 'blocked'
  metrics: {
    latencyLabel: string
    tokenLabel: string
    costLabel: string
  }
  latestFailure?: string
}

export interface SceneInspectorViewModel {
  context: SceneInspectorContextModel
  versions: SceneInspectorVersionsModel
  runtime: SceneInspectorRuntimeModel
}

export interface SceneDockEntry {
  id: string
  title: string
  detail: string
  meta?: string
  tone?: 'neutral' | 'accent' | 'success' | 'warn' | 'danger'
}

export interface SceneDockConsistencyModel {
  summary: string
  checks: Array<{
    id: string
    label: string
    status: 'pass' | 'warn' | 'blocked'
    detail: string
  }>
}

export interface SceneDockProblemsModel {
  summary: string
  items: Array<{
    id: string
    title: string
    severity: 'warn' | 'high'
    recommendation: string
  }>
}

export interface SceneDockCostModel {
  currentWindowLabel: string
  trendLabel: string
  breakdown: Array<{ id: string; label: string; value: string }>
}

export interface SceneDockViewModel {
  events: SceneDockEntry[]
  trace: SceneDockEntry[]
  consistency: SceneDockConsistencyModel
  problems: SceneDockProblemsModel
  cost: SceneDockCostModel
}

export interface ScenePatchPreviewViewModel {
  patchId: string
  label: string
  summary: string
  status: 'ready_for_commit' | 'needs_review' | 'deferred'
  sceneSummary: string
  acceptedFacts: SceneAcceptedFactModel[]
  changes: Array<{
    id: string
    label: string
    detail: string
    sourceProposals?: SceneTraceProposalRefModel[]
    relatedAssets?: SceneTraceAssetRefModel[]
  }>
}

export interface SceneFixtureRecord {
  workspace: SceneWorkspaceViewModel
  setup: SceneSetupViewModel
  execution: SceneExecutionViewModel
  prose: SceneProseViewModel
  inspector: SceneInspectorViewModel
  dock: SceneDockViewModel
  patchPreview: ScenePatchPreviewViewModel | null
}

export type RunMode = 'continue' | 'rewrite' | 'from-scratch'
export type RunScope = 'scene' | 'chapter' | 'book'
export type RunStatus = 'queued' | 'running' | 'waiting_review' | 'completed' | 'failed' | 'cancelled'

export interface StartSceneRunInput {
  sceneId: string
  mode?: RunMode
  note?: string
}

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
  eventCount: number
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
  assetKind: 'character' | 'location' | 'rule'
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
}

export type RunArtifactDetailRecord =
  | ContextPacketArtifactDetailRecord
  | AgentInvocationArtifactDetailRecord
  | ProposalSetArtifactDetailRecord
  | CanonPatchArtifactDetailRecord
  | ProseDraftArtifactDetailRecord

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

export type RunTraceNodeKind =
  | 'context-packet'
  | 'agent-invocation'
  | 'proposal-set'
  | 'proposal'
  | 'review'
  | 'canon-patch'
  | 'canon-fact'
  | 'prose-draft'
  | 'asset'

export type RunTraceRelation =
  | 'used_context'
  | 'generated'
  | 'proposed'
  | 'reviewed_by'
  | 'accepted_into'
  | 'rendered_as'
  | 'mentions'

export interface RunTraceNodeRecord {
  id: string
  kind: RunTraceNodeKind
  label: LocalizedTextRecord
}

export interface RunTraceLinkRecord {
  id: string
  from: {
    kind: RunTraceNodeKind
    id: string
  }
  to: {
    kind: RunTraceNodeKind
    id: string
  }
  relation: RunTraceRelation
  label: LocalizedTextRecord
}

export interface RunTraceResponse {
  runId: string
  links: RunTraceLinkRecord[]
  nodes: RunTraceNodeRecord[]
  summary: {
    proposalSetCount: number
    canonPatchCount: number
    proseDraftCount: number
    missingTraceCount: number
  }
}

export interface RunArtifactListResponse {
  runId: string
  artifacts: RunArtifactSummaryRecord[]
}

export interface RunArtifactDetailResponse {
  artifact: RunArtifactDetailRecord
}

export interface SubmitRunReviewDecisionInput {
  runId: string
  reviewId: string
  decision: RunReviewDecisionKind
  note?: string
  patchId?: string
  selectedVariants?: RunSelectedProposalVariantRecord[]
}

export interface FixtureProjectData {
  runtimeInfo: ProjectRuntimeInfoRecord
  books: Record<string, BookStructureRecord>
  manuscriptCheckpoints: Record<string, BookManuscriptCheckpointRecord[]>
  exportProfiles: Record<string, BookExportProfileRecord[]>
  exportArtifacts: Record<string, BookExportArtifactRecord[]>
  experimentBranches: Record<string, BookExperimentBranchRecord[]>
  chapters: Record<string, ChapterStructureWorkspaceRecord>
  assets: Record<string, AssetKnowledgeWorkspaceRecord>
  reviewDecisions: Record<string, ReviewIssueDecisionRecord[]>
  reviewFixActions: Record<string, ReviewIssueFixActionRecord[]>
  scenes: Record<string, SceneFixtureRecord>
}

export interface FixtureDataSnapshot {
  projects: Record<string, FixtureProjectData>
}
