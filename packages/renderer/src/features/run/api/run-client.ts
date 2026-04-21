import {
  getMockRun,
  getMockRunEvents,
  startMockSceneRun,
  submitMockRunReviewDecision,
} from './mock-run-db'
import type {
  RunEventsPageRecord,
  RunRecord,
  StartSceneRunInput,
  SubmitRunReviewDecisionInput,
} from './run-records'

export interface GetRunInput {
  runId: string
}

export interface GetRunEventsInput {
  runId: string
  cursor?: string
}

export interface RunClient {
  startSceneRun(input: StartSceneRunInput): Promise<RunRecord>
  getRun(input: GetRunInput): Promise<RunRecord | null>
  getRunEvents(input: GetRunEventsInput): Promise<RunEventsPageRecord>
  submitRunReviewDecision(input: SubmitRunReviewDecisionInput): Promise<RunRecord>
}

interface CreateRunClientOptions {
  projectId?: string
  startSceneRunRecord?: (input: StartSceneRunInput) => RunRecord
  getRunRecord?: (runId: string) => RunRecord | null
  getRunEventsPage?: (input: GetRunEventsInput) => RunEventsPageRecord
  submitRunReviewDecisionRecord?: (input: SubmitRunReviewDecisionInput) => RunRecord
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
  }
}

export const runClient = createRunClient()
