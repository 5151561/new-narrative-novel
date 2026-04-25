import type {
  AssetKnowledgeWorkspaceRecord,
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
import { notFound } from '../http/errors.js'
import {
  buildAcceptedFactsFromCanonPatch,
  buildSceneProseFromProseDraftArtifact,
} from '../orchestration/sceneRun/sceneRunProseMaterialization.js'

import { createFixtureDataSnapshot } from './fixture-data.js'
import { createRunFixtureStore, type RunFixtureStore } from './runFixtureStore.js'

function clone<T>(value: T): T {
  return structuredClone(value)
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

export interface FixtureRepository {
  getProjectRuntimeInfo(projectId: string): ProjectRuntimeInfoRecord
  getBookStructure(projectId: string, bookId: string): BookStructureRecord | null
  getBookManuscriptCheckpoints(projectId: string, bookId: string): BookManuscriptCheckpointRecord[]
  getBookManuscriptCheckpoint(projectId: string, bookId: string, checkpointId: string): BookManuscriptCheckpointRecord | null
  getBookExportProfiles(projectId: string, bookId: string): BookExportProfileRecord[]
  getBookExportProfile(projectId: string, bookId: string, exportProfileId: string): BookExportProfileRecord | null
  getBookExportArtifacts(projectId: string, input: { bookId: string; exportProfileId?: string; checkpointId?: string }): BookExportArtifactRecord[]
  createBookExportArtifact(projectId: string, input: BuildBookExportArtifactInput): BookExportArtifactRecord
  getBookExperimentBranches(projectId: string, bookId: string): BookExperimentBranchRecord[]
  getBookExperimentBranch(projectId: string, bookId: string, branchId: string): BookExperimentBranchRecord | null
  getChapterStructure(projectId: string, chapterId: string): ChapterStructureWorkspaceRecord | null
  reorderChapterScene(projectId: string, input: { chapterId: string; sceneId: string; targetIndex: number }): ChapterStructureWorkspaceRecord | null
  updateChapterSceneStructure(projectId: string, input: { chapterId: string; sceneId: string; locale: 'en' | 'zh-CN'; patch: ChapterSceneStructurePatch }): ChapterStructureWorkspaceRecord | null
  getAssetKnowledge(projectId: string, assetId: string): AssetKnowledgeWorkspaceRecord | null
  getReviewDecisions(projectId: string, bookId: string): ReviewIssueDecisionRecord[]
  setReviewDecision(projectId: string, input: SetReviewIssueDecisionInput): ReviewIssueDecisionRecord
  clearReviewDecision(projectId: string, input: { bookId: string; issueId: string }): void
  getReviewFixActions(projectId: string, bookId: string): ReviewIssueFixActionRecord[]
  setReviewFixAction(projectId: string, input: SetReviewIssueFixActionInput): ReviewIssueFixActionRecord
  clearReviewFixAction(projectId: string, input: { bookId: string; issueId: string }): void
  getSceneWorkspace(projectId: string, sceneId: string): SceneWorkspaceViewModel
  getSceneSetup(projectId: string, sceneId: string): SceneSetupViewModel
  updateSceneSetup(projectId: string, sceneId: string, setup: SceneSetupViewModel): void
  getSceneExecution(projectId: string, sceneId: string): SceneExecutionViewModel
  getSceneProse(projectId: string, sceneId: string): SceneProseViewModel
  getSceneInspector(projectId: string, sceneId: string): SceneInspectorViewModel
  getSceneDockSummary(projectId: string, sceneId: string): SceneDockViewModel
  getSceneDockTab(projectId: string, sceneId: string, tab: SceneDockTabId): Partial<SceneDockViewModel>
  getScenePatchPreview(projectId: string, sceneId: string): ScenePatchPreviewViewModel | null
  commitScenePatch(projectId: string, sceneId: string, patchId: string): void
  reviseSceneProse(projectId: string, sceneId: string, revisionMode: SceneProseViewModel['revisionModes'][number]): void
  continueSceneRun(projectId: string, sceneId: string): void
  switchSceneThread(projectId: string, sceneId: string, threadId: string): void
  applySceneProposalAction(projectId: string, sceneId: string, action: 'accept' | 'edit-accept' | 'request-rewrite' | 'reject', input: ProposalActionInput): void
  startSceneRun(projectId: string, input: StartSceneRunInput): RunRecord
  getRun(projectId: string, runId: string): RunRecord | null
  listRunArtifacts(projectId: string, runId: string): RunArtifactSummaryRecord[] | null
  getRunArtifact(projectId: string, runId: string, artifactId: string): RunArtifactDetailRecord | null
  getRunTrace(projectId: string, runId: string): RunTraceResponse | null
  getRunEvents(projectId: string, input: { runId: string; cursor?: string }): RunEventsPageRecord
  submitRunReviewDecision(projectId: string, input: SubmitRunReviewDecisionInput): RunRecord
  exportSnapshot(): FixtureDataSnapshot
  reset(): void
}

export function createFixtureRepository(options: { apiBaseUrl: string }): FixtureRepository {
  let snapshot = createFixtureDataSnapshot(options.apiBaseUrl)
  const runStore: RunFixtureStore = createRunFixtureStore()

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

  function syncSceneSurfacesFromRun(projectId: string, run: RunRecord) {
    if (run.scope !== 'scene') {
      return
    }

    const scene = getScene(projectId, run.scopeId)
    const runStatus = mapRunStatusToSceneRunStatus(run.status)
    const sceneStatus = mapRunStatusToSceneStatus(run.status)
    const runHealth = mapRunStatusToRunHealth(run.status)

    scene.workspace.latestRunId = run.id
    scene.workspace.runStatus = runStatus
    scene.workspace.status = sceneStatus
    scene.workspace.currentVersionLabel = `Latest run ${run.id}`

    scene.execution.runId = run.id
    scene.execution.runtimeSummary.runHealth = runHealth
    scene.execution.runtimeSummary.latestFailureSummary = run.status === 'failed' ? run.summary : undefined
    scene.execution.canContinueRun = run.status === 'running' || run.status === 'queued'
    scene.execution.canOpenProse = run.status === 'completed'

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

  return {
    getProjectRuntimeInfo(projectId) {
      return clone(getProject(projectId).runtimeInfo)
    },
    getBookStructure(projectId, bookId) {
      const record = getBook(projectId, bookId)
      return record ? clone(record) : null
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
    createBookExportArtifact(projectId, input) {
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
    reorderChapterScene(projectId, { chapterId, sceneId, targetIndex }) {
      const record = getChapter(projectId, chapterId)
      if (!record) {
        return null
      }

      const nextRecord = reorderChapterRecordScenes(record, sceneId, targetIndex)
      getProject(projectId).chapters[chapterId] = nextRecord
      return clone(nextRecord)
    },
    updateChapterSceneStructure(projectId, { chapterId, sceneId, locale, patch }) {
      const record = getChapter(projectId, chapterId)
      if (!record) {
        return null
      }

      const nextRecord = patchChapterRecordScene(record, sceneId, patch, locale)
      getProject(projectId).chapters[chapterId] = nextRecord
      return clone(nextRecord)
    },
    getAssetKnowledge(projectId, assetId) {
      const record = getAsset(projectId, assetId)
      return record ? clone(record) : null
    },
    getReviewDecisions(projectId, bookId) {
      return clone(getProject(projectId).reviewDecisions[bookId] ?? [])
    },
    setReviewDecision(projectId, input) {
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
      return clone(record)
    },
    clearReviewDecision(projectId, { bookId, issueId }) {
      const project = getProject(projectId)
      const bucket = project.reviewDecisions[bookId] ?? []
      project.reviewDecisions[bookId] = bucket.filter((item) => item.issueId !== issueId)
    },
    getReviewFixActions(projectId, bookId) {
      return clone(getProject(projectId).reviewFixActions[bookId] ?? [])
    },
    setReviewFixAction(projectId, input) {
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
      return clone(record)
    },
    clearReviewFixAction(projectId, { bookId, issueId }) {
      const project = getProject(projectId)
      const bucket = project.reviewFixActions[bookId] ?? []
      project.reviewFixActions[bookId] = bucket.filter((item) => item.issueId !== issueId)
    },
    getSceneWorkspace(projectId, sceneId) {
      return clone(getScene(projectId, sceneId).workspace)
    },
    getSceneSetup(projectId, sceneId) {
      return clone(getScene(projectId, sceneId).setup)
    },
    updateSceneSetup(projectId, sceneId, setup) {
      const scene = getScene(projectId, sceneId)
      scene.setup = clone(setup)
      scene.workspace.title = setup.identity.title
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
    reviseSceneProse(_projectId, _sceneId, _revisionMode) {},
    continueSceneRun(_projectId, _sceneId) {},
    switchSceneThread(projectId, sceneId, threadId) {
      const scene = getScene(projectId, sceneId)
      const hasThread = scene.workspace.availableThreads.some((item) => item.id === threadId)
      if (hasThread) {
        scene.workspace.activeThreadId = threadId
      }
    },
    applySceneProposalAction(_projectId, _sceneId, _action, _input) {},
    startSceneRun(projectId, input) {
      getScene(projectId, input.sceneId)
      const run = runStore.startSceneRun(projectId, input)
      syncRunMutations(projectId, run)
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
    submitRunReviewDecision(projectId, input) {
      const run = runStore.submitRunReviewDecision(projectId, input)
      syncRunMutations(projectId, run)
      syncSceneProseFromAcceptedRun(projectId, run, input.decision)
      return run
    },
    exportSnapshot() {
      return clone(snapshot)
    },
    reset() {
      snapshot = createFixtureDataSnapshot(options.apiBaseUrl)
      runStore.reset()
    },
  }
}
