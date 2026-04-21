import {
  createMockProjectRuntime,
  type CreateMockProjectRuntimeOptions,
} from './mock-project-runtime'
import type { ApiQueryValue, ApiRequestOptions } from './api-transport'
import { createApiProjectRuntime } from './api-project-runtime'

export interface FakeApiRequest<TBody = unknown> extends ApiRequestOptions<TBody> {}

export interface FakeApiRequestOverride {
  method: FakeApiRequest['method']
  path: string
  query?: Record<string, ApiQueryValue>
  body?: unknown
  response?: unknown | ((request: FakeApiRequest) => unknown | Promise<unknown>)
  error?: Error | ((request: FakeApiRequest) => Error | Promise<Error>)
}

export interface CreateFakeApiRuntimeOptions {
  projectId?: string
  mockRuntimeOptions?: CreateMockProjectRuntimeOptions
  overrides?: FakeApiRequestOverride[]
}

export function createFakeApiRuntime({
  projectId = 'project-smoke',
  mockRuntimeOptions,
  overrides = [],
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
        const override = findFakeApiRequestOverride(overrides, options)
        if (override) {
          return resolveFakeApiRequestOverride<TResponse>(override, options)
        }
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

function normalizeRecord(record: Record<string, ApiQueryValue> | undefined) {
  if (!record) {
    return undefined
  }

  return Object.fromEntries(
    Object.entries(record)
      .filter(([, value]) => value !== undefined && value !== null)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => [key, String(value)]),
  )
}

function stableSerialize(value: unknown): string {
  if (value === undefined) {
    return 'undefined'
  }

  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entryValue]) => entryValue !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))

  return `{${entries.map(([key, entryValue]) => `${JSON.stringify(key)}:${stableSerialize(entryValue)}`).join(',')}}`
}

function normalizeBody(body: unknown) {
  return body === undefined ? undefined : stableSerialize(body)
}

function matchesFakeApiRequestOverride(
  override: FakeApiRequestOverride,
  options: ApiRequestOptions,
) {
  if (override.method !== options.method || override.path !== options.path) {
    return false
  }

  if (
    override.query !== undefined &&
    JSON.stringify(normalizeRecord(override.query)) !== JSON.stringify(normalizeRecord(options.query))
  ) {
    return false
  }

  if (override.body !== undefined && normalizeBody(override.body) !== normalizeBody(options.body)) {
    return false
  }

  return true
}

function findFakeApiRequestOverride(
  overrides: FakeApiRequestOverride[],
  options: ApiRequestOptions,
) {
  return overrides.find((override) => matchesFakeApiRequestOverride(override, options))
}

function cloneFakeApiResponse<T>(value: T): T {
  if (value === undefined || value === null) {
    return value
  }

  return structuredClone(value)
}

async function resolveFakeApiRequestOverride<TResponse>(
  override: FakeApiRequestOverride,
  options: ApiRequestOptions,
): Promise<TResponse> {
  const request = structuredClone(options) as FakeApiRequest

  if (override.error) {
    throw (typeof override.error === 'function' ? await override.error(request) : override.error)
  }

  if ('response' in override) {
    const response =
      typeof override.response === 'function'
        ? await override.response(request)
        : override.response

    return cloneFakeApiResponse(response) as TResponse
  }

  return undefined as TResponse
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

  const reviewFixActionMatch = path.match(new RegExp(`${projectBasePattern}/books/([^/]+)/review-fix-actions/([^/]+)$`))
  if (method === 'PUT' && reviewFixActionMatch) {
    return mockRuntime.reviewClient.setReviewIssueFixAction(
      body as Parameters<typeof mockRuntime.reviewClient.setReviewIssueFixAction>[0],
    ) as Promise<TResponse>
  }

  if (method === 'DELETE' && reviewFixActionMatch) {
    await mockRuntime.reviewClient.clearReviewIssueFixAction({
      bookId: decodeSegment(reviewFixActionMatch[1]!),
      issueId: decodeSegment(reviewFixActionMatch[2]!),
    })
    return undefined as TResponse
  }

  if (method === 'POST' && bookExportArtifactsMatch) {
    return mockRuntime.bookClient.buildBookExportArtifact(
      body as Parameters<typeof mockRuntime.bookClient.buildBookExportArtifact>[0],
    ) as Promise<TResponse>
  }

  const chapterSceneReorderMatch = path.match(
    new RegExp(`${projectBasePattern}/chapters/([^/]+)/scenes/([^/]+)/reorder$`),
  )
  if (method === 'POST' && chapterSceneReorderMatch) {
    const reorderBody = body as { targetIndex: number }
    return mockRuntime.chapterClient.reorderChapterScene({
      chapterId: decodeSegment(chapterSceneReorderMatch[1]!),
      sceneId: decodeSegment(chapterSceneReorderMatch[2]!),
      targetIndex: reorderBody.targetIndex,
    }) as Promise<TResponse>
  }

  const chapterSceneStructureMatch = path.match(
    new RegExp(`${projectBasePattern}/chapters/([^/]+)/scenes/([^/]+)/structure$`),
  )
  if (method === 'PATCH' && chapterSceneStructureMatch) {
    const structureBody = body as { locale: 'en' | 'zh-CN'; patch: unknown }
    return mockRuntime.chapterClient.updateChapterSceneStructure({
      chapterId: decodeSegment(chapterSceneStructureMatch[1]!),
      sceneId: decodeSegment(chapterSceneStructureMatch[2]!),
      locale: structureBody.locale,
      patch: structureBody.patch as Parameters<typeof mockRuntime.chapterClient.updateChapterSceneStructure>[0]['patch'],
    }) as Promise<TResponse>
  }

  const sceneExecutionMatch = path.match(new RegExp(`${projectBasePattern}/scenes/([^/]+)/execution$`))
  if (method === 'GET' && sceneExecutionMatch) {
    return mockRuntime.sceneClient.getSceneExecution(decodeSegment(sceneExecutionMatch[1]!)) as Promise<TResponse>
  }

  const sceneRunsMatch = path.match(new RegExp(`${projectBasePattern}/scenes/([^/]+)/runs$`))
  if (method === 'POST' && sceneRunsMatch) {
    const runBody = body as { mode?: 'continue' | 'rewrite' | 'from-scratch'; note?: string }
    return cloneFakeApiResponse(
      await mockRuntime.runClient.startSceneRun({
        sceneId: decodeSegment(sceneRunsMatch[1]!),
        mode: runBody.mode,
        note: runBody.note,
      }),
    ) as TResponse
  }

  const runMatch = path.match(new RegExp(`${projectBasePattern}/runs/([^/]+)$`))
  if (method === 'GET' && runMatch) {
    return cloneFakeApiResponse(
      await mockRuntime.runClient.getRun({
        runId: decodeSegment(runMatch[1]!),
      }),
    ) as TResponse
  }

  const runEventsMatch = path.match(new RegExp(`${projectBasePattern}/runs/([^/]+)/events$`))
  if (method === 'GET' && runEventsMatch) {
    return cloneFakeApiResponse(
      await mockRuntime.runClient.getRunEvents({
        runId: decodeSegment(runEventsMatch[1]!),
        cursor: typeof query?.cursor === 'string' ? query.cursor : undefined,
      }),
    ) as TResponse
  }

  const runReviewDecisionsMatch = path.match(new RegExp(`${projectBasePattern}/runs/([^/]+)/review-decisions$`))
  if (method === 'POST' && runReviewDecisionsMatch) {
    const reviewBody = body as {
      reviewId: string
      decision: 'accept' | 'accept-with-edit' | 'request-rewrite' | 'reject'
      note?: string
      patchId?: string
    }
    return cloneFakeApiResponse(
      await mockRuntime.runClient.submitRunReviewDecision({
        runId: decodeSegment(runReviewDecisionsMatch[1]!),
        reviewId: reviewBody.reviewId,
        decision: reviewBody.decision,
        note: reviewBody.note,
        patchId: reviewBody.patchId,
      }),
    ) as TResponse
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
