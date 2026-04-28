import { randomUUID } from 'node:crypto'

import type {
  AssetKnowledgeWorkspaceRecord,
  BookDraftAssemblyChapterHeadingSectionRecord,
  BookDraftAssemblyChapterRecord,
  BookDraftAssemblyManuscriptSectionRecord,
  BookDraftAssemblyRecord,
  BookDraftAssemblyReadableManuscriptRecord,
  BookDraftAssemblySceneGapRecord,
  BookDraftAssemblySceneRecord,
  BookDraftAssemblySceneManuscriptSectionRecord,
  BookDraftAssemblySourceManifestEntryRecord,
  BookDraftAssemblyTraceRollupRecord,
  BookDraftAssemblyTransitionManuscriptSectionRecord,
  ChapterDraftAssemblyRecord,
  ChapterDraftAssemblySceneGapSectionRecord,
  ChapterDraftAssemblySceneRecord,
  ChapterDraftAssemblySectionRecord,
  ChapterDraftAssemblyTraceRollupRecord,
  ChapterDraftAssemblyTransitionDraftSectionRecord,
  ChapterDraftAssemblyTransitionGapSectionRecord,
  ChapterBacklogPlanningRecord,
  ChapterBacklogProposalSceneRecord,
  BookExperimentBranchRecord,
  BookExportArtifactRecord,
  BookExportProfileRecord,
  BookManuscriptCheckpointRecord,
  BookStructureRecord,
  BuildBookExportArtifactInput,
  ChapterSceneStructurePatch,
  ChapterSceneBacklogStatus,
  ChapterRunNextSceneRecord,
  ChapterStructureSceneRecord,
  ChapterStructureWorkspaceRecord,
  FixtureDataSnapshot,
  FixtureProjectData,
  LocalizedTextRecord,
  PatchChapterBacklogPlanningInput,
  ProjectRuntimeInfoRecord,
  ProposalActionInput,
  ProposalSetArtifactDetailRecord,
  ReviewIssueDecisionRecord,
  ReviewIssueFixActionRecord,
  CanonPatchArtifactDetailRecord,
  ProseDraftArtifactDetailRecord,
  RunArtifactDetailRecord,
  RunArtifactSummaryRecord,
  RunEventsPageRecord,
  RunRecord,
  RunTraceResponse,
  SceneDockTabId,
  SceneDockViewModel,
  SceneExecutionViewModel,
  SceneInspectorViewModel,
  ScenePatchPreviewViewModel,
  SceneProseViewModel,
  SceneSetupViewModel,
  SceneWorkspaceViewModel,
  SetReviewIssueDecisionInput,
  SetReviewIssueFixActionInput,
  StartNextChapterSceneRunInput,
  StartNextChapterSceneRunRecord,
  StartSceneRunInput,
  SubmitRunReviewDecisionInput,
  UpdateChapterBacklogProposalSceneInput,
} from '../contracts/api-records.js'
import { conflict, notFound } from '../http/errors.js'
import { createChapterBacklogProposal } from '../orchestration/chapterBacklog/chapterBacklogPlanner.js'
import {
  CHAPTER_RUN_REVIEW_GATE_BLOCKED,
  resolveNextChapterRunScene,
  updateChapterRunSceneBacklogStatus,
} from '../orchestration/chapterRun/chapterRunOrchestration.js'
import type {
  ScenePlannerGatewayRequest,
  ScenePlannerGatewayResult,
} from '../orchestration/modelGateway/scenePlannerGateway.js'
import type {
  SceneProseWriterGatewayRequest,
  SceneProseWriterGatewayResult,
} from '../orchestration/modelGateway/sceneProseWriterGateway.js'
import { createSceneProseWriterGateway } from '../orchestration/modelGateway/sceneProseWriterGateway.js'
import { buildSceneContextPacket } from '../orchestration/contextBuilder/sceneContextBuilder.js'
import {
  buildAcceptedFactsFromCanonPatch,
  buildSceneProseFromProseDraftArtifact,
} from '../orchestration/sceneRun/sceneRunProseMaterialization.js'
import {
  acceptSceneProseRevisionCandidate,
  applySceneProseRevisionCandidate,
} from '../orchestration/sceneRun/sceneRunProseRevision.js'

import { createFixtureDataSnapshot } from './fixture-data.js'
import type {
  LocalProjectStoreRecord,
  PersistedRunStore,
} from './project-state-persistence.js'
import { createRunFixtureStore, type RunFixtureStore } from './runFixtureStore.js'

function clone<T>(value: T): T {
  return structuredClone(value)
}

function jsonEquals(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function toJsonClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function localizedText(en: string, zhCN: string) {
  return {
    en,
    'zh-CN': zhCN,
  }
}

function localizeCurrentSceneProseStatusLabel(statusLabel: string) {
  switch (statusLabel) {
    case 'Draft ready for review':
      return localizedText(statusLabel, '草稿可供审阅')
    case 'Generated':
      return localizedText(statusLabel, '已生成')
    case 'Updated':
      return localizedText(statusLabel, '已更新')
    case 'Revision queued':
      return localizedText(statusLabel, '修订已排队')
    case 'Revision candidate ready':
      return localizedText(statusLabel, '修订候选已就绪')
    case 'Ready for revision pass':
      return localizedText(statusLabel, '可进入修订轮')
    case 'Draft handoff ready':
      return localizedText(statusLabel, '草稿交接已就绪')
    case 'Waiting for prose artifact':
      return localizedText(statusLabel, '等待正文产物')
    case 'Missing draft':
      return localizedText(statusLabel, '缺少草稿')
    case 'Accepted with edit':
      return localizedText(statusLabel, '接受并编辑')
    default:
      return localizedText(statusLabel, statusLabel)
  }
}

function mergeLocalizedText(value: { en: string; 'zh-CN': string }, locale: 'en' | 'zh-CN', nextValue: string) {
  return {
    ...value,
    [locale]: nextValue,
  }
}

function normalizeIndex(targetIndex: number, sceneCount: number) {
  if (sceneCount <= 1) {
    return 0
  }

  return Math.min(Math.max(targetIndex, 0), sceneCount - 1)
}

function normalizeSceneOrders(record: ChapterStructureWorkspaceRecord): ChapterStructureWorkspaceRecord {
  return {
    ...record,
    scenes: [...record.scenes]
      .sort((left, right) => left.order - right.order)
      .map((scene, index) => ({
        ...scene,
        order: index + 1,
      })),
  }
}

function reorderChapterRecordScenes(
  record: ChapterStructureWorkspaceRecord,
  sceneId: string,
  targetIndex: number,
): ChapterStructureWorkspaceRecord {
  const normalizedRecord = normalizeSceneOrders(record)
  const sourceIndex = normalizedRecord.scenes.findIndex((scene) => scene.id === sceneId)
  if (sourceIndex < 0) {
    return normalizedRecord
  }

  const nextScenes = [...normalizedRecord.scenes]
  const [movedScene] = nextScenes.splice(sourceIndex, 1)
  if (!movedScene) {
    return normalizedRecord
  }

  nextScenes.splice(normalizeIndex(targetIndex, normalizedRecord.scenes.length), 0, movedScene)

  return {
    ...normalizedRecord,
    scenes: nextScenes.map((scene, index) => ({
      ...scene,
      order: index + 1,
    })),
  }
}

function patchChapterRecordScene(
  record: ChapterStructureWorkspaceRecord,
  sceneId: string,
  patch: ChapterSceneStructurePatch,
  locale: 'en' | 'zh-CN',
): ChapterStructureWorkspaceRecord {
  const sceneFields: Array<keyof Pick<ChapterStructureSceneRecord, 'summary' | 'purpose' | 'pov' | 'location' | 'conflict' | 'reveal'>> = [
    'summary',
    'purpose',
    'pov',
    'location',
    'conflict',
    'reveal',
  ]

  return {
    ...record,
    scenes: record.scenes.map((scene) => {
      if (scene.id !== sceneId) {
        return scene
      }

      const nextScene: ChapterStructureSceneRecord = { ...scene }
      for (const field of sceneFields) {
        const nextValue = patch[field]
        if (nextValue === undefined) {
          continue
        }

        nextScene[field] = mergeLocalizedText(nextScene[field], locale, nextValue)
      }

      return nextScene
    }),
  }
}

function normalizeProposalSceneOrders(
  scenes: ChapterBacklogProposalSceneRecord[],
): ChapterBacklogProposalSceneRecord[] {
  return scenes.map((scene, index) => ({
    ...scene,
    order: index + 1,
  }))
}

function reorderProposalScenes(
  scenes: ChapterBacklogProposalSceneRecord[],
  proposalSceneId: string,
  targetOrder: number,
): ChapterBacklogProposalSceneRecord[] {
  const normalizedScenes = normalizeProposalSceneOrders(scenes)
  const sourceIndex = normalizedScenes.findIndex((scene) => scene.proposalSceneId === proposalSceneId)
  if (sourceIndex < 0) {
    return normalizedScenes
  }

  const nextScenes = [...normalizedScenes]
  const [movedScene] = nextScenes.splice(sourceIndex, 1)
  if (!movedScene) {
    return normalizedScenes
  }

  const targetIndex = Math.min(Math.max(targetOrder - 1, 0), nextScenes.length)
  nextScenes.splice(targetIndex, 0, movedScene)
  return normalizeProposalSceneOrders(nextScenes)
}

function createConstraintId(index: number) {
  return `constraint-${String(index + 1).padStart(3, '0')}`
}

function patchChapterBacklogPlanning(
  record: ChapterStructureWorkspaceRecord,
  input: PatchChapterBacklogPlanningInput,
): ChapterStructureWorkspaceRecord {
  const nextPlanning: ChapterBacklogPlanningRecord = {
    ...record.planning,
    goal: input.goal === undefined
      ? clone(record.planning.goal)
      : mergeLocalizedText(record.planning.goal, input.locale, input.goal),
    constraints: input.constraints === undefined
      ? clone(record.planning.constraints)
      : input.constraints.map((constraint, index) => ({
        id: record.planning.constraints[index]?.id ?? createConstraintId(index),
        label: mergeLocalizedText(
          record.planning.constraints[index]?.label ?? localizedText('', ''),
          input.locale,
          constraint,
        ),
        detail: clone(record.planning.constraints[index]?.detail ?? localizedText('', '')),
      })),
  }

  return {
    ...record,
    planning: nextPlanning,
  }
}

function patchChapterBacklogProposalScene(
  record: ChapterStructureWorkspaceRecord,
  proposalId: string,
  proposalSceneId: string,
  input: UpdateChapterBacklogProposalSceneInput,
): ChapterStructureWorkspaceRecord {
  return {
    ...record,
    planning: {
      ...record.planning,
      proposals: record.planning.proposals.map((proposal) => {
        if (proposal.proposalId !== proposalId) {
          return proposal
        }

    const patchedScenes = proposal.scenes.map((scene) => {
            if (scene.proposalSceneId !== proposalSceneId) {
              return scene
            }

            const nextScene = {
              ...scene,
              backlogStatus: input.backlogStatus ?? scene.backlogStatus,
            }

            if (input.patch?.title !== undefined) {
              nextScene.title = mergeLocalizedText(nextScene.title, input.locale, input.patch.title)
            }
            if (input.patch?.summary !== undefined) {
              nextScene.summary = mergeLocalizedText(nextScene.summary, input.locale, input.patch.summary)
            }
            if (input.patch?.purpose !== undefined) {
              nextScene.purpose = mergeLocalizedText(nextScene.purpose, input.locale, input.patch.purpose)
            }
            if (input.patch?.pov !== undefined) {
              nextScene.pov = mergeLocalizedText(nextScene.pov, input.locale, input.patch.pov)
            }
            if (input.patch?.location !== undefined) {
              nextScene.location = mergeLocalizedText(nextScene.location, input.locale, input.patch.location)
            }
            if (input.patch?.conflict !== undefined) {
              nextScene.conflict = mergeLocalizedText(nextScene.conflict, input.locale, input.patch.conflict)
            }
            if (input.patch?.reveal !== undefined) {
              nextScene.reveal = mergeLocalizedText(nextScene.reveal, input.locale, input.patch.reveal)
            }
            if (input.patch?.plannerNotes !== undefined) {
              nextScene.plannerNotes = mergeLocalizedText(nextScene.plannerNotes, input.locale, input.patch.plannerNotes)
            }

            return nextScene
          })
        const nextScenes = input.order === undefined
          ? normalizeProposalSceneOrders(patchedScenes)
          : reorderProposalScenes(patchedScenes, proposalSceneId, input.order)

        return {
          ...proposal,
          scenes: nextScenes,
        }
      }),
    },
  }
}

function applyAcceptedChapterBacklogProposal(
  record: ChapterStructureWorkspaceRecord,
  proposalId: string,
): ChapterStructureWorkspaceRecord {
  const proposal = record.planning.proposals.find((item) => item.proposalId === proposalId)
  if (!proposal) {
    return record
  }

  const proposalScenesBySceneId = new Map(proposal.scenes.map((scene) => [scene.sceneId, scene]))

  const nextScenes = normalizeSceneOrders({
    ...record,
    scenes: proposal.scenes.map((proposalScene) => {
      const currentScene = record.scenes.find((scene) => scene.id === proposalScene.sceneId)
      if (!currentScene) {
        throw notFound(`Scene ${proposalScene.sceneId} was not found.`, {
          code: 'SCENE_NOT_FOUND',
          detail: { chapterId: record.chapterId, sceneId: proposalScene.sceneId },
        })
      }

      return {
        ...currentScene,
        order: proposalScene.order,
        title: clone(proposalScene.title),
        summary: clone(proposalScene.summary),
        purpose: clone(proposalScene.purpose),
        pov: clone(proposalScene.pov),
        location: clone(proposalScene.location),
        conflict: clone(proposalScene.conflict),
        reveal: clone(proposalScene.reveal),
        backlogStatus: proposalScene.backlogStatus,
      }
    }),
  }).scenes

  return {
    ...record,
    scenes: nextScenes,
    planning: {
      ...record.planning,
      acceptedProposalId: proposalId,
      proposals: record.planning.proposals.map((item) => ({
        ...item,
        status: item.proposalId === proposalId ? 'accepted' : item.status,
        scenes: item.proposalId === proposalId
          ? normalizeProposalSceneOrders(item.scenes)
          : item.scenes.map((scene) => ({
            ...scene,
            backlogStatus: proposalScenesBySceneId.get(scene.sceneId)?.backlogStatus ?? scene.backlogStatus,
          })),
      })),
    },
  }
}

function createReviewDecisionRecordId(bookId: string, issueId: string) {
  return `${bookId}::${issueId}`
}

function createReviewFixActionRecordId(bookId: string, issueId: string) {
  return `${bookId}::${issueId}`
}

function trimNote(note?: string) {
  const value = note?.trim()
  return value ? value : undefined
}

function mapRunStatusToSceneRunStatus(status: RunRecord['status']): SceneWorkspaceViewModel['runStatus'] {
  switch (status) {
    case 'queued':
    case 'running':
      return 'running'
    case 'waiting_review':
      return 'paused'
    case 'completed':
      return 'completed'
    case 'failed':
      return 'failed'
    case 'cancelled':
      return 'idle'
  }
}

function mapRunStatusToSceneStatus(status: RunRecord['status']): SceneWorkspaceViewModel['status'] {
  switch (status) {
    case 'queued':
    case 'running':
      return 'running'
    case 'waiting_review':
      return 'review'
    case 'completed':
      return 'ready'
    case 'failed':
    case 'cancelled':
      return 'draft'
  }
}

function mapRunStatusToRunHealth(status: RunRecord['status']): SceneExecutionViewModel['runtimeSummary']['runHealth'] {
  switch (status) {
    case 'failed':
      return 'blocked'
    case 'queued':
    case 'waiting_review':
      return 'attention'
    case 'running':
    case 'completed':
    case 'cancelled':
      return 'stable'
  }
}

function buildSceneRunStatusLabel(run: RunRecord) {
  switch (run.status) {
    case 'queued':
      return 'Run queued'
    case 'running':
      return 'Run in progress'
    case 'waiting_review':
      return 'Run waiting for review'
    case 'completed':
      return 'Run completed'
    case 'failed':
      return 'Run failed'
    case 'cancelled':
      return 'Run cancelled'
  }
}

function isAcceptedRunDecision(decision: SubmitRunReviewDecisionInput['decision']) {
  return decision === 'accept' || decision === 'accept-with-edit'
}

function deriveDraftWordCount(proseDraft?: string, draftWordCount?: number) {
  if (draftWordCount !== undefined) {
    return draftWordCount
  }

  const trimmed = proseDraft?.trim()
  if (!trimmed) {
    return undefined
  }

  return trimmed.split(/\s+/).length
}

function hasConcreteProseDraft(proseDraft?: string) {
  return Boolean(proseDraft?.trim())
}

function buildRevisionModeLabel(revisionMode: SceneProseViewModel['revisionModes'][number]) {
  switch (revisionMode) {
    case 'rewrite':
      return 'rewrite'
    case 'compress':
      return 'compression'
    case 'expand':
      return 'expansion'
    case 'tone_adjust':
      return 'tone adjustment'
    case 'continuity_fix':
      return 'continuity fix'
  }
}

function trimProseRevisionInstruction(instruction?: string) {
  const value = instruction?.trim()
  return value ? value : undefined
}

function isRevisionSourceRunStateCandidate(
  value: unknown,
): value is {
  run: RunRecord
  artifacts: Array<{ kind: string; id: string }>
  sequence: number
} {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }

  const candidate = value as {
    run?: Partial<RunRecord>
    artifacts?: unknown
    sequence?: unknown
  }

  return typeof candidate.sequence === 'number'
    && typeof candidate.run?.id === 'string'
    && typeof candidate.run.scope === 'string'
    && typeof candidate.run.scopeId === 'string'
    && Array.isArray(candidate.artifacts)
    && candidate.artifacts.every((artifact) => (
      typeof artifact === 'object'
      && artifact !== null
      && !Array.isArray(artifact)
      && typeof (artifact as { kind?: unknown }).kind === 'string'
      && typeof (artifact as { id?: unknown }).id === 'string'
    ))
}

export interface FixtureRepository {
  whenReady(): Promise<void>
  getProjectRuntimeInfo(projectId: string): ProjectRuntimeInfoRecord
  getBookStructure(projectId: string, bookId: string): BookStructureRecord | null
  getBookDraftAssembly(projectId: string, bookId: string): BookDraftAssemblyRecord | null
  getChapterDraftAssembly(projectId: string, chapterId: string): ChapterDraftAssemblyRecord | null
  getBookManuscriptCheckpoints(projectId: string, bookId: string): BookManuscriptCheckpointRecord[]
  getBookManuscriptCheckpoint(projectId: string, bookId: string, checkpointId: string): BookManuscriptCheckpointRecord | null
  getBookExportProfiles(projectId: string, bookId: string): BookExportProfileRecord[]
  getBookExportProfile(projectId: string, bookId: string, exportProfileId: string): BookExportProfileRecord | null
  getBookExportArtifacts(projectId: string, input: { bookId: string; exportProfileId?: string; checkpointId?: string }): BookExportArtifactRecord[]
  createBookExportArtifact(projectId: string, input: BuildBookExportArtifactInput): Promise<BookExportArtifactRecord>
  getBookExperimentBranches(projectId: string, bookId: string): BookExperimentBranchRecord[]
  getBookExperimentBranch(projectId: string, bookId: string, branchId: string): BookExperimentBranchRecord | null
  getChapterStructure(projectId: string, chapterId: string): ChapterStructureWorkspaceRecord | null
  updateChapterBacklogPlanningInput(projectId: string, chapterId: string, input: PatchChapterBacklogPlanningInput): Promise<ChapterStructureWorkspaceRecord | null>
  generateChapterBacklogProposal(projectId: string, chapterId: string): Promise<ChapterStructureWorkspaceRecord | null>
  updateChapterBacklogProposalScene(
    projectId: string,
    input: {
      chapterId: string
      proposalId: string
      proposalSceneId: string
      patch: UpdateChapterBacklogProposalSceneInput
    },
  ): Promise<ChapterStructureWorkspaceRecord | null>
  acceptChapterBacklogProposal(
    projectId: string,
    input: { chapterId: string; proposalId: string },
  ): Promise<ChapterStructureWorkspaceRecord | null>
  startNextChapterSceneRun(
    projectId: string,
    chapterId: string,
    input: StartNextChapterSceneRunInput,
  ): Promise<StartNextChapterSceneRunRecord | null>
  reorderChapterScene(projectId: string, input: { chapterId: string; sceneId: string; targetIndex: number }): Promise<ChapterStructureWorkspaceRecord | null>
  updateChapterSceneStructure(projectId: string, input: { chapterId: string; sceneId: string; locale: 'en' | 'zh-CN'; patch: ChapterSceneStructurePatch }): Promise<ChapterStructureWorkspaceRecord | null>
  getAssetKnowledge(projectId: string, assetId: string): AssetKnowledgeWorkspaceRecord | null
  getReviewDecisions(projectId: string, bookId: string): ReviewIssueDecisionRecord[]
  setReviewDecision(projectId: string, input: SetReviewIssueDecisionInput): Promise<ReviewIssueDecisionRecord>
  clearReviewDecision(projectId: string, input: { bookId: string; issueId: string }): Promise<void>
  getReviewFixActions(projectId: string, bookId: string): ReviewIssueFixActionRecord[]
  setReviewFixAction(projectId: string, input: SetReviewIssueFixActionInput): Promise<ReviewIssueFixActionRecord>
  clearReviewFixAction(projectId: string, input: { bookId: string; issueId: string }): Promise<void>
  getSceneWorkspace(projectId: string, sceneId: string): SceneWorkspaceViewModel
  getSceneSetup(projectId: string, sceneId: string): SceneSetupViewModel
  updateSceneSetup(projectId: string, sceneId: string, setup: SceneSetupViewModel): Promise<void>
  getSceneExecution(projectId: string, sceneId: string): SceneExecutionViewModel
  getSceneProse(projectId: string, sceneId: string): SceneProseViewModel
  getSceneInspector(projectId: string, sceneId: string): SceneInspectorViewModel
  getSceneDockSummary(projectId: string, sceneId: string): SceneDockViewModel
  getSceneDockTab(projectId: string, sceneId: string, tab: SceneDockTabId): Partial<SceneDockViewModel>
  getScenePatchPreview(projectId: string, sceneId: string): ScenePatchPreviewViewModel | null
  commitScenePatch(projectId: string, sceneId: string, patchId: string): void
  reviseSceneProse(
    projectId: string,
    sceneId: string,
    input: {
      revisionMode: SceneProseViewModel['revisionModes'][number]
      instruction?: string
    },
  ): Promise<void>
  acceptSceneProseRevision(projectId: string, sceneId: string, revisionId: string): Promise<void>
  continueSceneRun(projectId: string, sceneId: string): void
  switchSceneThread(projectId: string, sceneId: string, threadId: string): Promise<void>
  applySceneProposalAction(projectId: string, sceneId: string, action: 'accept' | 'edit-accept' | 'request-rewrite' | 'reject', input: ProposalActionInput): void
  startSceneRun(projectId: string, input: StartSceneRunInput): Promise<RunRecord>
  getRun(projectId: string, runId: string): RunRecord | null
  listRunArtifacts(projectId: string, runId: string): RunArtifactSummaryRecord[] | null
  getRunArtifact(projectId: string, runId: string, artifactId: string): RunArtifactDetailRecord | null
  getRunTrace(projectId: string, runId: string): RunTraceResponse | null
  getRunEvents(projectId: string, input: { runId: string; cursor?: string }): RunEventsPageRecord
  streamRunEvents(projectId: string, input: { runId: string; cursor?: string; signal?: AbortSignal }): AsyncIterable<RunEventsPageRecord>
  supportsRunEventStream(): boolean
  submitRunReviewDecision(projectId: string, input: SubmitRunReviewDecisionInput): Promise<RunRecord>
  exportSnapshot(): FixtureDataSnapshot
  resetProject(projectId: string): Promise<void>
  reset(): void
}

export interface FixtureRepositoryProjectStatePersistence {
  load(): Promise<{
    schemaVersion: number
    seedVersion: string
    projects: Record<string, {
      updatedAt: string
      reviewDecisions?: Record<string, unknown>
      reviewFixActions?: Record<string, unknown>
      exportArtifacts?: Record<string, unknown>
      chapters?: Record<string, unknown>
      scenes?: Record<string, unknown>
      runStore?: PersistedRunStore
    }>
  }>
  saveProjectOverlay(projectId: string, overlay: {
    updatedAt: string
    reviewDecisions?: Record<string, unknown>
    reviewFixActions?: Record<string, unknown>
    exportArtifacts?: Record<string, unknown>
    chapters?: Record<string, unknown>
    scenes?: Record<string, unknown>
    runStore?: PersistedRunStore
  }): Promise<void>
  clearProjectOverlay(projectId: string): Promise<void>
}

export interface FixtureRepositoryLocalProjectStore {
  load(): Promise<LocalProjectStoreRecord>
  save(input: {
    data: FixtureProjectData
    runStore?: PersistedRunStore
  }): Promise<LocalProjectStoreRecord>
  reset(): Promise<LocalProjectStoreRecord>
}

export function createFixtureRepository(options: {
  apiBaseUrl: string
  currentProject?: {
    projectId: string
    projectRoot?: string
    projectTitle: string
  }
  scenePlannerGateway: {
    generate(request: ScenePlannerGatewayRequest): Promise<ScenePlannerGatewayResult>
  }
  sceneProseWriterGateway?: {
    generate(request: SceneProseWriterGatewayRequest): Promise<SceneProseWriterGatewayResult>
  }
  localProjectStore?: FixtureRepositoryLocalProjectStore
  projectStatePersistence?: FixtureRepositoryProjectStatePersistence
  runEventStreamEnabled?: boolean
}): FixtureRepository {
  const sceneProseWriterGateway = options.sceneProseWriterGateway ?? createSceneProseWriterGateway({
    modelProvider: 'fixture',
  })
  const createSeedSnapshot = () => createFixtureDataSnapshot(options.apiBaseUrl)
  const createSeedRunStore = () => {
    const seedSnapshot = createSeedSnapshot()

    return createRunFixtureStore({
      scenePlannerGateway: options.scenePlannerGateway,
      sceneProseWriterGateway,
      runEventStreamEnabled: options.runEventStreamEnabled,
      buildSceneContextPacket: ({ projectId, sceneId, sequence }) => {
        const project = seedSnapshot.projects[projectId]
        if (!project) {
          throw notFound(`Project ${projectId} was not found.`, {
            code: 'PROJECT_NOT_FOUND',
            detail: { projectId },
          })
        }

        return buildSceneContextPacket({
          project,
          sceneId,
          sequence,
        })
      },
    })
  }

  let snapshot = createSeedSnapshot()
  const runStore: RunFixtureStore = createRunFixtureStore({
    scenePlannerGateway: options.scenePlannerGateway,
    sceneProseWriterGateway,
    runEventStreamEnabled: options.runEventStreamEnabled,
    buildSceneContextPacket: ({ projectId, sceneId, sequence }) => buildSceneContextPacket({
      project: getProject(projectId),
      sceneId,
      sequence,
    }),
  })
  let persistenceQueue = Promise.resolve()
  const selectedLocalProjectId = options.currentProject?.projectId

  function getProject(projectId: string): FixtureProjectData {
    const project = snapshot.projects[projectId]
    if (!project) {
      throw notFound(`Project ${projectId} was not found.`, {
        code: 'PROJECT_NOT_FOUND',
        detail: { projectId },
      })
    }

    return project
  }

  function enqueuePersistence(task: () => Promise<void>) {
    if (!options.localProjectStore && !options.projectStatePersistence) {
      return Promise.resolve()
    }

    const taskPromise = persistenceQueue
      .catch(() => undefined)
      .then(task)
    persistenceQueue = taskPromise.catch(() => undefined)
    return taskPromise
  }

  function applySelectedLocalProjectStore(record: LocalProjectStoreRecord) {
    snapshot.projects[record.project.projectId] = clone(record.project.data)
    if (record.runStore) {
      runStore.hydrateProjectState(record.project.projectId, record.runStore)
    }
  }

  function applyProjectOverlay(
    projectId: string,
    overlay: Awaited<ReturnType<FixtureRepositoryProjectStatePersistence['load']>>['projects'][string],
  ) {
    const project = getProject(projectId)

    if (overlay.reviewDecisions) {
      project.reviewDecisions = clone(overlay.reviewDecisions as unknown as FixtureProjectData['reviewDecisions'])
    }
    if (overlay.reviewFixActions) {
      project.reviewFixActions = clone(overlay.reviewFixActions as unknown as FixtureProjectData['reviewFixActions'])
    }
    if (overlay.exportArtifacts) {
      project.exportArtifacts = clone(overlay.exportArtifacts as unknown as FixtureProjectData['exportArtifacts'])
    }
    if (overlay.chapters) {
      project.chapters = clone(overlay.chapters as unknown as FixtureProjectData['chapters'])
    }
    if (overlay.scenes) {
      project.scenes = clone(overlay.scenes as unknown as FixtureProjectData['scenes'])
    }
    if (overlay.runStore) {
      runStore.hydrateProjectState(projectId, overlay.runStore)
    }
  }

  function buildProjectOverlay(
    projectId: string,
  ): Awaited<ReturnType<FixtureRepositoryProjectStatePersistence['load']>>['projects'][string] | undefined {
    const project = getProject(projectId)
    const seedProject = createSeedSnapshot().projects[projectId]
    const overlay: Awaited<ReturnType<FixtureRepositoryProjectStatePersistence['load']>>['projects'][string] = {
      updatedAt: new Date().toISOString(),
    }

    if (!seedProject || !jsonEquals(project.reviewDecisions, seedProject.reviewDecisions)) {
      overlay.reviewDecisions = toJsonClone(project.reviewDecisions as unknown as NonNullable<typeof overlay.reviewDecisions>)
    }
    if (!seedProject || !jsonEquals(project.reviewFixActions, seedProject.reviewFixActions)) {
      overlay.reviewFixActions = toJsonClone(project.reviewFixActions as unknown as NonNullable<typeof overlay.reviewFixActions>)
    }
    if (!seedProject || !jsonEquals(project.exportArtifacts, seedProject.exportArtifacts)) {
      overlay.exportArtifacts = toJsonClone(project.exportArtifacts as unknown as NonNullable<typeof overlay.exportArtifacts>)
    }
    if (!seedProject || !jsonEquals(project.chapters, seedProject.chapters)) {
      overlay.chapters = toJsonClone(project.chapters as unknown as NonNullable<typeof overlay.chapters>)
    }
    if (!seedProject || !jsonEquals(project.scenes, seedProject.scenes)) {
      overlay.scenes = toJsonClone(project.scenes as unknown as NonNullable<typeof overlay.scenes>)
    }

    const currentRunStore = runStore.exportProjectState(projectId)
    const seedRunStore = createSeedRunStore().exportProjectState(projectId)
    if (!jsonEquals(currentRunStore ?? null, seedRunStore ?? null) && currentRunStore) {
      overlay.runStore = toJsonClone(currentRunStore)
    }

    return Object.keys(overlay).length > 1 ? overlay : undefined
  }

  function persistProjectOverlay(projectId: string) {
    return enqueuePersistence(async () => {
      if (options.localProjectStore && selectedLocalProjectId === projectId) {
        const exportedRunStore = runStore.exportProjectState(projectId)
        await options.localProjectStore.save({
          data: toJsonClone(getProject(projectId)),
          runStore: exportedRunStore ? toJsonClone(exportedRunStore) : undefined,
        })
        return
      }

      if (!options.projectStatePersistence) {
        return
      }

      const overlay = buildProjectOverlay(projectId)
      if (overlay) {
        await options.projectStatePersistence.saveProjectOverlay(projectId, overlay)
        return
      }

      await options.projectStatePersistence.clearProjectOverlay(projectId)
    })
  }

  function resetProjectToSeed(projectId: string) {
    const nextSeedSnapshot = createSeedSnapshot()
    const nextProject = nextSeedSnapshot.projects[projectId]
    if (!nextProject) {
      throw notFound(`Project ${projectId} was not found.`, {
        code: 'PROJECT_NOT_FOUND',
        detail: { projectId },
      })
    }

    snapshot.projects[projectId] = clone(nextProject)
    runStore.clearProject(projectId)

    const seedRunSnapshot = createSeedRunStore().exportProjectState(projectId)
    if (seedRunSnapshot) {
      runStore.hydrateProjectState(projectId, seedRunSnapshot)
    }
  }

  const readyPromise = options.localProjectStore && selectedLocalProjectId
    ? options.localProjectStore.load().then((record) => {
      applySelectedLocalProjectStore(record)
    })
    : options.projectStatePersistence
      ? options.projectStatePersistence.load().then((envelope) => {
        for (const [projectId, overlay] of Object.entries(envelope.projects)) {
          applyProjectOverlay(projectId, overlay)
        }
      })
      : Promise.resolve()
  persistenceQueue = readyPromise

  function getBook(projectId: string, bookId: string) {
    return getProject(projectId).books[bookId] ?? null
  }

  function getChapter(projectId: string, chapterId: string) {
    return getProject(projectId).chapters[chapterId] ?? null
  }

  function getAsset(projectId: string, assetId: string) {
    return getProject(projectId).assets[assetId] ?? null
  }

  function getScene(projectId: string, sceneId: string) {
    const scene = getProject(projectId).scenes[sceneId]
    if (!scene) {
      throw notFound(`Scene ${sceneId} was not found.`, {
        code: 'SCENE_NOT_FOUND',
        detail: { projectId, sceneId },
      })
    }

    return scene
  }

  function runHasGeneratedProseArtifact(projectId: string, run: RunRecord) {
    if (run.scope !== 'scene' || run.status !== 'completed') {
      return false
    }

    return Boolean(findLatestArtifactDetail(projectId, run.id, 'prose-draft'))
  }

  function syncSceneSurfacesFromRun(projectId: string, run: RunRecord) {
    if (run.scope !== 'scene') {
      return
    }

    const scene = getScene(projectId, run.scopeId)
    const runStatus = mapRunStatusToSceneRunStatus(run.status)
    const hasGeneratedProseArtifact = runHasGeneratedProseArtifact(projectId, run)
    const sceneStatus = run.status === 'completed' && !hasGeneratedProseArtifact
      ? 'draft'
      : mapRunStatusToSceneStatus(run.status)
    const runHealth = mapRunStatusToRunHealth(run.status)

    scene.workspace.latestRunId = run.id
    scene.workspace.runStatus = runStatus
    scene.workspace.status = sceneStatus
    scene.workspace.currentVersionLabel = `Latest run ${run.id}`

    scene.execution.runId = run.id
    scene.execution.runtimeSummary.runHealth = runHealth
    scene.execution.runtimeSummary.latestFailureSummary = run.status === 'failed' ? run.summary : undefined
    scene.execution.canContinueRun = run.status === 'running' || run.status === 'queued'
    scene.execution.canOpenProse = run.status === 'completed' && hasGeneratedProseArtifact

    scene.inspector.runtime.runHealth = runHealth
    scene.inspector.runtime.latestFailure = run.status === 'failed' ? run.summary : undefined

    scene.dock.events = [
      {
        id: `run-status-${run.id}`,
        title: run.title,
        detail: run.summary,
        meta: run.id,
        tone: run.status === 'failed' ? 'danger' : run.status === 'waiting_review' ? 'accent' : 'success',
      },
      ...scene.dock.events.filter((entry) => entry.id !== `run-status-${run.id}`),
    ]
  }

  function syncChapterSceneMetadataFromRun(projectId: string, run: RunRecord) {
    if (run.scope !== 'scene') {
      return
    }

    const project = getProject(projectId)
    for (const [chapterId, chapter] of Object.entries(project.chapters)) {
      const sceneIndex = chapter.scenes.findIndex((scene) => scene.id === run.scopeId)
      if (sceneIndex < 0) {
        continue
      }

      const nextChapter = clone(chapter)
      nextChapter.scenes[sceneIndex] = {
        ...nextChapter.scenes[sceneIndex]!,
        backlogStatus: run.status === 'waiting_review'
          ? 'needs_review'
          : run.status === 'queued' || run.status === 'running'
            ? 'running'
            : nextChapter.scenes[sceneIndex]!.backlogStatus,
        runStatusLabel: mergeLocalizedText(nextChapter.scenes[sceneIndex]!.runStatusLabel, 'en', buildSceneRunStatusLabel(run)),
        lastRunLabel: mergeLocalizedText(nextChapter.scenes[sceneIndex]!.lastRunLabel, 'en', `Run ${run.id}`),
      }
      project.chapters[chapterId] = nextChapter
      return
    }
  }

  function findLatestArtifactDetail<TKind extends RunArtifactDetailRecord['kind']>(
    projectId: string,
    runId: string,
    kind: TKind,
  ): Extract<RunArtifactDetailRecord, { kind: TKind }> | undefined {
    const artifacts = runStore.listRunArtifacts(projectId, runId)
    if (!artifacts) {
      return undefined
    }

    for (let index = artifacts.length - 1; index >= 0; index -= 1) {
      const artifact = artifacts[index]
      if (artifact?.kind !== kind) {
        continue
      }

      const detail = runStore.getRunArtifact(projectId, runId, artifact.id)
      if (detail?.kind === kind) {
        return detail as Extract<RunArtifactDetailRecord, { kind: TKind }>
      }
    }

    return undefined
  }

  function findSceneRevisionSource(projectId: string, sceneId: string) {
    const scene = getScene(projectId, sceneId)
    const sourceCanonPatchId = scene.prose.traceSummary?.sourcePatchId?.trim()
    if (!sourceCanonPatchId) {
      return undefined
    }

    const currentSourceProseDraftId = scene.prose.traceSummary?.sourceProseDraftId?.trim()
    const currentContextPacketId = scene.prose.traceSummary?.contextPacketId?.trim()
    if (currentSourceProseDraftId && currentContextPacketId) {
      return {
        proseDraftId: currentSourceProseDraftId,
        sourceCanonPatchId,
        contextPacketId: currentContextPacketId,
      }
    }

    const projectRunState = runStore.exportProjectState(projectId)
    const matchedRunState = ((projectRunState?.runStates ?? []) as unknown[])
      .filter(isRevisionSourceRunStateCandidate)
      .find((candidate) => (
        candidate.run.scope === 'scene'
        && candidate.run.scopeId === sceneId
        && candidate.artifacts.some((artifact) => artifact.kind === 'canon-patch' && artifact.id === sourceCanonPatchId)
      ))

    if (!matchedRunState) {
      return undefined
    }

    const proseDraftArtifact = matchedRunState.artifacts.find((artifact) => artifact.kind === 'prose-draft')
    const contextPacketArtifact = matchedRunState.artifacts.find((artifact) => artifact.kind === 'context-packet')
    if (!proseDraftArtifact || !contextPacketArtifact) {
      return undefined
    }

    return {
      proseDraftId: proseDraftArtifact.id,
      sourceCanonPatchId,
      contextPacketId: contextPacketArtifact.id,
    }
  }

  function syncSceneRevisionTrace(sceneId: string, trace: SceneDockViewModel['trace'], detail: string, tone: 'accent' | 'success') {
    return [
      {
        id: `prose-revision-trace-${sceneId}`,
        title: 'Revision candidate trace',
        detail,
        meta: sceneId,
        tone,
      },
      ...trace.filter((entry) => entry.id !== `prose-revision-trace-${sceneId}`),
    ]
  }

  function syncChapterSceneProseStatus(projectId: string, sceneId: string, statusLabel: { en: string; 'zh-CN': string }) {
    const project = getProject(projectId)
    for (const [chapterId, chapter] of Object.entries(project.chapters)) {
      const sceneIndex = chapter.scenes.findIndex((scene) => scene.id === sceneId)
      if (sceneIndex < 0) {
        continue
      }

      const nextChapter = clone(chapter)
      nextChapter.scenes[sceneIndex] = {
        ...nextChapter.scenes[sceneIndex]!,
        proseStatusLabel: statusLabel,
      }
      project.chapters[chapterId] = nextChapter
      return
    }
  }

  function persistChapterSceneBacklogStatus(
    projectId: string,
    chapterId: string,
    sceneId: string,
    backlogStatus: ChapterSceneBacklogStatus,
  ) {
    const chapter = getChapter(projectId, chapterId)
    if (!chapter) {
      return null
    }

    const nextChapter = updateChapterRunSceneBacklogStatus(chapter, {
      sceneId,
      backlogStatus,
    })
    getProject(projectId).chapters[chapterId] = nextChapter
    return nextChapter
  }

  function syncSceneProseFromAcceptedRun(projectId: string, run: RunRecord, decision: SubmitRunReviewDecisionInput['decision']) {
    if (run.scope !== 'scene' || !isAcceptedRunDecision(decision)) {
      return
    }

    const proseDraft = findLatestArtifactDetail(projectId, run.id, 'prose-draft') as ProseDraftArtifactDetailRecord | undefined
    if (!proseDraft) {
      return
    }

    const canonPatch = findLatestArtifactDetail(projectId, run.id, 'canon-patch') as CanonPatchArtifactDetailRecord | undefined
    const proposalSet = findLatestArtifactDetail(projectId, run.id, 'proposal-set') as ProposalSetArtifactDetailRecord | undefined
    const scene = getScene(projectId, run.scopeId)
    const hadProseDraft = Boolean(scene.prose.proseDraft)
    const proseMaterialization = buildSceneProseFromProseDraftArtifact({
      proseDraft,
      canonPatch,
      proposalSet,
    })
    const acceptedFacts = buildAcceptedFactsFromCanonPatch(canonPatch)

    scene.prose = {
      ...scene.prose,
      ...proseMaterialization,
      revisionQueueCount: 0,
      revisionCandidate: undefined,
    }
    scene.execution.acceptedSummary = {
      ...scene.execution.acceptedSummary,
      acceptedFacts,
    }
    scene.inspector.context.acceptedFacts = acceptedFacts
    syncChapterSceneProseStatus(
      projectId,
      run.scopeId,
      hadProseDraft ? { en: 'Updated', 'zh-CN': '已更新' } : { en: 'Generated', 'zh-CN': '已生成' },
    )
    for (const [chapterId, chapter] of Object.entries(getProject(projectId).chapters)) {
      if (chapter.scenes.some((chapterScene) => chapterScene.id === run.scopeId)) {
        persistChapterSceneBacklogStatus(projectId, chapterId, run.scopeId, 'drafted')
        break
      }
    }
  }

  function syncSceneBacklogStatusFromReviewDecision(
    projectId: string,
    run: RunRecord,
    decision: SubmitRunReviewDecisionInput['decision'],
  ) {
    if (run.scope !== 'scene') {
      return
    }

    const nextBacklogStatus: ChapterSceneBacklogStatus | null = isAcceptedRunDecision(decision)
      ? 'drafted'
      : decision === 'request-rewrite' || decision === 'reject'
        ? 'planned'
        : null

    if (!nextBacklogStatus) {
      return
    }

    for (const [chapterId, chapter] of Object.entries(getProject(projectId).chapters)) {
      if (chapter.scenes.some((chapterScene) => chapterScene.id === run.scopeId)) {
        persistChapterSceneBacklogStatus(projectId, chapterId, run.scopeId, nextBacklogStatus)
        break
      }
    }
  }

  function syncRunMutations(projectId: string, run: RunRecord) {
    syncSceneSurfacesFromRun(projectId, run)
    syncChapterSceneMetadataFromRun(projectId, run)
  }

  function buildDraftAssemblyTraceRollup(sceneId: string, project: FixtureProjectData): BookDraftAssemblyTraceRollupRecord {
    const prose = project.scenes[sceneId]?.prose
    const traceSummary = prose?.traceSummary

    if (!traceSummary) {
      return {
        acceptedFactCount: 0,
        relatedAssetCount: 0,
        sourceProposalCount: 0,
        missingLinks: ['trace'],
      }
    }

    return {
      acceptedFactCount: traceSummary.acceptedFactIds?.length ?? 0,
      relatedAssetCount: traceSummary.relatedAssets?.length ?? 0,
      sourceProposalCount: traceSummary.sourceProposals?.length ?? 0,
      missingLinks: [...(traceSummary.missingLinks ?? [])],
    }
  }

  function buildDraftAssemblyGapReason(input: {
    hasSceneRecord: boolean
    hasConcreteDraft: boolean
  }) {
    if (!input.hasSceneRecord) {
      return localizedText('Scene prose read model is unavailable.', '场景正文读取模型当前不可用。')
    }

    if (!input.hasConcreteDraft) {
      return localizedText('No prose draft has been materialized for this scene yet.', '该场景尚未生成正文草稿。')
    }

    return localizedText('Scene prose is unavailable.', '场景正文当前不可用。')
  }

  function buildBookDraftAssemblySceneRecord(input: {
    scene: ChapterStructureWorkspaceRecord['scenes'][number]
    project: FixtureProjectData
  }): BookDraftAssemblySceneRecord {
    const sceneFixture = input.project.scenes[input.scene.id]
    const prose = sceneFixture?.prose
    const proseDraft = prose?.proseDraft
    const traceRollup = buildDraftAssemblyTraceRollup(input.scene.id, input.project)
    const draftWordCount = deriveDraftWordCount(proseDraft, prose?.draftWordCount)
    const hasConcreteDraft = hasConcreteProseDraft(proseDraft)
    const proseStatusLabel = hasConcreteDraft && prose?.statusLabel
      ? localizeCurrentSceneProseStatusLabel(prose.statusLabel)
      : input.scene.proseStatusLabel
    const common = {
      sceneId: input.scene.id,
      order: input.scene.order,
      title: clone(input.scene.title),
      summary: clone(input.scene.summary),
      proseStatusLabel: clone(proseStatusLabel),
      latestDiffSummary: prose?.latestDiffSummary,
      warningsCount: prose?.warningsCount ?? 0,
      revisionQueueCount: prose?.revisionQueueCount,
      draftWordCount,
      traceReady: !traceRollup.missingLinks.includes('trace'),
      traceRollup,
    }

    if (!sceneFixture || !hasConcreteDraft) {
      const gapRecord: BookDraftAssemblySceneGapRecord = {
        ...common,
        kind: 'gap',
        gapReason: buildDraftAssemblyGapReason({
          hasSceneRecord: Boolean(sceneFixture),
          hasConcreteDraft,
        }),
      }
      return gapRecord
    }

    return {
      ...common,
      kind: 'draft',
      proseDraft: proseDraft!.trim(),
      sourcePatchId: prose?.traceSummary?.sourcePatchId,
      sourceProposals: clone(prose?.traceSummary?.sourceProposals ?? []),
      acceptedFactIds: clone(prose?.traceSummary?.acceptedFactIds ?? []),
      relatedAssets: clone(prose?.traceSummary?.relatedAssets ?? []),
    }
  }

  function buildChapterDraftAssemblyTraceRollup(sceneId: string, project: FixtureProjectData): ChapterDraftAssemblyTraceRollupRecord {
    return buildDraftAssemblyTraceRollup(sceneId, project)
  }

  function buildChapterDraftAssemblyGapReason(input: {
    hasSceneRecord: boolean
    hasConcreteDraft: boolean
  }) {
    return buildDraftAssemblyGapReason(input)
  }

  function buildChapterDraftAssemblyTransitionGapReason() {
    return localizedText(
      'No artifact-backed transition draft has been materialized for this seam yet.',
      '这条接缝还没有生成带产物引用的过渡草稿。',
    )
  }

  function buildChapterDraftAssemblySceneRecord(input: {
    scene: ChapterStructureWorkspaceRecord['scenes'][number]
    project: FixtureProjectData
  }): ChapterDraftAssemblySceneRecord {
    const sceneFixture = input.project.scenes[input.scene.id]
    const prose = sceneFixture?.prose
    const proseDraft = prose?.proseDraft
    const traceRollup = buildChapterDraftAssemblyTraceRollup(input.scene.id, input.project)
    const draftWordCount = deriveDraftWordCount(proseDraft, prose?.draftWordCount)
    const hasConcreteDraft = hasConcreteProseDraft(proseDraft)
    const proseStatusLabel = prose?.statusLabel
      ? localizeCurrentSceneProseStatusLabel(prose.statusLabel)
      : input.scene.proseStatusLabel
    const common = {
      sceneId: input.scene.id,
      order: input.scene.order,
      title: clone(input.scene.title),
      summary: clone(input.scene.summary),
      backlogStatus: input.scene.backlogStatus,
      proseStatusLabel: clone(proseStatusLabel),
      latestDiffSummary: prose?.latestDiffSummary,
      warningsCount: prose?.warningsCount ?? 0,
      revisionQueueCount: prose?.revisionQueueCount,
      draftWordCount,
      traceReady: !traceRollup.missingLinks.includes('trace'),
      traceRollup,
    }

    if (!sceneFixture || !hasConcreteDraft) {
      const gapRecord: ChapterDraftAssemblySceneGapSectionRecord = {
        ...common,
        kind: 'scene-gap',
        gapReason: buildChapterDraftAssemblyGapReason({
          hasSceneRecord: Boolean(sceneFixture),
          hasConcreteDraft,
        }),
      }
      return gapRecord
    }

    return {
      ...common,
      kind: 'scene-draft',
      proseDraft: proseDraft!.trim(),
      sourcePatchId: prose?.traceSummary?.sourcePatchId,
      sourceProposals: clone(prose?.traceSummary?.sourceProposals ?? []),
      acceptedFactIds: clone(prose?.traceSummary?.acceptedFactIds ?? []),
      relatedAssets: clone(prose?.traceSummary?.relatedAssets ?? []),
    }
  }

  function buildChapterDraftAssemblyTransitionSection(input: {
    fromScene: ChapterDraftAssemblySceneRecord
    toScene: ChapterDraftAssemblySceneRecord
    transitionDraft?: {
      transitionProse?: string
      artifactId?: string
    }
  }): ChapterDraftAssemblyTransitionDraftSectionRecord | ChapterDraftAssemblyTransitionGapSectionRecord {
    const transitionProse = input.transitionDraft?.transitionProse?.trim()
    const artifactId = input.transitionDraft?.artifactId?.trim()

    if (transitionProse && artifactId) {
      return {
        kind: 'transition-draft',
        fromSceneId: input.fromScene.sceneId,
        toSceneId: input.toScene.sceneId,
        fromSceneTitle: clone(input.fromScene.title),
        toSceneTitle: clone(input.toScene.title),
        transitionProse,
        artifactRef: {
          kind: 'prose-draft',
          id: artifactId,
        },
      }
    }

    return {
      kind: 'transition-gap',
      fromSceneId: input.fromScene.sceneId,
      toSceneId: input.toScene.sceneId,
      fromSceneTitle: clone(input.fromScene.title),
      toSceneTitle: clone(input.toScene.title),
      gapReason: buildChapterDraftAssemblyTransitionGapReason(),
    }
  }

  function buildChapterDraftAssemblyRecord(input: {
    chapterId: string
    project: FixtureProjectData
  }): ChapterDraftAssemblyRecord | null {
    const chapter = input.project.chapters[input.chapterId]
    if (!chapter) {
      return null
    }

    const scenes = [...chapter.scenes]
      .sort((left, right) => left.order - right.order)
      .map((scene) => buildChapterDraftAssemblySceneRecord({
        scene,
        project: input.project,
      }))
    const sections: ChapterDraftAssemblySectionRecord[] = []
    for (const [index, scene] of scenes.entries()) {
      sections.push(scene)
      const nextScene = scenes[index + 1]
      if (!nextScene) {
        continue
      }

      sections.push(buildChapterDraftAssemblyTransitionSection({
        fromScene: scene,
        toScene: nextScene,
      }))
    }

    const draftedSceneCount = scenes.filter((scene) => scene.kind === 'scene-draft').length
    const warningsCount = scenes.reduce((total, scene) => total + scene.warningsCount, 0)
    const queuedRevisionCount = scenes.reduce((total, scene) => total + (scene.revisionQueueCount ?? 0), 0)
    const tracedSceneCount = scenes.filter((scene) => scene.traceReady).length
    const assembledWordCount = scenes.reduce((total, scene) => total + (scene.draftWordCount ?? 0), 0)

    return {
      chapterId: chapter.chapterId,
      title: clone(chapter.title),
      summary: clone(chapter.summary),
      sceneCount: scenes.length,
      draftedSceneCount,
      missingDraftCount: scenes.length - draftedSceneCount,
      assembledWordCount,
      warningsCount,
      queuedRevisionCount,
      tracedSceneCount,
      missingTraceSceneCount: scenes.length - tracedSceneCount,
      scenes,
      sections,
    }
  }

  function buildBookDraftAssemblyChapterRecordFromChapterAssembly(input: {
    chapterAssembly: ChapterDraftAssemblyRecord
    order: number
  }): BookDraftAssemblyChapterRecord {
    const scenes = input.chapterAssembly.scenes.map((scene) => {
      const common = {
        sceneId: scene.sceneId,
        order: scene.order,
        title: clone(scene.title),
        summary: clone(scene.summary),
        proseStatusLabel: clone(scene.proseStatusLabel),
        latestDiffSummary: scene.latestDiffSummary,
        warningsCount: scene.warningsCount,
        revisionQueueCount: scene.revisionQueueCount,
        draftWordCount: scene.draftWordCount,
        traceReady: scene.traceReady,
        traceRollup: clone(scene.traceRollup),
      }

      if (scene.kind === 'scene-gap') {
        const gapRecord: BookDraftAssemblySceneGapRecord = {
          ...common,
          kind: 'gap',
          gapReason: clone(scene.gapReason),
        }
        return gapRecord
      }

      return {
        ...common,
        kind: 'draft' as const,
        proseDraft: scene.proseDraft,
        sourcePatchId: scene.sourcePatchId,
        sourceProposals: clone(scene.sourceProposals),
        acceptedFactIds: clone(scene.acceptedFactIds),
        relatedAssets: clone(scene.relatedAssets),
      }
    })

    return {
      chapterId: input.chapterAssembly.chapterId,
      order: input.order,
      title: clone(input.chapterAssembly.title),
      summary: clone(input.chapterAssembly.summary),
      sceneCount: input.chapterAssembly.sceneCount,
      draftedSceneCount: input.chapterAssembly.draftedSceneCount,
      missingDraftCount: input.chapterAssembly.missingDraftCount,
      assembledWordCount: input.chapterAssembly.assembledWordCount,
      warningsCount: input.chapterAssembly.warningsCount,
      queuedRevisionCount: input.chapterAssembly.queuedRevisionCount,
      tracedSceneCount: input.chapterAssembly.tracedSceneCount,
      missingTraceSceneCount: input.chapterAssembly.missingTraceSceneCount,
      scenes,
    }
  }

  function formatBookDraftAssemblyChapterHeading(order: number, title: LocalizedTextRecord) {
    return `Chapter ${order}: ${title.en}`
  }

  function formatBookDraftAssemblySceneHeading(order: number, title: LocalizedTextRecord) {
    return `Scene ${order}: ${title.en}`
  }

  function buildBookDraftReadableManuscript(input: {
    book: BookStructureRecord
    chapters: Array<{
      order: number
      assembly: ChapterDraftAssemblyRecord
    }>
  }): BookDraftAssemblyReadableManuscriptRecord {
    const sections: BookDraftAssemblyManuscriptSectionRecord[] = []
    const sourceManifest: BookDraftAssemblySourceManifestEntryRecord[] = []
    const markdownLines = [`# ${input.book.title.en}`]
    const plainTextLines = [input.book.title.en]

    if (input.book.summary.en.trim()) {
      markdownLines.push('', input.book.summary.en.trim())
      plainTextLines.push('', input.book.summary.en.trim())
    }

    for (const chapter of input.chapters) {
      const chapterHeadingSection: BookDraftAssemblyChapterHeadingSectionRecord = {
        kind: 'chapter-heading',
        chapterId: chapter.assembly.chapterId,
        chapterOrder: chapter.order,
        chapterTitle: clone(chapter.assembly.title),
        summary: clone(chapter.assembly.summary),
        assembledWordCount: chapter.assembly.assembledWordCount,
        missingDraftCount: chapter.assembly.missingDraftCount,
      }
      sections.push(chapterHeadingSection)

      const chapterHeading = formatBookDraftAssemblyChapterHeading(chapter.order, chapter.assembly.title)
      markdownLines.push('', `## ${chapterHeading}`)
      plainTextLines.push('', chapterHeading)

      if (chapter.assembly.summary.en.trim()) {
        markdownLines.push('', chapter.assembly.summary.en.trim())
        plainTextLines.push(chapter.assembly.summary.en.trim())
      }

      for (const section of chapter.assembly.sections) {
        if (section.kind === 'scene-draft' || section.kind === 'scene-gap') {
          const manuscriptSection: BookDraftAssemblySceneManuscriptSectionRecord = {
            kind: section.kind,
            chapterId: chapter.assembly.chapterId,
            chapterOrder: chapter.order,
            chapterTitle: clone(chapter.assembly.title),
            sceneId: section.sceneId,
            sceneOrder: section.order,
            sceneTitle: clone(section.title),
            sceneSummary: clone(section.summary),
            proseDraft: section.kind === 'scene-draft' ? section.proseDraft : undefined,
            gapReason: section.kind === 'scene-gap' ? clone(section.gapReason) : undefined,
            draftWordCount: section.draftWordCount,
            traceReady: section.traceReady,
            sourcePatchId: section.kind === 'scene-draft' ? section.sourcePatchId : undefined,
            sourceProposalIds: section.kind === 'scene-draft'
              ? section.sourceProposals.map((proposal) => proposal.proposalId)
              : [],
            acceptedFactIds: section.kind === 'scene-draft' ? clone(section.acceptedFactIds) : [],
          }
          sections.push(manuscriptSection)
          sourceManifest.push({
            kind: section.kind,
            chapterId: chapter.assembly.chapterId,
            chapterOrder: chapter.order,
            chapterTitle: clone(chapter.assembly.title),
            sceneId: section.sceneId,
            sceneOrder: section.order,
            sceneTitle: clone(section.title),
            sourcePatchId: section.kind === 'scene-draft' ? section.sourcePatchId : undefined,
            sourceProposalIds: manuscriptSection.sourceProposalIds,
            acceptedFactIds: manuscriptSection.acceptedFactIds,
            traceReady: section.traceReady,
            draftWordCount: section.draftWordCount,
            gapReason: section.kind === 'scene-gap' ? clone(section.gapReason) : undefined,
          })

          const sceneHeading = formatBookDraftAssemblySceneHeading(section.order, section.title)
          markdownLines.push('', `### ${sceneHeading}`)
          plainTextLines.push('', sceneHeading)
          if (section.kind === 'scene-draft') {
            markdownLines.push('', section.proseDraft)
            plainTextLines.push(section.proseDraft)
          } else {
            markdownLines.push('', `> Manuscript gap: ${section.gapReason.en}`)
            plainTextLines.push(`[Manuscript gap] ${section.gapReason.en}`)
          }
          continue
        }

        const manuscriptSection: BookDraftAssemblyTransitionManuscriptSectionRecord = {
          kind: section.kind,
          chapterId: chapter.assembly.chapterId,
          chapterOrder: chapter.order,
          chapterTitle: clone(chapter.assembly.title),
          fromSceneId: section.fromSceneId,
          toSceneId: section.toSceneId,
          fromSceneTitle: clone(section.fromSceneTitle),
          toSceneTitle: clone(section.toSceneTitle),
          transitionProse: section.kind === 'transition-draft' ? section.transitionProse : undefined,
          artifactId: section.kind === 'transition-draft' ? section.artifactRef.id : undefined,
          gapReason: section.kind === 'transition-gap' ? clone(section.gapReason) : undefined,
        }
        sections.push(manuscriptSection)
        sourceManifest.push({
          kind: section.kind,
          chapterId: chapter.assembly.chapterId,
          chapterOrder: chapter.order,
          chapterTitle: clone(chapter.assembly.title),
          fromSceneId: section.fromSceneId,
          toSceneId: section.toSceneId,
          sourceProposalIds: [],
          acceptedFactIds: [],
          artifactId: section.kind === 'transition-draft' ? section.artifactRef.id : undefined,
          traceReady: section.kind === 'transition-draft',
          gapReason: section.kind === 'transition-gap' ? clone(section.gapReason) : undefined,
        })

        if (section.kind === 'transition-draft') {
          markdownLines.push('', section.transitionProse)
          plainTextLines.push('', section.transitionProse)
        } else {
          markdownLines.push('', `> Transition gap: ${section.gapReason.en}`)
          plainTextLines.push('', `[Transition gap] ${section.gapReason.en}`)
        }
      }
    }

    return {
      formatVersion: 'book-manuscript-assembly-v1',
      markdown: markdownLines.join('\n').trim(),
      plainText: plainTextLines.join('\n').trim(),
      sections,
      sourceManifest,
    }
  }

  return {
    whenReady() {
      return readyPromise
    },
    getProjectRuntimeInfo(projectId) {
      const runtimeInfo = clone(getProject(projectId).runtimeInfo)
      runtimeInfo.capabilities.runEventStream = runStore.supportsRunEventStream()
      return runtimeInfo
    },
    getBookStructure(projectId, bookId) {
      const record = getBook(projectId, bookId)
      return record ? clone(record) : null
    },
    getBookDraftAssembly(projectId, bookId) {
      const project = getProject(projectId)
      const book = project.books[bookId]
      if (!book) {
        return null
      }

      const chapterAssemblies = book.chapterIds.flatMap((chapterId, index) => {
        const assembly = buildChapterDraftAssemblyRecord({
          chapterId,
          project,
        })

        return assembly ? [{ order: index + 1, assembly }] : []
      })
      const chapters = chapterAssemblies.map(({ order, assembly }) =>
        buildBookDraftAssemblyChapterRecordFromChapterAssembly({
          chapterAssembly: assembly,
          order,
        }))
      const sceneCount = chapterAssemblies.reduce((total, chapter) => total + chapter.assembly.sceneCount, 0)
      const draftedSceneCount = chapterAssemblies.reduce((total, chapter) => total + chapter.assembly.draftedSceneCount, 0)
      const assembledWordCount = chapterAssemblies.reduce(
        (total, chapter) => total + chapter.assembly.assembledWordCount,
        0,
      )
      const readableManuscript = buildBookDraftReadableManuscript({
        book,
        chapters: chapterAssemblies,
      })

      return clone({
        bookId: book.bookId,
        title: book.title,
        summary: book.summary,
        chapterCount: chapters.length,
        sceneCount,
        draftedSceneCount,
        missingDraftSceneCount: sceneCount - draftedSceneCount,
        assembledWordCount,
        chapters,
        readableManuscript,
      })
    },
    getChapterDraftAssembly(projectId, chapterId) {
      return clone(buildChapterDraftAssemblyRecord({
        chapterId,
        project: getProject(projectId),
      }))
    },
    getBookManuscriptCheckpoints(projectId, bookId) {
      return clone(getProject(projectId).manuscriptCheckpoints[bookId] ?? [])
    },
    getBookManuscriptCheckpoint(projectId, bookId, checkpointId) {
      const record = (getProject(projectId).manuscriptCheckpoints[bookId] ?? []).find((item) => item.checkpointId === checkpointId)
      return record ? clone(record) : null
    },
    getBookExportProfiles(projectId, bookId) {
      return clone(getProject(projectId).exportProfiles[bookId] ?? [])
    },
    getBookExportProfile(projectId, bookId, exportProfileId) {
      const record = (getProject(projectId).exportProfiles[bookId] ?? []).find((item) => item.exportProfileId === exportProfileId)
      return record ? clone(record) : null
    },
    getBookExportArtifacts(projectId, { bookId, exportProfileId, checkpointId }) {
      const artifacts = getProject(projectId).exportArtifacts[bookId] ?? []
      return clone(
        artifacts.filter((artifact) => {
          if (exportProfileId && artifact.exportProfileId !== exportProfileId) {
            return false
          }
          if (checkpointId && artifact.checkpointId !== checkpointId) {
            return false
          }
          return true
        }),
      )
    },
    async createBookExportArtifact(projectId, input) {
      const project = getProject(projectId)
      const artifacts = project.exportArtifacts[input.bookId] ?? []
      const nextId = `artifact-${input.exportProfileId}-${String(artifacts.length + 1).padStart(3, '0')}`
      const record: BookExportArtifactRecord = {
        id: nextId,
        bookId: input.bookId,
        exportProfileId: input.exportProfileId,
        checkpointId: input.checkpointId,
        format: input.format,
        status: 'ready',
        filename: input.filename,
        mimeType: input.mimeType,
        title: input.title,
        summary: input.summary,
        content: input.content,
        sourceSignature: input.sourceSignature,
        chapterCount: input.chapterCount,
        sceneCount: input.sceneCount,
        wordCount: input.wordCount,
        readinessSnapshot: clone(input.readinessSnapshot),
        reviewGateSnapshot: clone(input.reviewGateSnapshot),
        createdAtLabel: '2026-04-23 10:12',
        createdByLabel: 'Fixture API server',
      }

      project.exportArtifacts[input.bookId] = [...artifacts, record]
      await persistProjectOverlay(projectId)
      return clone(record)
    },
    getBookExperimentBranches(projectId, bookId) {
      return clone(getProject(projectId).experimentBranches[bookId] ?? [])
    },
    getBookExperimentBranch(projectId, bookId, branchId) {
      const record = (getProject(projectId).experimentBranches[bookId] ?? []).find((item) => item.branchId === branchId)
      return record ? clone(record) : null
    },
    getChapterStructure(projectId, chapterId) {
      const record = getChapter(projectId, chapterId)
      return record ? clone(record) : null
    },
    async updateChapterBacklogPlanningInput(projectId, chapterId, input) {
      const record = getChapter(projectId, chapterId)
      if (!record) {
        return null
      }

      const nextRecord = patchChapterBacklogPlanning(record, input)
      getProject(projectId).chapters[chapterId] = nextRecord
      await persistProjectOverlay(projectId)
      return clone(nextRecord)
    },
    async generateChapterBacklogProposal(projectId, chapterId) {
      const record = getChapter(projectId, chapterId)
      if (!record) {
        return null
      }

      const proposal = createChapterBacklogProposal({
        chapterId,
        proposalSequence: record.planning.proposals.length + 1,
        planning: record.planning,
        scenes: record.scenes,
      })
      const nextRecord: ChapterStructureWorkspaceRecord = {
        ...record,
        planning: {
          ...record.planning,
          proposals: [...record.planning.proposals, proposal],
        },
      }

      getProject(projectId).chapters[chapterId] = nextRecord
      await persistProjectOverlay(projectId)
      return clone(nextRecord)
    },
    async updateChapterBacklogProposalScene(projectId, { chapterId, proposalId, proposalSceneId, patch }) {
      const record = getChapter(projectId, chapterId)
      if (!record || !record.planning.proposals.some((proposal) => proposal.proposalId === proposalId)) {
        return null
      }

      const nextRecord = patchChapterBacklogProposalScene(record, proposalId, proposalSceneId, patch)
      getProject(projectId).chapters[chapterId] = nextRecord
      await persistProjectOverlay(projectId)
      return clone(nextRecord)
    },
    async acceptChapterBacklogProposal(projectId, { chapterId, proposalId }) {
      const record = getChapter(projectId, chapterId)
      if (!record || !record.planning.proposals.some((proposal) => proposal.proposalId === proposalId)) {
        return null
      }

      const nextRecord = applyAcceptedChapterBacklogProposal(record, proposalId)
      getProject(projectId).chapters[chapterId] = nextRecord
      await persistProjectOverlay(projectId)
      return clone(nextRecord)
    },
    async startNextChapterSceneRun(projectId, chapterId, input) {
      const chapter = getChapter(projectId, chapterId)
      if (!chapter) {
        return null
      }

      const nextScene = resolveNextChapterRunScene(chapter)
      if (!nextScene.ok) {
        if (nextScene.code === CHAPTER_RUN_REVIEW_GATE_BLOCKED) {
          throw conflict('Chapter run is blocked by a scene waiting for review.', {
            code: CHAPTER_RUN_REVIEW_GATE_BLOCKED,
            detail: { projectId, chapterId, blockingSceneId: nextScene.blockingSceneId },
          })
        }

        throw conflict('Chapter run cannot start because no accepted runnable scene is available.', {
          code: nextScene.code,
          detail: { projectId, chapterId },
        })
      }

      persistChapterSceneBacklogStatus(projectId, chapterId, nextScene.scene.sceneId, 'running')
      const run = await runStore.startSceneRun(projectId, {
        sceneId: nextScene.scene.sceneId,
        mode: input.mode,
        note: input.note,
      })
      syncRunMutations(projectId, run)
      const chapterAfterRun = persistChapterSceneBacklogStatus(
        projectId,
        chapterId,
        nextScene.scene.sceneId,
        run.status === 'waiting_review' ? 'needs_review' : 'running',
      )
      await persistProjectOverlay(projectId)

      return {
        chapter: clone(chapterAfterRun ?? getChapter(projectId, chapterId)!),
        run,
        selectedScene: nextScene.scene,
      }
    },
    async reorderChapterScene(projectId, { chapterId, sceneId, targetIndex }) {
      const record = getChapter(projectId, chapterId)
      if (!record) {
        return null
      }

      const nextRecord = reorderChapterRecordScenes(record, sceneId, targetIndex)
      getProject(projectId).chapters[chapterId] = nextRecord
      await persistProjectOverlay(projectId)
      return clone(nextRecord)
    },
    async updateChapterSceneStructure(projectId, { chapterId, sceneId, locale, patch }) {
      const record = getChapter(projectId, chapterId)
      if (!record) {
        return null
      }

      const nextRecord = patchChapterRecordScene(record, sceneId, patch, locale)
      getProject(projectId).chapters[chapterId] = nextRecord
      await persistProjectOverlay(projectId)
      return clone(nextRecord)
    },
    getAssetKnowledge(projectId, assetId) {
      const record = getAsset(projectId, assetId)
      return record ? clone(record) : null
    },
    getReviewDecisions(projectId, bookId) {
      return clone(getProject(projectId).reviewDecisions[bookId] ?? [])
    },
    async setReviewDecision(projectId, input) {
      const project = getProject(projectId)
      const bucket = project.reviewDecisions[input.bookId] ?? []
      const record: ReviewIssueDecisionRecord = {
        id: createReviewDecisionRecordId(input.bookId, input.issueId),
        bookId: input.bookId,
        issueId: input.issueId,
        issueSignature: input.issueSignature,
        status: input.status,
        note: trimNote(input.note),
        updatedAtLabel: '2026-04-23 10:05',
        updatedByLabel: 'Fixture API server',
      }
      project.reviewDecisions[input.bookId] = [...bucket.filter((item) => item.issueId !== input.issueId), record]
      await persistProjectOverlay(projectId)
      return clone(record)
    },
    async clearReviewDecision(projectId, { bookId, issueId }) {
      const project = getProject(projectId)
      const bucket = project.reviewDecisions[bookId] ?? []
      project.reviewDecisions[bookId] = bucket.filter((item) => item.issueId !== issueId)
      await persistProjectOverlay(projectId)
    },
    getReviewFixActions(projectId, bookId) {
      return clone(getProject(projectId).reviewFixActions[bookId] ?? [])
    },
    async setReviewFixAction(projectId, input) {
      const project = getProject(projectId)
      const bucket = project.reviewFixActions[input.bookId] ?? []
      const existing = bucket.find((item) => item.issueId === input.issueId)
      const record: ReviewIssueFixActionRecord = {
        id: createReviewFixActionRecordId(input.bookId, input.issueId),
        bookId: input.bookId,
        issueId: input.issueId,
        issueSignature: input.issueSignature,
        sourceHandoffId: input.sourceHandoffId,
        sourceHandoffLabel: input.sourceHandoffLabel,
        targetScope: input.targetScope,
        status: input.status,
        note: trimNote(input.note),
        startedAtLabel: existing?.startedAtLabel ?? '2026-04-23 10:06',
        updatedAtLabel: '2026-04-23 10:07',
        updatedByLabel: 'Fixture API server',
      }
      project.reviewFixActions[input.bookId] = [...bucket.filter((item) => item.issueId !== input.issueId), record]
      await persistProjectOverlay(projectId)
      return clone(record)
    },
    async clearReviewFixAction(projectId, { bookId, issueId }) {
      const project = getProject(projectId)
      const bucket = project.reviewFixActions[bookId] ?? []
      project.reviewFixActions[bookId] = bucket.filter((item) => item.issueId !== issueId)
      await persistProjectOverlay(projectId)
    },
    getSceneWorkspace(projectId, sceneId) {
      return clone(getScene(projectId, sceneId).workspace)
    },
    getSceneSetup(projectId, sceneId) {
      return clone(getScene(projectId, sceneId).setup)
    },
    async updateSceneSetup(projectId, sceneId, setup) {
      const scene = getScene(projectId, sceneId)
      scene.setup = clone(setup)
      scene.workspace.title = setup.identity.title
      await persistProjectOverlay(projectId)
    },
    getSceneExecution(projectId, sceneId) {
      return clone(getScene(projectId, sceneId).execution)
    },
    getSceneProse(projectId, sceneId) {
      return clone(getScene(projectId, sceneId).prose)
    },
    getSceneInspector(projectId, sceneId) {
      return clone(getScene(projectId, sceneId).inspector)
    },
    getSceneDockSummary(projectId, sceneId) {
      return clone(getScene(projectId, sceneId).dock)
    },
    getSceneDockTab(projectId, sceneId, tab) {
      const dock = getScene(projectId, sceneId).dock
      switch (tab) {
        case 'events':
          return { events: clone(dock.events) }
        case 'trace':
          return { trace: clone(dock.trace) }
        case 'consistency':
          return { consistency: clone(dock.consistency) }
        case 'problems':
          return { problems: clone(dock.problems) }
        case 'cost':
          return { cost: clone(dock.cost) }
      }
    },
    getScenePatchPreview(projectId, sceneId) {
      return clone(getScene(projectId, sceneId).patchPreview)
    },
    commitScenePatch(_projectId, _sceneId, _patchId) {},
    async reviseSceneProse(projectId, sceneId, input) {
      const scene = getScene(projectId, sceneId)
      if (!scene.prose.proseDraft) {
        throw conflict(`Scene ${sceneId} requires a prose draft before revision can be requested.`, {
          code: 'SCENE_PROSE_REVISION_DRAFT_REQUIRED',
          detail: { projectId, sceneId, revisionMode: input.revisionMode },
        })
      }

      const source = findSceneRevisionSource(projectId, sceneId)
      if (!source) {
        throw conflict(`Scene ${sceneId} requires prose source artifacts before revision can be requested.`, {
          code: 'SCENE_PROSE_REVISION_SOURCE_REQUIRED',
          detail: { projectId, sceneId, revisionMode: input.revisionMode },
        })
      }

      const trimmedInstruction = trimProseRevisionInstruction(input.instruction)
      const writerResult = await sceneProseWriterGateway.generate({
        task: 'revision',
        sceneId,
        decision: 'accept',
        acceptedProposalIds: scene.prose.traceSummary?.sourceProposals?.map((proposal) => proposal.proposalId) ?? [],
        revisionMode: input.revisionMode,
        currentProse: scene.prose.proseDraft,
        sourceProseDraftId: source.proseDraftId,
        sourceCanonPatchId: source.sourceCanonPatchId,
        contextPacketId: source.contextPacketId,
        ...(trimmedInstruction ? { instruction: trimmedInstruction } : {}),
        instructions: 'Return only the revised scene prose and a short diff summary.',
        input: [
          `Scene: ${sceneId}.`,
          `Revision mode: ${input.revisionMode}.`,
          `Current prose: ${scene.prose.proseDraft}`,
          `Source prose draft: ${source.proseDraftId}.`,
          `Source canon patch: ${source.sourceCanonPatchId}.`,
          `Context packet: ${source.contextPacketId}.`,
          trimmedInstruction ? `Editorial instruction: ${trimmedInstruction}.` : 'Editorial instruction: none.',
        ].join(' '),
      })

      scene.prose = applySceneProseRevisionCandidate({
        prose: scene.prose,
        revisionId: randomUUID(),
        revisionMode: input.revisionMode,
        instruction: trimmedInstruction,
        output: writerResult.output,
        sourceProseDraftId: source.proseDraftId,
        sourceCanonPatchId: source.sourceCanonPatchId,
        contextPacketId: source.contextPacketId,
        provenance: writerResult.provenance,
      })
      syncChapterSceneProseStatus(projectId, sceneId, { en: 'Revision candidate ready', 'zh-CN': '修订候选已就绪' })

      const revisionModeLabel = buildRevisionModeLabel(input.revisionMode)
      scene.dock.events = [
        {
          id: `prose-revision-${sceneId}`,
          title: 'Prose revision candidate ready',
          detail: `The ${revisionModeLabel} revision candidate is ready to compare against the current prose.`,
          meta: scene.prose.revisionCandidate?.revisionId,
          tone: 'accent',
        },
        ...scene.dock.events.filter((entry) => entry.id !== `prose-revision-${sceneId}`),
      ]
      scene.dock.trace = syncSceneRevisionTrace(
        sceneId,
        scene.dock.trace,
        `Candidate ${scene.prose.revisionCandidate?.revisionId} derives from ${source.proseDraftId}, ${source.sourceCanonPatchId}, and ${source.contextPacketId}.`,
        'accent',
      )
      await persistProjectOverlay(projectId)
    },
    async acceptSceneProseRevision(projectId, sceneId, revisionId) {
      const scene = getScene(projectId, sceneId)
      const candidate = scene.prose.revisionCandidate
      if (!candidate || candidate.revisionId !== revisionId) {
        throw conflict(`Scene ${sceneId} does not have revision candidate ${revisionId}.`, {
          code: 'SCENE_PROSE_REVISION_NOT_FOUND',
          detail: { projectId, sceneId, revisionId },
        })
      }

      scene.prose = acceptSceneProseRevisionCandidate({
        prose: scene.prose,
      })
      syncChapterSceneProseStatus(projectId, sceneId, { en: 'Updated', 'zh-CN': '已更新' })
      scene.dock.events = [
        {
          id: `prose-revision-${sceneId}`,
          title: 'Prose revision accepted',
          detail: `Revision candidate ${revisionId} has been promoted into the current prose draft.`,
          meta: revisionId,
          tone: 'success',
        },
        ...scene.dock.events.filter((entry) => entry.id !== `prose-revision-${sceneId}`),
      ]
      scene.dock.trace = syncSceneRevisionTrace(
        sceneId,
        scene.dock.trace,
        `Accepted revision ${revisionId} promoted prose from ${candidate.sourceProseDraftId} with canon patch ${candidate.sourceCanonPatchId}.`,
        'success',
      )
      await persistProjectOverlay(projectId)
    },
    continueSceneRun(_projectId, _sceneId) {},
    async switchSceneThread(projectId, sceneId, threadId) {
      const scene = getScene(projectId, sceneId)
      const hasThread = scene.workspace.availableThreads.some((item) => item.id === threadId)
      if (hasThread) {
        scene.workspace.activeThreadId = threadId
        await persistProjectOverlay(projectId)
      }
    },
    applySceneProposalAction(_projectId, _sceneId, _action, _input) {},
    async startSceneRun(projectId, input) {
      getScene(projectId, input.sceneId)
      const run = await runStore.startSceneRun(projectId, input)
      syncRunMutations(projectId, run)
      await persistProjectOverlay(projectId)
      return run
    },
    getRun(projectId, runId) {
      return runStore.getRun(projectId, runId)
    },
    listRunArtifacts(projectId, runId) {
      return runStore.listRunArtifacts(projectId, runId)
    },
    getRunArtifact(projectId, runId, artifactId) {
      return runStore.getRunArtifact(projectId, runId, artifactId)
    },
    getRunTrace(projectId, runId) {
      return runStore.getRunTrace(projectId, runId)
    },
    getRunEvents(projectId, input) {
      return runStore.getRunEvents(projectId, input)
    },
    streamRunEvents(projectId, input) {
      return runStore.streamRunEvents(projectId, input)
    },
    supportsRunEventStream() {
      return runStore.supportsRunEventStream()
    },
    async submitRunReviewDecision(projectId, input) {
      const run = await runStore.submitRunReviewDecision(projectId, input)
      syncRunMutations(projectId, run)
      syncSceneBacklogStatusFromReviewDecision(projectId, run, input.decision)
      syncSceneProseFromAcceptedRun(projectId, run, input.decision)
      await persistProjectOverlay(projectId)
      return run
    },
    exportSnapshot() {
      return clone(snapshot)
    },
    async resetProject(projectId) {
      if (options.localProjectStore && selectedLocalProjectId === projectId) {
        await enqueuePersistence(async () => {
          const resetRecord = await options.localProjectStore!.reset()
          snapshot.projects[projectId] = clone(resetRecord.project.data)
          runStore.clearProject(projectId)
          if (resetRecord.runStore) {
            runStore.hydrateProjectState(projectId, resetRecord.runStore)
            return
          }

          const seedRunSnapshot = createSeedRunStore().exportProjectState(projectId)
          if (seedRunSnapshot) {
            runStore.hydrateProjectState(projectId, seedRunSnapshot)
          }
        })
        return
      }

      resetProjectToSeed(projectId)
      if (options.projectStatePersistence) {
        await enqueuePersistence(async () => {
          await options.projectStatePersistence!.clearProjectOverlay(projectId)
        })
      }
    },
    reset() {
      snapshot = createSeedSnapshot()
      runStore.reset()
    },
  }
}
