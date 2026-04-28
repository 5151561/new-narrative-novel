import { ApiHttpError, badRequest } from '../http/errors.js'

import type { RunSelectedProposalVariantRecord } from '../contracts/api-records.js'
import type { ApiRouteContext } from './route-context.js'
import { assertEnumValue, assertOptionalString, assertRequiredString } from './validation.js'

const RUN_MODES = ['continue', 'rewrite', 'from-scratch'] as const
const RUN_REVIEW_DECISIONS = ['accept', 'accept-with-edit', 'request-rewrite', 'reject'] as const

function assertOptionalSelectedVariants(
  value: unknown,
  body: unknown,
): RunSelectedProposalVariantRecord[] | undefined {
  if (value === undefined) {
    return undefined
  }

  if (!Array.isArray(value)) {
    throw badRequest('selectedVariants must be an array when provided.', {
      code: 'INVALID_RUN_REVIEW_SELECTED_VARIANTS',
      detail: { body },
    })
  }

  return value.map((item, index) => {
    const detail = { body, index }
    const proposalId = assertRequiredString((item as { proposalId?: unknown } | undefined)?.proposalId, 'selectedVariants.proposalId', {
      code: 'INVALID_RUN_REVIEW_SELECTED_VARIANTS',
      detail,
    })
    const variantId = assertRequiredString((item as { variantId?: unknown } | undefined)?.variantId, 'selectedVariants.variantId', {
      code: 'INVALID_RUN_REVIEW_SELECTED_VARIANTS',
      detail,
    })

    return {
      proposalId,
      variantId,
    }
  })
}

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

  app.get(`${projectBase}/runs/:runId/events/stream`, async (request, reply) => {
    const { projectId, runId } = request.params as { projectId: string; runId: string }
    const { cursor } = request.query as { cursor?: string }
    if (!repository.supportsRunEventStream()) {
      throw new ApiHttpError({
        status: 501,
        message: 'Run event streaming is not implemented in the fixture API. Use paginated events for now.',
        code: 'RUN_EVENT_STREAM_UNIMPLEMENTED',
      })
    }

    const abortController = new AbortController()
    const stream = repository.streamRunEvents(projectId, {
      runId,
      cursor,
      signal: abortController.signal,
    })

    reply.hijack()
    reply.raw.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    })
    reply.raw.flushHeaders?.()
    reply.raw.write(': stream-open\n\n')

    const abortStream = () => abortController.abort()
    request.raw.on('close', abortStream)

    try {
      for await (const page of stream) {
        const lastEventId = page.events.at(-1)?.id
        if (lastEventId) {
          reply.raw.write(`id: ${lastEventId}\n`)
        }

        reply.raw.write('event: run-events\n')
        reply.raw.write(`data: ${JSON.stringify(page)}\n\n`)
      }
    } finally {
      request.raw.off('close', abortStream)
      if (!reply.raw.writableEnded) {
        reply.raw.end()
      }
    }
  })

  app.post(`${projectBase}/runs/:runId/retry`, async (request) => {
    const { projectId, runId } = request.params as { projectId: string; runId: string }
    const body = request.body as { mode?: unknown } | undefined
    const mode = body?.mode === undefined
      ? undefined
      : assertEnumValue(body.mode, 'mode', RUN_MODES, {
          code: 'INVALID_RUN_MODE',
          detail: { body },
          allowedValuesDetailKey: 'allowedModes',
        })

    return repository.retryRun(projectId, {
      runId,
      mode,
    })
  })

  app.post(`${projectBase}/runs/:runId/cancel`, async (request) => {
    const { projectId, runId } = request.params as { projectId: string; runId: string }
    const body = request.body as { reason?: unknown } | undefined
    const reason = assertOptionalString(body?.reason, 'reason', {
      code: 'INVALID_RUN_CANCEL_REASON',
      detail: { body },
    })

    return repository.cancelRun(projectId, {
      runId,
      reason,
    })
  })

  app.post(`${projectBase}/runs/:runId/resume`, async (request) => {
    const { projectId, runId } = request.params as { projectId: string; runId: string }
    return repository.resumeRun(projectId, {
      runId,
    })
  })

  app.post(`${projectBase}/runs/:runId/review-decisions`, async (request) => {
    const { projectId, runId } = request.params as { projectId: string; runId: string }
    const body = request.body as {
      reviewId?: unknown
      decision?: unknown
      note?: unknown
      patchId?: unknown
      selectedVariants?: unknown
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
    const selectedVariants = assertOptionalSelectedVariants(body?.selectedVariants, body)

    return repository.submitRunReviewDecision(projectId, {
      runId,
      reviewId,
      decision,
      note,
      patchId,
      selectedVariants,
    })
  })
}
