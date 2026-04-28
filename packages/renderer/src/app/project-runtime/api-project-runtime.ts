import type { AssetClient } from '@/features/asset/api/asset-client'
import type { BookClient } from '@/features/book/api/book-client'
import type { BookDraftAssemblyRecord } from '@/features/book/api/book-draft-assembly-records'
import type { BookExportArtifactRecord, BuildBookExportArtifactInput } from '@/features/book/api/book-export-artifact-records'
import type {
  ArchiveBookExperimentBranchInput,
  BookExperimentBranchRecord,
  CreateBookExperimentBranchInput,
} from '@/features/book/api/book-experiment-branches'
import type { BookExportProfileRecord } from '@/features/book/api/book-export-profiles'
import type {
  BookManuscriptCheckpointRecord,
  CreateBookManuscriptCheckpointInput,
} from '@/features/book/api/book-manuscript-checkpoints'
import type { BookStructureRecord } from '@/features/book/api/book-records'
import type { ChapterDraftAssemblyRecord } from '@/features/chapter/api/chapter-draft-assembly-records'
import type {
  AcceptChapterBacklogProposalInput,
  ChapterClient,
  GenerateChapterBacklogProposalInput,
  ReorderChapterSceneInput,
  StartNextChapterSceneRunInput,
  UpdateChapterBacklogInput,
  UpdateChapterBacklogProposalSceneInput,
  UpdateChapterSceneStructureInput,
} from '@/features/chapter/api/chapter-client'
import type {
  ChapterStructureWorkspaceRecord,
  StartNextChapterSceneRunRecord,
} from '@/features/chapter/api/chapter-records'
import type { ReviewClient } from '@/features/review/api/review-client'
import type { ReviewIssueDecisionRecord } from '@/features/review/api/review-decision-records'
import type { ReviewIssueFixActionRecord } from '@/features/review/api/review-fix-action-records'
import type { RunClient } from '@/features/run/api/run-client'
import type { RunArtifactDetailResponse, RunArtifactListResponse } from '@/features/run/api/run-artifact-records'
import type {
  CancelRunInput,
  ResumeRunInput,
  RetryRunInput,
  RunEventsPageRecord,
  RunRecord,
  StartSceneRunInput,
  SubmitRunReviewDecisionInput,
} from '@/features/run/api/run-records'
import type { RunTraceResponse } from '@/features/run/api/run-trace-records'
import type { SceneClient } from '@/features/scene/api/scene-client'
import type {
  ProposalActionInput,
  SceneDockTabId,
  SceneDockViewModel,
  SceneExecutionViewModel,
  SceneInspectorViewModel,
  ScenePatchPreviewViewModel,
  SceneProseRevisionRequestInput,
  SceneProseViewModel,
  SceneSetupViewModel,
  SceneWorkspaceViewModel,
} from '@/features/scene/types/scene-view-models'
import type { TraceabilitySceneClient } from '@/features/traceability/hooks/useTraceabilitySceneSources'
import type { AssetKnowledgeWorkspaceRecord } from '@/features/asset/api/asset-records'
import { sceneRuntimeCapabilities, type SceneRuntimeInfo } from '@/features/scene/api/scene-runtime'
import { MAX_SCENE_PROSE_REVISION_INSTRUCTION_LENGTH } from '@/features/scene/api/scene-runtime'

import { ApiRequestError, type ApiStreamRequestOptions, type ApiTransport, type ApiQueryValue } from './api-transport'
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
    async getBookDraftAssembly({ bookId }) {
      return transport.requestJson<BookDraftAssemblyRecord | null>({
        method: 'GET',
        path: apiRouteContract.bookDraftAssembly({ projectId, bookId }),
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
    async createBookManuscriptCheckpoint(input: CreateBookManuscriptCheckpointInput) {
      return transport.requestJson<BookManuscriptCheckpointRecord, CreateBookManuscriptCheckpointInput>({
        method: 'POST',
        path: apiRouteContract.bookManuscriptCheckpoints({ projectId, bookId: input.bookId }),
        body: input,
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
    async createBookExperimentBranch(input: CreateBookExperimentBranchInput) {
      return transport.requestJson<BookExperimentBranchRecord, CreateBookExperimentBranchInput>({
        method: 'POST',
        path: apiRouteContract.bookExperimentBranches({ projectId, bookId: input.bookId }),
        body: input,
      })
    },
    async archiveBookExperimentBranch(input: ArchiveBookExperimentBranchInput) {
      return transport.requestJson<BookExperimentBranchRecord, ArchiveBookExperimentBranchInput>({
        method: 'POST',
        path: apiRouteContract.bookExperimentBranchArchive({ projectId, bookId: input.bookId, branchId: input.branchId }),
        body: input,
      })
    },
  }
}

function createChapterClient(projectId: string, transport: ApiTransport): ChapterClient {
  return {
    async getChapterDraftAssembly({ chapterId }) {
      return transport.requestJson<ChapterDraftAssemblyRecord | null>({
        method: 'GET',
        path: apiRouteContract.chapterDraftAssembly({ projectId, chapterId }),
      })
    },
    async getChapterStructureWorkspace({ chapterId }) {
      return transport.requestJson<ChapterStructureWorkspaceRecord | null>({
        method: 'GET',
        path: apiRouteContract.chapterStructure({ projectId, chapterId }),
      })
    },
    async updateChapterBacklogInput({ chapterId, locale, goal, constraints }: UpdateChapterBacklogInput) {
      return transport.requestJson<
        ChapterStructureWorkspaceRecord | null,
        Pick<UpdateChapterBacklogInput, 'locale' | 'goal' | 'constraints'>
      >({
        method: 'PATCH',
        path: apiRouteContract.chapterPlanningInput({ projectId, chapterId }),
        body: {
          locale,
          goal,
          constraints,
        },
      })
    },
    async generateChapterBacklogProposal({ chapterId, locale }: GenerateChapterBacklogProposalInput) {
      return transport.requestJson<ChapterStructureWorkspaceRecord | null, Pick<GenerateChapterBacklogProposalInput, 'locale'>>({
        method: 'POST',
        path: apiRouteContract.chapterBacklogProposals({ projectId, chapterId }),
        body: { locale },
      })
    },
    async updateChapterBacklogProposalScene({
      chapterId,
      proposalId,
      proposalSceneId,
      locale,
      patch,
      order,
      backlogStatus,
    }: UpdateChapterBacklogProposalSceneInput) {
      return transport.requestJson<
        ChapterStructureWorkspaceRecord | null,
        Pick<UpdateChapterBacklogProposalSceneInput, 'locale' | 'patch' | 'order' | 'backlogStatus'>
      >({
        method: 'PATCH',
        path: apiRouteContract.chapterBacklogProposalScene({ projectId, chapterId, proposalId, proposalSceneId }),
        body: {
          locale,
          patch,
          order,
          backlogStatus,
        },
      })
    },
    async acceptChapterBacklogProposal({ chapterId, proposalId, locale }: AcceptChapterBacklogProposalInput) {
      return transport.requestJson<ChapterStructureWorkspaceRecord | null, Pick<AcceptChapterBacklogProposalInput, 'locale'>>({
        method: 'POST',
        path: apiRouteContract.chapterBacklogProposalAccept({ projectId, chapterId, proposalId }),
        body: { locale },
      })
    },
    async startNextChapterSceneRun({ chapterId, locale, mode, note }: StartNextChapterSceneRunInput) {
      return transport.requestJson<
        StartNextChapterSceneRunRecord | null,
        Pick<StartNextChapterSceneRunInput, 'locale' | 'mode' | 'note'>
      >({
        method: 'POST',
        path: apiRouteContract.chapterRunNextScene({ projectId, chapterId }),
        body: {
          locale,
          mode,
          note,
        },
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

function buildApiUrl(path: string, query?: Record<string, ApiQueryValue>, baseUrl?: string) {
  const url = baseUrl ? new URL(path, baseUrl) : new URL(path, 'http://localhost')

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null) {
      continue
    }

    url.searchParams.set(key, String(value))
  }

  if (baseUrl) {
    return url.toString()
  }

  return `${url.pathname}${url.search}`
}

function tryParseJsonText(text: string) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function toApiRequestError(response: Response) {
  const text = await response.text()
  const payload = text.trim() === '' ? null : tryParseJsonText(text)
  const payloadMessage =
    payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
      ? payload.message
      : undefined
  const payloadCode =
    payload && typeof payload === 'object' && 'code' in payload && typeof payload.code === 'string'
      ? payload.code
      : undefined
  const payloadDetail = payload && typeof payload === 'object' && 'detail' in payload ? payload.detail : text || undefined

  return new ApiRequestError({
    status: response.status,
    message: payloadMessage ?? response.statusText ?? `Request failed with status ${response.status}`,
    code: payloadCode,
    detail: payloadDetail,
  })
}

function parseStreamEventPage(text: string, status: number) {
  try {
    return JSON.parse(text) as RunEventsPageRecord
  } catch {
    throw new ApiRequestError({
      status,
      message: 'Malformed JSON response',
      detail: text,
    })
  }
}

function processRunEventStreamBuffer(
  buffer: string,
  status: number,
  onPage: (page: RunEventsPageRecord) => void,
  flushTrailingEvent = false,
) {
  let remaining = buffer

  const processRawEvent = (rawEvent: string) => {
    if (rawEvent.trim() === '') {
      return
    }

    const lines = rawEvent.split(/\r\n|\n|\r/)
    const dataLines = lines
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice('data:'.length).trimStart())

    if (dataLines.length === 0) {
      return
    }

    onPage(parseStreamEventPage(dataLines.join('\n'), status))
  }

  while (true) {
    const separatorMatch = /\r\n\r\n|\n\n|\r\r/.exec(remaining)
    if (!separatorMatch || separatorMatch.index === undefined) {
      if (flushTrailingEvent) {
        processRawEvent(remaining)
        return ''
      }

      return remaining
    }

    const rawEvent = remaining.slice(0, separatorMatch.index)
    remaining = remaining.slice(separatorMatch.index + separatorMatch[0].length)
    processRawEvent(rawEvent)
  }
}

async function requestStreamResponse(
  transport: ApiTransport,
  options: ApiStreamRequestOptions,
) {
  if (transport.requestStream) {
    return transport.requestStream(options)
  }

  return globalThis.fetch(buildApiUrl(options.path, options.query, options.baseUrl), {
    method: options.method,
    signal: options.signal,
    headers: options.headers,
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
    async retryRun(input) {
      return transport.requestJson<RunRecord, Omit<RetryRunInput, 'runId'>>({
        method: 'POST',
        path: apiRouteContract.runRetry({ projectId, runId: input.runId }),
        body: {
          mode: input.mode,
        },
      })
    },
    async cancelRun(input) {
      return transport.requestJson<RunRecord, Omit<CancelRunInput, 'runId'>>({
        method: 'POST',
        path: apiRouteContract.runCancel({ projectId, runId: input.runId }),
        body: {
          reason: input.reason,
        },
      })
    },
    async resumeRun(input) {
      return transport.requestJson<RunRecord, Omit<ResumeRunInput, 'runId'>>({
        method: 'POST',
        path: apiRouteContract.runResume({ projectId, runId: input.runId }),
        body: {},
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
    async streamRunEvents({ runId, cursor, signal, onOpen, onPage }) {
      const runtimeInfo = await requestProjectRuntimeInfo(projectId, transport)
      const response = await requestStreamResponse(transport, {
        method: 'GET',
        path: apiRouteContract.runEventsStream({ projectId, runId }),
        query: {
          cursor: cursor ?? undefined,
        },
        signal,
        headers: {
          Accept: 'text/event-stream',
        },
        baseUrl: runtimeInfo.apiBaseUrl,
      })

      if (!response.ok) {
        throw await toApiRequestError(response)
      }

      if (!response.body) {
        throw new ApiRequestError({
          status: response.status,
          message: 'Run event stream response body is missing.',
        })
      }

      onOpen?.()

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            break
          }

          buffer += decoder.decode(value, { stream: true })
          buffer = processRunEventStreamBuffer(buffer, response.status, onPage)
        }

        buffer += decoder.decode()
        processRunEventStreamBuffer(buffer, response.status, onPage, true)
      } catch (error) {
        if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
          return
        }

        throw error
      } finally {
        reader.releaseLock()
      }
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
          selectedVariants: input.selectedVariants,
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

  function normalizeRevisionInput(
    input: SceneProseRevisionRequestInput | SceneProseViewModel['revisionModes'][number],
    instruction?: string,
  ): SceneProseRevisionRequestInput {
    const normalizedInstruction =
      typeof input === 'string'
        ? instruction?.trim()
        : input.instruction?.trim()

    if (normalizedInstruction && normalizedInstruction.length > MAX_SCENE_PROSE_REVISION_INSTRUCTION_LENGTH) {
      throw new ApiRequestError({
        status: 400,
        message: `instruction must be at most ${MAX_SCENE_PROSE_REVISION_INSTRUCTION_LENGTH} characters.`,
        code: 'INVALID_REVISION_INSTRUCTION',
        detail: {
          body:
            typeof input === 'string'
              ? { revisionMode: input, instruction }
              : { revisionMode: input.revisionMode, instruction: input.instruction },
          maxLength: MAX_SCENE_PROSE_REVISION_INSTRUCTION_LENGTH,
        },
      })
    }

    if (typeof input === 'string') {
      return {
        revisionMode: input,
        ...(normalizedInstruction ? { instruction: normalizedInstruction } : {}),
      }
    }

    return {
      revisionMode: input.revisionMode,
      ...(normalizedInstruction ? { instruction: normalizedInstruction } : {}),
    }
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
    async reviseSceneProse(sceneId, input, instruction) {
      await postSceneJson(apiRouteContract.sceneProseRevision({ projectId, sceneId }), normalizeRevisionInput(input, instruction))
    },
    async acceptSceneProseRevision(sceneId, revisionId) {
      await postSceneJson(apiRouteContract.sceneProseRevisionAccept({ projectId, sceneId }), { revisionId })
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
