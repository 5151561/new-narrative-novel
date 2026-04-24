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
