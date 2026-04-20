import { describe, expect, it } from 'vitest'

import { ApiRequestError } from './api-transport'
import { classifyApiResponseState } from './api-response-state'

describe('classifyApiResponseState', () => {
  it('treats undefined payloads without an error as pending', () => {
    expect(classifyApiResponseState({ data: undefined, error: null })).toEqual({
      kind: 'pending',
      error: null,
      message: null,
    })
  })

  it('treats ready non-empty payloads as success', () => {
    expect(classifyApiResponseState({ data: { id: 'asset-1' }, error: null })).toEqual({
      kind: 'success',
      error: null,
      message: null,
    })
  })

  it('treats null detail payloads as not found', () => {
    expect(classifyApiResponseState({ data: null, error: null }).kind).toBe('not-found')
  })

  it('treats empty arrays as empty state', () => {
    expect(classifyApiResponseState({ data: [], error: null }).kind).toBe('empty')
  })

  it.each([401, 403])('treats %s responses as auth placeholders', (status) => {
    expect(
      classifyApiResponseState({
        data: undefined,
        error: new ApiRequestError({
          status,
          message: 'Session expired',
        }),
      }).kind,
    ).toBe('auth')
  })

  it('treats 404 errors as not found', () => {
    const error = new ApiRequestError({
      status: 404,
      message: 'API boundary reported missing asset detail.',
    })

    expect(
      classifyApiResponseState({
        data: undefined,
        error,
      }),
    ).toEqual({
      kind: 'not-found',
      error,
      message: 'API boundary reported missing asset detail.',
    })
  })

  it.each([500, 503])('treats %s responses as unavailable', (status) => {
    expect(
      classifyApiResponseState({
        data: undefined,
        error: new ApiRequestError({
          status,
          message: 'Server failed',
        }),
      }).kind,
    ).toBe('unavailable')
  })

  it('treats generic errors as unavailable and preserves their message', () => {
    const error = new Error('Transport surfaced malformed JSON')

    expect(
      classifyApiResponseState({
        data: undefined,
        error,
      }),
    ).toEqual({
      kind: 'unavailable',
      error,
      message: 'Transport surfaced malformed JSON',
    })
  })
})
