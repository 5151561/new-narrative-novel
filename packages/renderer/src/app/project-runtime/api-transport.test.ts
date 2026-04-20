import { describe, expect, it, vi } from 'vitest'

import { ApiRequestError, createApiTransport } from './api-transport'

describe('api transport', () => {
  it('serializes query parameters, sends JSON bodies, and parses JSON responses', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe('https://api.example.test/projects/project-1/books/book-1?locale=zh-CN&includeDraft=true&page=2')
      expect(init).toMatchObject({
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hello: 'world' }),
      })

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    })

    const transport = createApiTransport({
      baseUrl: 'https://api.example.test',
      fetch: fetchImpl,
    })

    await expect(
      transport.requestJson({
        method: 'POST',
        path: '/projects/project-1/books/book-1',
        query: {
          locale: 'zh-CN',
          includeDraft: true,
          page: 2,
          ignored: undefined,
        },
        body: { hello: 'world' },
      }),
    ).resolves.toEqual({ ok: true })
  })

  it('returns undefined for 204 and empty responses', async () => {
    const responses = [
      new Response(null, { status: 204 }),
      new Response('', { status: 200, headers: { 'Content-Type': 'application/json' } }),
    ]
    const fetchImpl = vi.fn(async () => {
      const response = responses.shift()
      if (!response) {
        throw new Error('No response queued')
      }
      return response
    })

    const transport = createApiTransport({
      baseUrl: 'https://api.example.test',
      fetch: fetchImpl,
    })

    await expect(transport.requestJson({ method: 'DELETE', path: '/projects/project-1/books/book-1' })).resolves.toBeUndefined()
    await expect(transport.requestJson({ method: 'GET', path: '/projects/project-1/books/book-1' })).resolves.toBeUndefined()
  })

  it('throws ApiRequestError for non-2xx responses', async () => {
    const transport = createApiTransport({
      baseUrl: 'https://api.example.test',
      fetch: vi.fn(async () =>
        new Response(
          JSON.stringify({
            message: 'Book not found',
            code: 'BOOK_NOT_FOUND',
            detail: { bookId: 'book-404' },
          }),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      ),
    })

    await expect(
      transport.requestJson({
        method: 'GET',
        path: '/projects/project-1/books/book-404/structure',
      }),
    ).rejects.toEqual(
      expect.objectContaining<ApiRequestError>({
        name: 'ApiRequestError',
        status: 404,
        message: 'Book not found',
        code: 'BOOK_NOT_FOUND',
        detail: { bookId: 'book-404' },
      }),
    )
  })

  it('keeps non-JSON HTTP failures as HTTP failures', async () => {
    const transport = createApiTransport({
      baseUrl: 'https://api.example.test',
      fetch: vi.fn(async () =>
        new Response('<html><body>Bad gateway</body></html>', {
          status: 502,
          statusText: 'Bad Gateway',
          headers: {
            'Content-Type': 'text/html',
          },
        }),
      ),
    })

    await expect(
      transport.requestJson({
        method: 'GET',
        path: '/api/projects/project-1/runtime-info',
      }),
    ).rejects.toEqual(
      expect.objectContaining<ApiRequestError>({
        name: 'ApiRequestError',
        status: 502,
        message: 'Bad Gateway',
        detail: '<html><body>Bad gateway</body></html>',
      }),
    )
  })

  it('throws ApiRequestError when a success response contains malformed JSON', async () => {
    const transport = createApiTransport({
      baseUrl: 'https://api.example.test',
      fetch: vi.fn(async () =>
        new Response('{not valid json', {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      ),
    })

    await expect(
      transport.requestJson({
        method: 'GET',
        path: '/projects/project-1/books/book-1/structure',
      }),
    ).rejects.toEqual(
      expect.objectContaining<ApiRequestError>({
        name: 'ApiRequestError',
        status: 200,
      }),
    )
  })
})
