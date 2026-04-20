import {
  createMockProjectRuntime,
  type CreateMockProjectRuntimeOptions,
} from './mock-project-runtime'
import type { ApiRequestOptions } from './api-transport'
import { createApiProjectRuntime } from './api-project-runtime'

export interface FakeApiRequest<TBody = unknown> extends ApiRequestOptions<TBody> {}

export interface CreateFakeApiRuntimeOptions {
  projectId?: string
  mockRuntimeOptions?: CreateMockProjectRuntimeOptions
}

export function createFakeApiRuntime({
  projectId = 'project-smoke',
  mockRuntimeOptions,
}: CreateFakeApiRuntimeOptions = {}) {
  const requests: FakeApiRequest[] = []
  const mockRuntime = createMockProjectRuntime({
    persistence: {
      async loadProjectSnapshot() {
        return null
      },
      async saveProjectSnapshot() {},
      async clearProjectSnapshot() {},
    },
    ...mockRuntimeOptions,
  })

  const runtime = createApiProjectRuntime({
    projectId,
    transport: {
      async requestJson<TResponse, TBody = unknown>(options: ApiRequestOptions<TBody>) {
        requests.push(structuredClone(options) as FakeApiRequest)
        return handleFakeApiRequest<TResponse, TBody>(projectId, mockRuntime, options)
      },
    },
  })

  return {
    projectId,
    requests,
    runtime,
    mockRuntime,
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function decodeSegment(value: string) {
  return decodeURIComponent(value)
}

function readLocale(query: ApiRequestOptions['query']) {
  return query?.locale === 'zh-CN' ? 'zh-CN' : 'en'
}

async function handleFakeApiRequest<TResponse, TBody>(
  projectId: string,
  mockRuntime: ReturnType<typeof createMockProjectRuntime>,
  options: ApiRequestOptions<TBody>,
): Promise<TResponse> {
  const { method, path, body, query } = options
  const projectBasePattern = `^/api/projects/${escapeRegExp(encodeURIComponent(projectId))}`

  const bookStructureMatch = path.match(new RegExp(`${projectBasePattern}/books/([^/]+)/structure$`))
  if (method === 'GET' && bookStructureMatch) {
    return mockRuntime.bookClient.getBookStructureRecord({
      bookId: decodeSegment(bookStructureMatch[1]!),
    }) as Promise<TResponse>
  }

  const bookCheckpointsMatch = path.match(new RegExp(`${projectBasePattern}/books/([^/]+)/manuscript-checkpoints$`))
  if (method === 'GET' && bookCheckpointsMatch) {
    return mockRuntime.bookClient.getBookManuscriptCheckpoints({
      bookId: decodeSegment(bookCheckpointsMatch[1]!),
    }) as Promise<TResponse>
  }

  const bookCheckpointMatch = path.match(
    new RegExp(`${projectBasePattern}/books/([^/]+)/manuscript-checkpoints/([^/]+)$`),
  )
  if (method === 'GET' && bookCheckpointMatch) {
    return mockRuntime.bookClient.getBookManuscriptCheckpoint({
      bookId: decodeSegment(bookCheckpointMatch[1]!),
      checkpointId: decodeSegment(bookCheckpointMatch[2]!),
    }) as Promise<TResponse>
  }

  const bookExportProfilesMatch = path.match(new RegExp(`${projectBasePattern}/books/([^/]+)/export-profiles$`))
  if (method === 'GET' && bookExportProfilesMatch) {
    return mockRuntime.bookClient.getBookExportProfiles({
      bookId: decodeSegment(bookExportProfilesMatch[1]!),
    }) as Promise<TResponse>
  }

  const bookExportProfileMatch = path.match(new RegExp(`${projectBasePattern}/books/([^/]+)/export-profiles/([^/]+)$`))
  if (method === 'GET' && bookExportProfileMatch) {
    return mockRuntime.bookClient.getBookExportProfile({
      bookId: decodeSegment(bookExportProfileMatch[1]!),
      exportProfileId: decodeSegment(bookExportProfileMatch[2]!),
    }) as Promise<TResponse>
  }

  const bookExportArtifactsMatch = path.match(new RegExp(`${projectBasePattern}/books/([^/]+)/export-artifacts$`))
  if (method === 'GET' && bookExportArtifactsMatch) {
    return mockRuntime.bookClient.getBookExportArtifacts({
      bookId: decodeSegment(bookExportArtifactsMatch[1]!),
      exportProfileId: typeof query?.exportProfileId === 'string' ? query.exportProfileId : undefined,
      checkpointId: typeof query?.checkpointId === 'string' ? query.checkpointId : undefined,
    }) as Promise<TResponse>
  }

  const bookBranchesMatch = path.match(new RegExp(`${projectBasePattern}/books/([^/]+)/experiment-branches$`))
  if (method === 'GET' && bookBranchesMatch) {
    return mockRuntime.bookClient.getBookExperimentBranches({
      bookId: decodeSegment(bookBranchesMatch[1]!),
    }) as Promise<TResponse>
  }

  const bookBranchMatch = path.match(new RegExp(`${projectBasePattern}/books/([^/]+)/experiment-branches/([^/]+)$`))
  if (method === 'GET' && bookBranchMatch) {
    return mockRuntime.bookClient.getBookExperimentBranch({
      bookId: decodeSegment(bookBranchMatch[1]!),
      branchId: decodeSegment(bookBranchMatch[2]!),
    }) as Promise<TResponse>
  }

  const chapterStructureMatch = path.match(new RegExp(`${projectBasePattern}/chapters/([^/]+)/structure$`))
  if (method === 'GET' && chapterStructureMatch) {
    return mockRuntime.chapterClient.getChapterStructureWorkspace({
      chapterId: decodeSegment(chapterStructureMatch[1]!),
    }) as Promise<TResponse>
  }

  const assetKnowledgeMatch = path.match(new RegExp(`${projectBasePattern}/assets/([^/]+)/knowledge$`))
  if (method === 'GET' && assetKnowledgeMatch) {
    return mockRuntime.assetClient.getAssetKnowledgeWorkspace({
      assetId: decodeSegment(assetKnowledgeMatch[1]!),
      locale: readLocale(query),
    }) as Promise<TResponse>
  }

  const reviewDecisionsMatch = path.match(new RegExp(`${projectBasePattern}/books/([^/]+)/review-decisions$`))
  if (method === 'GET' && reviewDecisionsMatch) {
    return mockRuntime.reviewClient.getBookReviewDecisions({
      bookId: decodeSegment(reviewDecisionsMatch[1]!),
    }) as Promise<TResponse>
  }

  const reviewIssueDecisionMatch = path.match(new RegExp(`${projectBasePattern}/books/([^/]+)/review-decisions/([^/]+)$`))
  if (method === 'PUT' && reviewIssueDecisionMatch) {
    return mockRuntime.reviewClient.setReviewIssueDecision(body as Parameters<typeof mockRuntime.reviewClient.setReviewIssueDecision>[0]) as Promise<TResponse>
  }

  if (method === 'DELETE' && reviewIssueDecisionMatch) {
    await mockRuntime.reviewClient.clearReviewIssueDecision({
      bookId: decodeSegment(reviewIssueDecisionMatch[1]!),
      issueId: decodeSegment(reviewIssueDecisionMatch[2]!),
    })
    return undefined as TResponse
  }

  const reviewFixActionsMatch = path.match(new RegExp(`${projectBasePattern}/books/([^/]+)/review-fix-actions$`))
  if (method === 'GET' && reviewFixActionsMatch) {
    return mockRuntime.reviewClient.getBookReviewFixActions({
      bookId: decodeSegment(reviewFixActionsMatch[1]!),
    }) as Promise<TResponse>
  }

  const sceneExecutionMatch = path.match(new RegExp(`${projectBasePattern}/scenes/([^/]+)/execution$`))
  if (method === 'GET' && sceneExecutionMatch) {
    return mockRuntime.sceneClient.getSceneExecution(decodeSegment(sceneExecutionMatch[1]!)) as Promise<TResponse>
  }

  const sceneProseMatch = path.match(new RegExp(`${projectBasePattern}/scenes/([^/]+)/prose$`))
  if (method === 'GET' && sceneProseMatch) {
    return mockRuntime.sceneClient.getSceneProse(decodeSegment(sceneProseMatch[1]!)) as Promise<TResponse>
  }

  const sceneInspectorMatch = path.match(new RegExp(`${projectBasePattern}/scenes/([^/]+)/inspector$`))
  if (method === 'GET' && sceneInspectorMatch) {
    return mockRuntime.sceneClient.getSceneInspector(decodeSegment(sceneInspectorMatch[1]!)) as Promise<TResponse>
  }

  const scenePatchPreviewMatch = path.match(new RegExp(`${projectBasePattern}/scenes/([^/]+)/patch-preview$`))
  if (method === 'GET' && scenePatchPreviewMatch) {
    return mockRuntime.sceneClient.previewAcceptedPatch(decodeSegment(scenePatchPreviewMatch[1]!)) as Promise<TResponse>
  }

  throw new Error(`Unhandled fake API request: ${method} ${path}`)
}
