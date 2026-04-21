import { ApiRequestError } from './api-transport'

export type ApiWriteErrorStateKind =
  | 'validation'
  | 'conflict'
  | 'auth'
  | 'not-found'
  | 'unavailable'
  | 'unknown'

export interface ApiWriteErrorState {
  kind: ApiWriteErrorStateKind
  error: Error
  message: string
  code?: string
  detail?: unknown
}

export function classifyApiWriteErrorState(error: unknown): ApiWriteErrorState {
  if (error instanceof ApiRequestError) {
    return {
      kind: classifyApiWriteErrorKind(error.status),
      error,
      message: error.message,
      code: error.code,
      detail: error.detail,
    }
  }

  if (error instanceof Error) {
    return {
      kind: 'unknown',
      error,
      message: error.message,
      code: undefined,
      detail: undefined,
    }
  }

  const normalizedError = new Error('Unknown API write failure')

  return {
    kind: 'unknown',
    error: normalizedError,
    message: normalizedError.message,
    code: undefined,
    detail: undefined,
  }
}

function classifyApiWriteErrorKind(status: number): ApiWriteErrorStateKind {
  if (status === 400 || status === 422) {
    return 'validation'
  }

  if (status === 409) {
    return 'conflict'
  }

  if (status === 401 || status === 403) {
    return 'auth'
  }

  if (status === 404) {
    return 'not-found'
  }

  if (status >= 500) {
    return 'unavailable'
  }

  return 'unknown'
}
