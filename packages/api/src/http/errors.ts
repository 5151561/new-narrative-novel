import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'

import type { ApiErrorResponse } from '../contracts/api-records.js'

export class ApiHttpError extends Error {
  readonly status: number
  readonly code?: string
  readonly detail?: unknown

  constructor({
    status,
    message,
    code,
    detail,
  }: {
    status: number
    message: string
    code?: string
    detail?: unknown
  }) {
    super(message)
    this.name = 'ApiHttpError'
    this.status = status
    this.code = code
    this.detail = detail
  }
}

export function badRequest(message: string, options: { code?: string; detail?: unknown } = {}) {
  return new ApiHttpError({
    status: 400,
    message,
    code: options.code,
    detail: options.detail,
  })
}

export function notFound(message: string, options: { code?: string; detail?: unknown } = {}) {
  return new ApiHttpError({
    status: 404,
    message,
    code: options.code,
    detail: options.detail,
  })
}

export function conflict(message: string, options: { code?: string; detail?: unknown } = {}) {
  return new ApiHttpError({
    status: 409,
    message,
    code: options.code,
    detail: options.detail,
  })
}

function toApiErrorResponse(error: unknown): ApiErrorResponse {
  if (error instanceof ApiHttpError) {
    return {
      status: error.status,
      message: error.message,
      code: error.code,
      detail: error.detail,
    }
  }

  const fastifyError = error as Partial<FastifyError>
  const status = typeof fastifyError.statusCode === 'number' && fastifyError.statusCode >= 400 ? fastifyError.statusCode : 500
  return {
    status,
    message: status >= 500 ? 'Internal Server Error' : (typeof fastifyError.message === 'string' ? fastifyError.message : 'Request failed'),
  }
}

export function registerGlobalErrorHandler(
  request: FastifyRequest,
  reply: FastifyReply,
  error: unknown,
) {
  request.log.error(error)
  const payload = toApiErrorResponse(error)
  void reply.status(payload.status).send(payload)
}
