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

export interface SceneAcceptedSummaryModel {
  sceneSummary: string
  acceptedFacts: Array<{ id: string; label: string; value: string }>
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
  acceptedFacts: Array<{ id: string; label: string; value: string }>
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
  acceptedFacts: Array<{ id: string; label: string; value: string }>
  changes: Array<{
    id: string
    label: string
    detail: string
  }>
}
