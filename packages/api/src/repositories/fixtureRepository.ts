import type {
  AssetKnowledgeWorkspaceRecord,
  BookDraftAssemblyChapterRecord,
  BookDraftAssemblyRecord,
  BookDraftAssemblySceneGapRecord,
  BookDraftAssemblySceneRecord,
  BookDraftAssemblyTraceRollupRecord,
  BookExperimentBranchRecord,
  BookExportArtifactRecord,
  BookExportProfileRecord,
  BookManuscriptCheckpointRecord,
  BookStructureRecord,
  BuildBookExportArtifactInput,
  ChapterSceneStructurePatch,
  ChapterStructureSceneRecord,
  ChapterStructureWorkspaceRecord,
  FixtureDataSnapshot,
  FixtureProjectData,
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
  StartSceneRunInput,
  SubmitRunReviewDecisionInput,
} from '../contracts/api-records.js'
import { conflict, notFound } from '../http/errors.js'
import type {
  ScenePlannerGatewayRequest,
  ScenePlannerGatewayResult,
} from '../orchestration/modelGateway/scenePlannerGateway.js'
import {
  buildAcceptedFactsFromCanonPatch,
  buildSceneProseFromProseDraftArtifact,
} from '../orchestration/sceneRun/sceneRunProseMaterialization.js'
import { applySceneProseRevisionRequest } from '../orchestration/sceneRun/sceneRunProseRevision.js'

import { createFixtureDataSnapshot } from './fixture-data.js'
import type {
  PersistedProjectStateEnvelope,
  PersistedProjectStateOverlay,
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
    case 'Revision queued':
      return localizedText(statusLabel, '修订已排队')
    case 'Ready for revision pass':
      return localizedText(statusLabel, '可进入修订轮')
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
      return 'Run awaiting review'
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

export interface FixtureRepository {
  whenReady(): Promise<void>
  getProjectRuntimeInfo(projectId: string): ProjectRuntimeInfoRecord
  getBookStructure(projectId: string, bookId: string): BookStructureRecord | null
  getBookDraftAssembly(projectId: string, bookId: string): BookDraftAssemblyRecord | null
  getBookManuscriptCheckpoints(projectId: string, bookId: string): BookManuscriptCheckpointRecord[]
  getBookManuscriptCheckpoint(projectId: string, bookId: string, checkpointId: string): BookManuscriptCheckpointRecord | null
  getBookExportProfiles(projectId: string, bookId: string): BookExportProfileRecord[]
  getBookExportProfile(projectId: string, bookId: string, exportProfileId: string): BookExportProfileRecord | null
  getBookExportArtifacts(projectId: string, input: { bookId: string; exportProfileId?: string; checkpointId?: string }): BookExportArtifactRecord[]
  createBookExportArtifact(projectId: string, input: BuildBookExportArtifactInput): Promise<BookExportArtifactRecord>
  getBookExperimentBranches(projectId: string, bookId: string): BookExperimentBranchRecord[]
  getBookExperimentBranch(projectId: string, bookId: string, branchId: string): BookExperimentBranchRecord | null
  getChapterStructure(projectId: string, chapterId: string): ChapterStructureWorkspaceRecord | null
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
  reviseSceneProse(projectId: string, sceneId: string, revisionMode: SceneProseViewModel['revisionModes'][number]): Promise<void>
  continueSceneRun(projectId: string, sceneId: string): void
  switchSceneThread(projectId: string, sceneId: string, threadId: string): Promise<void>
  applySceneProposalAction(projectId: string, sceneId: string, action: 'accept' | 'edit-accept' | 'request-rewrite' | 'reject', input: ProposalActionInput): void
  startSceneRun(projectId: string, input: StartSceneRunInput): Promise<RunRecord>
  getRun(projectId: string, runId: string): RunRecord | null
  listRunArtifacts(projectId: string, runId: string): RunArtifactSummaryRecord[] | null
  getRunArtifact(projectId: string, runId: string, artifactId: string): RunArtifactDetailRecord | null
  getRunTrace(projectId: string, runId: string): RunTraceResponse | null
  getRunEvents(projectId: string, input: { runId: string; cursor?: string }): RunEventsPageRecord
  submitRunReviewDecision(projectId: string, input: SubmitRunReviewDecisionInput): Promise<RunRecord>
  exportSnapshot(): FixtureDataSnapshot
  resetProject(projectId: string): Promise<void>
  reset(): void
}

export interface FixtureRepositoryProjectStatePersistence {
  load(): Promise<PersistedProjectStateEnvelope>
  saveProjectOverlay(projectId: string, overlay: PersistedProjectStateOverlay): Promise<void>
  clearProjectOverlay(projectId: string): Promise<void>
}

export function createFixtureRepository(options: {
  apiBaseUrl: string
  scenePlannerGateway: {
    generate(request: ScenePlannerGatewayRequest): Promise<ScenePlannerGatewayResult>
  }
  projectStatePersistence?: FixtureRepositoryProjectStatePersistence
}): FixtureRepository {
  const createSeedSnapshot = () => createFixtureDataSnapshot(options.apiBaseUrl)
  const createSeedRunStore = () => createRunFixtureStore({
    scenePlannerGateway: options.scenePlannerGateway,
  })

  let snapshot = createSeedSnapshot()
  const runStore: RunFixtureStore = createRunFixtureStore({
    scenePlannerGateway: options.scenePlannerGateway,
  })
  let persistenceQueue = Promise.resolve()

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
    if (!options.projectStatePersistence) {
      return Promise.resolve()
    }

    const taskPromise = persistenceQueue
      .catch(() => undefined)
      .then(task)
    persistenceQueue = taskPromise.catch(() => undefined)
    return taskPromise
  }

  function applyProjectOverlay(projectId: string, overlay: PersistedProjectStateOverlay) {
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

  function buildProjectOverlay(projectId: string): PersistedProjectStateOverlay | undefined {
    const project = getProject(projectId)
    const seedProject = createSeedSnapshot().projects[projectId]
    const overlay: PersistedProjectStateOverlay = {
      updatedAt: new Date().toISOString(),
    }

    if (!seedProject || !jsonEquals(project.reviewDecisions, seedProject.reviewDecisions)) {
      overlay.reviewDecisions = toJsonClone(project.reviewDecisions as unknown as PersistedProjectStateOverlay['reviewDecisions'])
    }
    if (!seedProject || !jsonEquals(project.reviewFixActions, seedProject.reviewFixActions)) {
      overlay.reviewFixActions = toJsonClone(project.reviewFixActions as unknown as PersistedProjectStateOverlay['reviewFixActions'])
    }
    if (!seedProject || !jsonEquals(project.exportArtifacts, seedProject.exportArtifacts)) {
      overlay.exportArtifacts = toJsonClone(project.exportArtifacts as unknown as PersistedProjectStateOverlay['exportArtifacts'])
    }
    if (!seedProject || !jsonEquals(project.chapters, seedProject.chapters)) {
      overlay.chapters = toJsonClone(project.chapters as unknown as PersistedProjectStateOverlay['chapters'])
    }
    if (!seedProject || !jsonEquals(project.scenes, seedProject.scenes)) {
      overlay.scenes = toJsonClone(project.scenes as unknown as PersistedProjectStateOverlay['scenes'])
    }

    const currentRunStore = runStore.exportProjectState(projectId)
    const seedRunStore = createSeedRunStore().exportProjectState(projectId)
    if (!jsonEquals(currentRunStore ?? null, seedRunStore ?? null) && currentRunStore) {
      overlay.runStore = toJsonClone(currentRunStore)
    }

    return Object.keys(overlay).length > 1 ? overlay : undefined
  }

  function persistProjectOverlay(projectId: string) {
    if (!options.projectStatePersistence) {
      return Promise.resolve()
    }

    return enqueuePersistence(async () => {
      const overlay = buildProjectOverlay(projectId)
      if (overlay) {
        await options.projectStatePersistence!.saveProjectOverlay(projectId, overlay)
        return
      }

      await options.projectStatePersistence!.clearProjectOverlay(projectId)
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

  const readyPromise = options.projectStatePersistence
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

  function buildBookDraftAssemblyChapterRecord(input: {
    chapterId: string
    order: number
    project: FixtureProjectData
  }): BookDraftAssemblyChapterRecord | null {
    const chapter = input.project.chapters[input.chapterId]
    if (!chapter) {
      return null
    }

    const scenes = [...chapter.scenes]
      .sort((left, right) => left.order - right.order)
      .map((scene) => buildBookDraftAssemblySceneRecord({
        scene,
        project: input.project,
      }))
    const draftedSceneCount = scenes.filter((scene) => scene.kind === 'draft').length
    const missingDraftCount = scenes.length - draftedSceneCount
    const warningsCount = scenes.reduce((total, scene) => total + scene.warningsCount, 0)
    const queuedRevisionCount = scenes.reduce((total, scene) => total + (scene.revisionQueueCount ?? 0), 0)
    const tracedSceneCount = scenes.filter((scene) => scene.traceReady).length
    const assembledWordCount = scenes.reduce((total, scene) => total + (scene.draftWordCount ?? 0), 0)

    return {
      chapterId: chapter.chapterId,
      order: input.order,
      title: clone(chapter.title),
      summary: clone(chapter.summary),
      sceneCount: scenes.length,
      draftedSceneCount,
      missingDraftCount,
      assembledWordCount,
      warningsCount,
      queuedRevisionCount,
      tracedSceneCount,
      missingTraceSceneCount: scenes.length - tracedSceneCount,
      scenes,
    }
  }

  return {
    whenReady() {
      return readyPromise
    },
    getProjectRuntimeInfo(projectId) {
      return clone(getProject(projectId).runtimeInfo)
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

      const chapters = book.chapterIds.flatMap((chapterId, index) => {
        const chapterRecord = buildBookDraftAssemblyChapterRecord({
          chapterId,
          order: index + 1,
          project,
        })

        return chapterRecord ? [chapterRecord] : []
      })
      const sceneCount = chapters.reduce((total, chapter) => total + chapter.sceneCount, 0)
      const draftedSceneCount = chapters.reduce((total, chapter) => total + chapter.draftedSceneCount, 0)
      const assembledWordCount = chapters.reduce((total, chapter) => total + chapter.assembledWordCount, 0)

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
      })
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
    async reviseSceneProse(projectId, sceneId, revisionMode) {
      const scene = getScene(projectId, sceneId)
      if (!scene.prose.proseDraft) {
        throw conflict(`Scene ${sceneId} requires a prose draft before revision can be requested.`, {
          code: 'SCENE_PROSE_REVISION_DRAFT_REQUIRED',
          detail: { projectId, sceneId, revisionMode },
        })
      }

      scene.prose = applySceneProseRevisionRequest({
        prose: scene.prose,
        revisionMode,
      })
      syncChapterSceneProseStatus(projectId, sceneId, { en: 'Revision queued', 'zh-CN': '修订已排队' })

      const revisionModeLabel = buildRevisionModeLabel(revisionMode)
      scene.dock.events = [
        {
          id: `prose-revision-${sceneId}`,
          title: 'Prose revision queued',
          detail: `The ${revisionModeLabel} revision request is waiting for review.`,
          meta: `Queue ${scene.prose.revisionQueueCount ?? 0}`,
          tone: 'accent',
        },
        ...scene.dock.events.filter((entry) => entry.id !== `prose-revision-${sceneId}`),
      ]
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
    async submitRunReviewDecision(projectId, input) {
      const run = runStore.submitRunReviewDecision(projectId, input)
      syncRunMutations(projectId, run)
      syncSceneProseFromAcceptedRun(projectId, run, input.decision)
      await persistProjectOverlay(projectId)
      return run
    },
    exportSnapshot() {
      return clone(snapshot)
    },
    async resetProject(projectId) {
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
