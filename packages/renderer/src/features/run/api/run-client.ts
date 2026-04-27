import {
  getMockRunArtifact,
  getMockRunArtifacts,
  getMockRun,
  getMockRunEvents,
  getMockRunTrace,
  startMockSceneRun,
  submitMockRunReviewDecision,
} from './mock-run-db'
import type { RunArtifactDetailResponse, RunArtifactListResponse } from './run-artifact-records'
import type {
  RunEventsPageRecord,
  RunRecord,
  StartSceneRunInput,
  SubmitRunReviewDecisionInput,
} from './run-records'
import type { RunTraceResponse } from './run-trace-records'

export interface GetRunInput {
  runId: string
}

export interface GetRunEventsInput {
  runId: string
  cursor?: string
}

export interface StreamRunEventsInput {
  runId: string
  cursor?: string
  signal?: AbortSignal
  onOpen?: () => void
  onPage: (page: RunEventsPageRecord) => void
}

export interface ListRunArtifactsInput {
  runId: string
}

export interface GetRunArtifactInput {
  runId: string
  artifactId: string
}

export interface GetRunTraceInput {
  runId: string
}

export interface RunClient {
  startSceneRun(input: StartSceneRunInput): Promise<RunRecord>
  getRun(input: GetRunInput): Promise<RunRecord | null>
  getRunEvents(input: GetRunEventsInput): Promise<RunEventsPageRecord>
  streamRunEvents?(input: StreamRunEventsInput): Promise<void>
  submitRunReviewDecision(input: SubmitRunReviewDecisionInput): Promise<RunRecord>
  listRunArtifacts(input: ListRunArtifactsInput): Promise<RunArtifactListResponse>
  getRunArtifact(input: GetRunArtifactInput): Promise<RunArtifactDetailResponse>
  getRunTrace(input: GetRunTraceInput): Promise<RunTraceResponse>
}

interface CreateRunClientOptions {
  projectId?: string
  startSceneRunRecord?: (input: StartSceneRunInput) => RunRecord
  getRunRecord?: (runId: string) => RunRecord | null
  getRunEventsPage?: (input: GetRunEventsInput) => RunEventsPageRecord
  submitRunReviewDecisionRecord?: (input: SubmitRunReviewDecisionInput) => RunRecord
  getRunArtifactsResponse?: (input: ListRunArtifactsInput) => RunArtifactListResponse
  getRunArtifactResponse?: (input: GetRunArtifactInput) => RunArtifactDetailResponse
  getRunTraceResponse?: (input: GetRunTraceInput) => RunTraceResponse
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

export function createRunClient({
  projectId,
  startSceneRunRecord = (input) => startMockSceneRun(input, projectId),
  getRunRecord = (runId) => getMockRun(runId, projectId),
  getRunEventsPage = (input) => getMockRunEvents(input, projectId),
  submitRunReviewDecisionRecord = (input) => submitMockRunReviewDecision(input, projectId),
  getRunArtifactsResponse = (input) => getMockRunArtifacts(input, projectId),
  getRunArtifactResponse = (input) => getMockRunArtifact(input, projectId),
  getRunTraceResponse = (input) => getMockRunTrace(input, projectId),
}: CreateRunClientOptions = {}): RunClient {
  return {
    async startSceneRun(input) {
      return clone(startSceneRunRecord(input))
    },
    async getRun({ runId }) {
      return clone(getRunRecord(runId))
    },
    async getRunEvents(input) {
      return clone(getRunEventsPage(input))
    },
    async streamRunEvents({ runId, cursor, signal, onOpen, onPage }) {
      onOpen?.()

      const seenCursors = new Set<string | undefined>()
      let nextCursor = cursor

      while (!signal?.aborted && !seenCursors.has(nextCursor)) {
        seenCursors.add(nextCursor)
        const page = clone(getRunEventsPage({ runId, cursor: nextCursor }))
        onPage(page)

        if (!page.nextCursor) {
          break
        }

        nextCursor = page.nextCursor
        await Promise.resolve()
      }
    },
    async submitRunReviewDecision(input) {
      return clone(submitRunReviewDecisionRecord(input))
    },
    async listRunArtifacts(input) {
      return clone(getRunArtifactsResponse(input))
    },
    async getRunArtifact(input) {
      return clone(getRunArtifactResponse(input))
    },
    async getRunTrace(input) {
      return clone(getRunTraceResponse(input))
    },
  }
}

export const runClient = createRunClient()
