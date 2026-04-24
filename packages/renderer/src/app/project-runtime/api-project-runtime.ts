import type { AssetClient } from '@/features/asset/api/asset-client'
import type { BookClient } from '@/features/book/api/book-client'
import type { BookExportArtifactRecord, BuildBookExportArtifactInput } from '@/features/book/api/book-export-artifact-records'
import type { BookExperimentBranchRecord } from '@/features/book/api/book-experiment-branches'
import type { BookExportProfileRecord } from '@/features/book/api/book-export-profiles'
import type { BookManuscriptCheckpointRecord } from '@/features/book/api/book-manuscript-checkpoints'
import type { BookStructureRecord } from '@/features/book/api/book-records'
import type {
  ChapterClient,
  ReorderChapterSceneInput,
  UpdateChapterSceneStructureInput,
} from '@/features/chapter/api/chapter-client'
import type { ChapterStructureWorkspaceRecord } from '@/features/chapter/api/chapter-records'
import type { ReviewClient } from '@/features/review/api/review-client'
import type { ReviewIssueDecisionRecord } from '@/features/review/api/review-decision-records'
import type { ReviewIssueFixActionRecord } from '@/features/review/api/review-fix-action-records'
import type { RunClient } from '@/features/run/api/run-client'
import type { RunArtifactDetailResponse, RunArtifactListResponse } from '@/features/run/api/run-artifact-records'
import type { RunEventsPageRecord, RunRecord, StartSceneRunInput, SubmitRunReviewDecisionInput } from '@/features/run/api/run-records'
import type { RunTraceResponse } from '@/features/run/api/run-trace-records'
import type { SceneClient } from '@/features/scene/api/scene-client'
import type {
  ProposalActionInput,
  SceneDockTabId,
  SceneDockViewModel,
  SceneExecutionViewModel,
  SceneInspectorViewModel,
  ScenePatchPreviewViewModel,
  SceneProseViewModel,
  SceneSetupViewModel,
  SceneWorkspaceViewModel,
} from '@/features/scene/types/scene-view-models'
import type { TraceabilitySceneClient } from '@/features/traceability/hooks/useTraceabilitySceneSources'
import type { AssetKnowledgeWorkspaceRecord } from '@/features/asset/api/asset-records'
import { sceneRuntimeCapabilities, type SceneRuntimeInfo } from '@/features/scene/api/scene-runtime'

import type { ApiTransport } from './api-transport'
import { apiRouteContract } from './api-route-contract'
import type { ProjectRuntime } from './project-runtime'
import type { ProjectRuntimeInfoClient, ProjectRuntimeInfoRecord } from './project-runtime-info'

export interface CreateApiProjectRuntimeOptions {
  projectId: string
  transport: ApiTransport
}

function createBookClient(projectId: string, transport: ApiTransport): BookClient {
  return {
    async getBookStructureRecord({ bookId }) {
      return transport.requestJson<BookStructureRecord | null>({
        method: 'GET',
        path: apiRouteContract.bookStructure({ projectId, bookId }),
      })
    },
    async getBookManuscriptCheckpoints({ bookId }) {
      return transport.requestJson<BookManuscriptCheckpointRecord[]>({
        method: 'GET',
        path: apiRouteContract.bookManuscriptCheckpoints({ projectId, bookId }),
      })
    },
    async getBookManuscriptCheckpoint({ bookId, checkpointId }) {
      return transport.requestJson<BookManuscriptCheckpointRecord | null>({
        method: 'GET',
        path: apiRouteContract.bookManuscriptCheckpoint({ projectId, bookId, checkpointId }),
      })
    },
    async getBookExportProfiles({ bookId }) {
      return transport.requestJson<BookExportProfileRecord[]>({
        method: 'GET',
        path: apiRouteContract.bookExportProfiles({ projectId, bookId }),
      })
    },
    async getBookExportProfile({ bookId, exportProfileId }) {
      return transport.requestJson<BookExportProfileRecord | null>({
        method: 'GET',
        path: apiRouteContract.bookExportProfile({ projectId, bookId, exportProfileId }),
      })
    },
    async getBookExportArtifacts({ bookId, exportProfileId, checkpointId }) {
      return transport.requestJson<BookExportArtifactRecord[]>({
        method: 'GET',
        path: apiRouteContract.bookExportArtifacts({ projectId, bookId }),
        query: {
          exportProfileId: exportProfileId ?? undefined,
          checkpointId: checkpointId ?? undefined,
        },
      })
    },
    async buildBookExportArtifact(input: BuildBookExportArtifactInput) {
      return transport.requestJson<BookExportArtifactRecord, BuildBookExportArtifactInput>({
        method: 'POST',
        path: apiRouteContract.bookExportArtifacts({ projectId, bookId: input.bookId }),
        body: input,
      })
    },
    async getBookExperimentBranches({ bookId }) {
      return transport.requestJson<BookExperimentBranchRecord[]>({
        method: 'GET',
        path: apiRouteContract.bookExperimentBranches({ projectId, bookId }),
      })
    },
    async getBookExperimentBranch({ bookId, branchId }) {
      return transport.requestJson<BookExperimentBranchRecord | null>({
        method: 'GET',
        path: apiRouteContract.bookExperimentBranch({ projectId, bookId, branchId }),
      })
    },
  }
}

function createChapterClient(projectId: string, transport: ApiTransport): ChapterClient {
  return {
    async getChapterStructureWorkspace({ chapterId }) {
      return transport.requestJson<ChapterStructureWorkspaceRecord | null>({
        method: 'GET',
        path: apiRouteContract.chapterStructure({ projectId, chapterId }),
      })
    },
    async reorderChapterScene({ chapterId, sceneId, targetIndex }: ReorderChapterSceneInput) {
      return transport.requestJson<ChapterStructureWorkspaceRecord | null, { targetIndex: number }>({
        method: 'POST',
        path: apiRouteContract.chapterSceneReorder({ projectId, chapterId, sceneId }),
        body: { targetIndex },
      })
    },
    async updateChapterSceneStructure({ chapterId, sceneId, locale, patch }: UpdateChapterSceneStructureInput) {
      return transport.requestJson<
        ChapterStructureWorkspaceRecord | null,
        Pick<UpdateChapterSceneStructureInput, 'locale' | 'patch'>
      >({
        method: 'PATCH',
        path: apiRouteContract.chapterSceneStructure({ projectId, chapterId, sceneId }),
        body: { locale, patch },
      })
    },
  }
}

function createAssetClient(projectId: string, transport: ApiTransport): AssetClient {
  return {
    async getAssetKnowledgeWorkspace({ assetId, locale }) {
      return transport.requestJson<AssetKnowledgeWorkspaceRecord | null>({
        method: 'GET',
        path: apiRouteContract.assetKnowledge({ projectId, assetId }),
        query: {
          locale: locale ?? undefined,
        },
      })
    },
  }
}

function createReviewClient(projectId: string, transport: ApiTransport): ReviewClient {
  return {
    async getBookReviewDecisions({ bookId }) {
      return transport.requestJson<ReviewIssueDecisionRecord[]>({
        method: 'GET',
        path: apiRouteContract.reviewDecisions({ projectId, bookId }),
      })
    },
    async setReviewIssueDecision(input) {
      return transport.requestJson<ReviewIssueDecisionRecord, typeof input>({
        method: 'PUT',
        path: apiRouteContract.reviewIssueDecision({ projectId, bookId: input.bookId, issueId: input.issueId }),
        body: input,
      })
    },
    async clearReviewIssueDecision({ bookId, issueId }) {
      await transport.requestJson<void>({
        method: 'DELETE',
        path: apiRouteContract.reviewIssueDecision({ projectId, bookId, issueId }),
      })
    },
    async getBookReviewFixActions({ bookId }) {
      return transport.requestJson<ReviewIssueFixActionRecord[]>({
        method: 'GET',
        path: apiRouteContract.reviewFixActions({ projectId, bookId }),
      })
    },
    async setReviewIssueFixAction(input) {
      return transport.requestJson<ReviewIssueFixActionRecord, typeof input>({
        method: 'PUT',
        path: apiRouteContract.reviewIssueFixAction({ projectId, bookId: input.bookId, issueId: input.issueId }),
        body: input,
      })
    },
    async clearReviewIssueFixAction({ bookId, issueId }) {
      await transport.requestJson<void>({
        method: 'DELETE',
        path: apiRouteContract.reviewIssueFixAction({ projectId, bookId, issueId }),
      })
    },
  }
}

function createProjectRuntimeInfoClient(projectId: string, transport: ApiTransport): ProjectRuntimeInfoClient {
  return {
    async getProjectRuntimeInfo() {
      return requestProjectRuntimeInfo(projectId, transport)
    },
  }
}

async function requestProjectRuntimeInfo(projectId: string, transport: ApiTransport) {
  return transport.requestJson<ProjectRuntimeInfoRecord>({
    method: 'GET',
    path: apiRouteContract.projectRuntimeInfo({ projectId }),
  })
}

function adaptProjectRuntimeInfoToSceneRuntimeInfo(projectRuntimeInfo: ProjectRuntimeInfoRecord): SceneRuntimeInfo {
  const readableSceneCapabilities = new Set([
    'getSceneWorkspace',
    'getSceneSetup',
    'getSceneExecution',
    'getSceneProse',
    'getSceneInspector',
    'getSceneDockSummary',
    'getSceneDockTab',
    'previewAcceptedPatch',
  ] as const)
  const writableSceneCapabilities = new Set(
    sceneRuntimeCapabilities.filter((capability) => !readableSceneCapabilities.has(capability)),
  )

  return {
    source: projectRuntimeInfo.source === 'mock' ? 'mock-fallback' : 'preload-bridge',
    label: projectRuntimeInfo.versionLabel ?? projectRuntimeInfo.checkedAtLabel ?? projectRuntimeInfo.projectTitle,
    capabilities: Object.fromEntries(
      sceneRuntimeCapabilities.map((capability) => [
        capability,
        readableSceneCapabilities.has(capability)
          ? projectRuntimeInfo.capabilities.read
          : writableSceneCapabilities.has(capability)
            ? projectRuntimeInfo.capabilities.write
            : false,
      ]),
    ) as SceneRuntimeInfo['capabilities'],
  }
}

export function createRunClient(projectId: string, transport: ApiTransport): RunClient {
  return {
    async startSceneRun(input) {
      return transport.requestJson<RunRecord, Omit<StartSceneRunInput, 'sceneId'>>({
        method: 'POST',
        path: apiRouteContract.sceneRuns({ projectId, sceneId: input.sceneId }),
        body: {
          mode: input.mode,
          note: input.note,
        },
      })
    },
    async getRun({ runId }) {
      return transport.requestJson<RunRecord | null>({
        method: 'GET',
        path: apiRouteContract.run({ projectId, runId }),
      })
    },
    async getRunEvents({ runId, cursor }) {
      return transport.requestJson<RunEventsPageRecord>({
        method: 'GET',
        path: apiRouteContract.runEvents({ projectId, runId }),
        query: {
          cursor: cursor ?? undefined,
        },
      })
    },
    async submitRunReviewDecision(input) {
      return transport.requestJson<RunRecord, Omit<SubmitRunReviewDecisionInput, 'runId'>>({
        method: 'POST',
        path: apiRouteContract.runReviewDecisions({ projectId, runId: input.runId }),
        body: {
          reviewId: input.reviewId,
          decision: input.decision,
          note: input.note,
          patchId: input.patchId,
        },
      })
    },
    async listRunArtifacts({ runId }) {
      return transport.requestJson<RunArtifactListResponse>({
        method: 'GET',
        path: apiRouteContract.runArtifacts({ projectId, runId }),
      })
    },
    async getRunArtifact({ runId, artifactId }) {
      return transport.requestJson<RunArtifactDetailResponse>({
        method: 'GET',
        path: apiRouteContract.runArtifact({ projectId, runId, artifactId }),
      })
    },
    async getRunTrace({ runId }) {
      return transport.requestJson<RunTraceResponse>({
        method: 'GET',
        path: apiRouteContract.runTrace({ projectId, runId }),
      })
    },
  }
}

function createSceneClient(projectId: string, transport: ApiTransport): SceneClient {
  async function getSceneJson<TResponse>(path: string) {
    return transport.requestJson<TResponse>({
      method: 'GET',
      path,
    })
  }

  async function postSceneJson<TBody>(path: string, body?: TBody) {
    await transport.requestJson<void, TBody>({
      method: 'POST',
      path,
      body,
    })
  }

  return {
    async getRuntimeInfo() {
      return adaptProjectRuntimeInfoToSceneRuntimeInfo(await requestProjectRuntimeInfo(projectId, transport))
    },
    async getSceneWorkspace(sceneId) {
      return getSceneJson<SceneWorkspaceViewModel>(apiRouteContract.sceneWorkspace({ projectId, sceneId }))
    },
    async getSceneSetup(sceneId) {
      return getSceneJson<SceneSetupViewModel>(apiRouteContract.sceneSetup({ projectId, sceneId }))
    },
    async getSceneExecution(sceneId) {
      return getSceneJson<SceneExecutionViewModel>(apiRouteContract.sceneExecution({ projectId, sceneId }))
    },
    async getSceneProse(sceneId) {
      return getSceneJson<SceneProseViewModel>(apiRouteContract.sceneProse({ projectId, sceneId }))
    },
    async getSceneInspector(sceneId) {
      return getSceneJson<SceneInspectorViewModel>(apiRouteContract.sceneInspector({ projectId, sceneId }))
    },
    async getSceneDockSummary(sceneId) {
      return getSceneJson<SceneDockViewModel>(apiRouteContract.sceneDockSummary({ projectId, sceneId }))
    },
    async getSceneDockTab(sceneId, tab: SceneDockTabId) {
      return getSceneJson<Partial<SceneDockViewModel>>(apiRouteContract.sceneDockTab({ projectId, sceneId, tab }))
    },
    async previewAcceptedPatch(sceneId) {
      return getSceneJson<ScenePatchPreviewViewModel | null>(apiRouteContract.scenePatchPreview({ projectId, sceneId }))
    },
    async commitAcceptedPatch(sceneId, patchId) {
      await postSceneJson(apiRouteContract.scenePatchCommit({ projectId, sceneId }), { patchId })
    },
    async saveSceneSetup(sceneId, setup) {
      await transport.requestJson<void, SceneSetupViewModel>({
        method: 'PATCH',
        path: apiRouteContract.sceneSetup({ projectId, sceneId }),
        body: setup,
      })
    },
    async reviseSceneProse(sceneId, revisionMode: SceneProseViewModel['revisionModes'][number]) {
      await postSceneJson(apiRouteContract.sceneProseRevision({ projectId, sceneId }), { revisionMode })
    },
    async continueSceneRun(sceneId) {
      await postSceneJson(apiRouteContract.sceneExecutionContinue({ projectId, sceneId }))
    },
    async switchSceneThread(sceneId, threadId) {
      await postSceneJson(apiRouteContract.sceneExecutionThread({ projectId, sceneId }), { threadId })
    },
    async acceptProposal(sceneId, input: ProposalActionInput) {
      await postSceneJson(apiRouteContract.sceneProposalAccept({ projectId, sceneId }), input)
    },
    async editAcceptProposal(sceneId, input: ProposalActionInput) {
      await postSceneJson(apiRouteContract.sceneProposalEditAccept({ projectId, sceneId }), input)
    },
    async requestRewrite(sceneId, input: ProposalActionInput) {
      await postSceneJson(apiRouteContract.sceneProposalRequestRewrite({ projectId, sceneId }), input)
    },
    async rejectProposal(sceneId, input: ProposalActionInput) {
      await postSceneJson(apiRouteContract.sceneProposalReject({ projectId, sceneId }), input)
    },
  }
}

function createTraceabilitySceneClient(sceneClient: SceneClient): TraceabilitySceneClient {
  return {
    getSceneExecution: sceneClient.getSceneExecution.bind(sceneClient),
    getSceneProse: sceneClient.getSceneProse.bind(sceneClient),
    getSceneInspector: sceneClient.getSceneInspector.bind(sceneClient),
    previewAcceptedPatch: sceneClient.previewAcceptedPatch.bind(sceneClient),
  }
}

export function createApiProjectRuntime({ projectId, transport }: CreateApiProjectRuntimeOptions): ProjectRuntime {
  const sceneClient = createSceneClient(projectId, transport)

  return {
    projectId,
    bookClient: createBookClient(projectId, transport),
    chapterClient: createChapterClient(projectId, transport),
    assetClient: createAssetClient(projectId, transport),
    reviewClient: createReviewClient(projectId, transport),
    runClient: createRunClient(projectId, transport),
    runtimeInfoClient: createProjectRuntimeInfoClient(projectId, transport),
    sceneClient,
    traceabilitySceneClient: createTraceabilitySceneClient(sceneClient),
  }
}
