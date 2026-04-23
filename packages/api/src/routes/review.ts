import { badRequest } from '../http/errors.js'

import type { ApiRouteContext } from './route-context.js'
import { assertEnumValue, assertOptionalString, assertRequiredString } from './validation.js'

const REVIEW_DECISION_STATUSES = ['reviewed', 'deferred', 'dismissed'] as const
const REVIEW_FIX_ACTION_STATUSES = ['started', 'checked', 'blocked'] as const
const REVIEW_FIX_ACTION_TARGET_SCOPES = ['book', 'chapter', 'scene', 'asset'] as const

export function registerReviewRoutes({ app, apiBasePath, repository }: ApiRouteContext) {
  const projectBase = `${apiBasePath}/projects/:projectId`

  app.get(`${projectBase}/books/:bookId/review-decisions`, async (request) => {
    const { projectId, bookId } = request.params as { projectId: string; bookId: string }
    return repository.getReviewDecisions(projectId, bookId)
  })

  app.put(`${projectBase}/books/:bookId/review-decisions/:issueId`, async (request) => {
    const { projectId, bookId, issueId } = request.params as {
      projectId: string
      bookId: string
      issueId: string
    }
    const body = request.body as {
      bookId?: unknown
      issueId?: unknown
      issueSignature?: unknown
      status?: unknown
      note?: unknown
    }

    const bodyBookId = assertRequiredString(body?.bookId, 'bookId', {
      code: 'INVALID_REVIEW_DECISION',
      detail: { body },
    })
    const bodyIssueId = assertRequiredString(body?.issueId, 'issueId', {
      code: 'INVALID_REVIEW_DECISION',
      detail: { body },
    })
    const issueSignature = assertRequiredString(body?.issueSignature, 'issueSignature', {
      code: 'INVALID_REVIEW_DECISION',
      detail: { body },
    })
    const status = assertEnumValue(body?.status, 'review decision status', REVIEW_DECISION_STATUSES, {
      code: 'INVALID_REVIEW_DECISION',
      detail: { body },
      allowedValuesDetailKey: 'allowedStatuses',
    })
    const note = assertOptionalString(body?.note, 'note', {
      code: 'INVALID_REVIEW_DECISION_NOTE',
      detail: { body },
    })

    if (bodyBookId !== bookId || bodyIssueId !== issueId) {
      throw badRequest('Review decision body identifiers must match the route.', {
        code: 'REVIEW_DECISION_ID_MISMATCH',
        detail: { bookId, issueId, body },
      })
    }

    return repository.setReviewDecision(projectId, {
      bookId: bodyBookId,
      issueId: bodyIssueId,
      issueSignature,
      status,
      note,
    })
  })

  app.delete(`${projectBase}/books/:bookId/review-decisions/:issueId`, async (request, reply) => {
    const { projectId, bookId, issueId } = request.params as {
      projectId: string
      bookId: string
      issueId: string
    }
    repository.clearReviewDecision(projectId, { bookId, issueId })
    return reply.status(204).send()
  })

  app.get(`${projectBase}/books/:bookId/review-fix-actions`, async (request) => {
    const { projectId, bookId } = request.params as { projectId: string; bookId: string }
    return repository.getReviewFixActions(projectId, bookId)
  })

  app.put(`${projectBase}/books/:bookId/review-fix-actions/:issueId`, async (request) => {
    const { projectId, bookId, issueId } = request.params as {
      projectId: string
      bookId: string
      issueId: string
    }
    const body = request.body as {
      bookId?: unknown
      issueId?: unknown
      issueSignature?: unknown
      sourceHandoffId?: unknown
      sourceHandoffLabel?: unknown
      targetScope?: unknown
      status?: unknown
      note?: unknown
    }

    const bodyBookId = assertRequiredString(body?.bookId, 'bookId', {
      code: 'INVALID_REVIEW_FIX_ACTION',
      detail: { body },
    })
    const bodyIssueId = assertRequiredString(body?.issueId, 'issueId', {
      code: 'INVALID_REVIEW_FIX_ACTION',
      detail: { body },
    })
    const issueSignature = assertRequiredString(body?.issueSignature, 'issueSignature', {
      code: 'INVALID_REVIEW_FIX_ACTION',
      detail: { body },
    })
    const sourceHandoffId = assertRequiredString(body?.sourceHandoffId, 'sourceHandoffId', {
      code: 'INVALID_REVIEW_FIX_ACTION',
      detail: { body },
    })
    const sourceHandoffLabel = assertRequiredString(body?.sourceHandoffLabel, 'sourceHandoffLabel', {
      code: 'INVALID_REVIEW_FIX_ACTION',
      detail: { body },
    })
    const targetScope = assertEnumValue(body?.targetScope, 'targetScope', REVIEW_FIX_ACTION_TARGET_SCOPES, {
      code: 'INVALID_REVIEW_FIX_ACTION',
      detail: { body },
      allowedValuesDetailKey: 'allowedTargetScopes',
    })
    const status = assertEnumValue(body?.status, 'review fix action status', REVIEW_FIX_ACTION_STATUSES, {
      code: 'INVALID_REVIEW_FIX_ACTION',
      detail: { body },
      allowedValuesDetailKey: 'allowedStatuses',
    })
    const note = assertOptionalString(body?.note, 'note', {
      code: 'INVALID_REVIEW_FIX_ACTION_NOTE',
      detail: { body },
    })

    if (bodyBookId !== bookId || bodyIssueId !== issueId) {
      throw badRequest('Review fix action body identifiers must match the route.', {
        code: 'REVIEW_FIX_ACTION_ID_MISMATCH',
        detail: { bookId, issueId, body },
      })
    }

    return repository.setReviewFixAction(projectId, {
      bookId: bodyBookId,
      issueId: bodyIssueId,
      issueSignature,
      sourceHandoffId,
      sourceHandoffLabel,
      targetScope,
      status,
      note,
    })
  })

  app.delete(`${projectBase}/books/:bookId/review-fix-actions/:issueId`, async (request, reply) => {
    const { projectId, bookId, issueId } = request.params as {
      projectId: string
      bookId: string
      issueId: string
    }
    repository.clearReviewFixAction(projectId, { bookId, issueId })
    return reply.status(204).send()
  })
}
