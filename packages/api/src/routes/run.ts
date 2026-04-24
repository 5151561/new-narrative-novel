import { ApiHttpError, badRequest } from '../http/errors.js'

import type { ApiRouteContext } from './route-context.js'
import { assertEnumValue, assertOptionalString, assertRequiredString } from './validation.js'

const RUN_MODES = ['continue', 'rewrite', 'from-scratch'] as const
const RUN_REVIEW_DECISIONS = ['accept', 'accept-with-edit', 'request-rewrite', 'reject'] as const

export function registerRunRoutes({ app, apiBasePath, repository }: ApiRouteContext) {
  const projectBase = `${apiBasePath}/projects/:projectId`

  app.post(`${projectBase}/scenes/:sceneId/runs`, async (request) => {
    const { projectId, sceneId } = request.params as { projectId: string; sceneId: string }
    const body = request.body as { mode?: unknown; note?: unknown } | undefined
    const mode = body?.mode === undefined
      ? undefined
      : assertEnumValue(body.mode, 'mode', RUN_MODES, {
          code: 'INVALID_RUN_MODE',
          detail: { body },
          allowedValuesDetailKey: 'allowedModes',
        })
    const note = assertOptionalString(body?.note, 'note', {
      code: 'INVALID_RUN_NOTE',
      detail: { body },
    })

    return repository.startSceneRun(projectId, {
      sceneId,
      mode,
      note,
    })
  })

  app.get(`${projectBase}/runs/:runId`, async (request) => {
    const { projectId, runId } = request.params as { projectId: string; runId: string }
    return repository.getRun(projectId, runId)
  })

  app.get(`${projectBase}/runs/:runId/events`, async (request) => {
    const { projectId, runId } = request.params as { projectId: string; runId: string }
    const { cursor } = request.query as { cursor?: string }
    return repository.getRunEvents(projectId, { runId, cursor })
  })

  app.get(`${projectBase}/runs/:runId/events/stream`, async () => {
    throw new ApiHttpError({
      status: 501,
      message: 'Run event streaming is not implemented in the fixture API. Use paginated events for now.',
      code: 'RUN_EVENT_STREAM_UNIMPLEMENTED',
    })
  })

  app.post(`${projectBase}/runs/:runId/review-decisions`, async (request) => {
    const { projectId, runId } = request.params as { projectId: string; runId: string }
    const body = request.body as {
      reviewId?: unknown
      decision?: unknown
      note?: unknown
      patchId?: unknown
    }

    const reviewId = assertRequiredString(body?.reviewId, 'reviewId', {
      code: 'INVALID_RUN_REVIEW_DECISION',
      detail: { body },
    })
    const decision = assertEnumValue(body?.decision, 'run review decision', RUN_REVIEW_DECISIONS, {
      code: 'INVALID_RUN_REVIEW_DECISION',
      detail: { body },
      allowedValuesDetailKey: 'allowedDecisions',
    })
    const note = assertOptionalString(body?.note, 'note', {
      code: 'INVALID_RUN_REVIEW_NOTE',
      detail: { body },
    })
    const patchId = assertOptionalString(body?.patchId, 'patchId', {
      code: 'INVALID_RUN_REVIEW_PATCH_ID',
      detail: { body },
      allowEmpty: false,
    })

    return repository.submitRunReviewDecision(projectId, {
      runId,
      reviewId,
      decision,
      note,
      patchId,
    })
  })
}
