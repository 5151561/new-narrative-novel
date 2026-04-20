import { ApiRequestError } from './api-transport'

export type ApiResponseStateKind = 'success' | 'empty' | 'not-found' | 'auth' | 'unavailable' | 'pending'

export interface ApiResponseState {
  kind: ApiResponseStateKind
  error: Error | null
  message: string | null
}

export function classifyApiResponseState<T>({
  data,
  error,
}: {
  data: T | null | undefined
  error: unknown
}): ApiResponseState {
  if (error instanceof ApiRequestError) {
    if (error.status === 401 || error.status === 403) {
      return {
        kind: 'auth',
        error,
        message: error.message,
      }
    }

    if (error.status === 404) {
      return {
        kind: 'not-found',
        error,
        message: error.message,
      }
    }

    if (error.status >= 500) {
      return {
        kind: 'unavailable',
        error,
        message: error.message,
      }
    }
  }

  if (error instanceof Error) {
    return {
      kind: 'unavailable',
      error,
      message: error.message,
    }
  }

  if (data === undefined) {
    return {
      kind: 'pending',
      error: null,
      message: null,
    }
  }

  if (data === null) {
    return {
      kind: 'not-found',
      error: null,
      message: null,
    }
  }

  if (Array.isArray(data) && data.length === 0) {
    return {
      kind: 'empty',
      error: null,
      message: null,
    }
  }

  return {
    kind: 'success',
    error: null,
    message: null,
  }
}
