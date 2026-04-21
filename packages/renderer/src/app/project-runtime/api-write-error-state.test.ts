import { describe, expect, it } from 'vitest'

import { ApiRequestError } from './api-transport'
import { classifyApiWriteErrorState } from './api-write-error-state'

describe('classifyApiWriteErrorState', () => {
  it.each([
    { status: 400, kind: 'validation' },
    { status: 422, kind: 'validation' },
    { status: 409, kind: 'conflict' },
    { status: 401, kind: 'auth' },
    { status: 403, kind: 'auth' },
    { status: 404, kind: 'not-found' },
    { status: 500, kind: 'unavailable' },
    { status: 503, kind: 'unavailable' },
    { status: 418, kind: 'unknown' },
  ] as const)('classifies ApiRequestError status $status as $kind', ({ status, kind }) => {
    const error = new ApiRequestError({
      status,
      message: `error-${status}`,
      code: `code-${status}`,
      detail: { status },
    })

    expect(classifyApiWriteErrorState(error)).toEqual({
      kind,
      error,
      message: `error-${status}`,
      code: `code-${status}`,
      detail: { status },
    })
  })

  it('classifies generic errors as unknown without fabricating code or detail', () => {
    const error = new Error('generic failure')

    expect(classifyApiWriteErrorState(error)).toEqual({
      kind: 'unknown',
      error,
      message: 'generic failure',
      code: undefined,
      detail: undefined,
    })
  })

  it('normalizes non-Error throw values into a synthetic unknown write failure', () => {
    expect(classifyApiWriteErrorState({ reason: 'plain-object throw' })).toEqual({
      kind: 'unknown',
      error: expect.objectContaining({
        name: 'Error',
        message: 'Unknown API write failure',
      }),
      message: 'Unknown API write failure',
      code: undefined,
      detail: undefined,
    })

    expect(classifyApiWriteErrorState('primitive throw')).toEqual({
      kind: 'unknown',
      error: expect.objectContaining({
        name: 'Error',
        message: 'Unknown API write failure',
      }),
      message: 'Unknown API write failure',
      code: undefined,
      detail: undefined,
    })
  })
})
