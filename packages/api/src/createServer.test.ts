import { afterEach, describe, expect, it } from 'vitest'

import { createServer } from './createServer.js'

describe('createServer', () => {
  const servers: Array<ReturnType<typeof createServer>> = []

  afterEach(async () => {
    while (servers.length > 0) {
      const server = servers.pop()
      if (server) {
        await server.app.close()
      }
    }
  })

  it('serves /healthz', async () => {
    const server = createServer({
      config: {
        host: '127.0.0.1',
        port: 4174,
        apiBasePath: '/api',
        apiBaseUrl: 'http://127.0.0.1:4174/api',
        corsOrigin: true,
      },
    })
    servers.push(server)

    const response = await server.app.inject({
      method: 'GET',
      url: '/healthz',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ ok: true })
  })

  it('returns project runtime info from the fixture repository', async () => {
    const server = createServer({
      config: {
        host: '127.0.0.1',
        port: 4174,
        apiBasePath: '/api',
        apiBaseUrl: 'http://127.0.0.1:4174/api',
        corsOrigin: true,
      },
    })
    servers.push(server)

    const response = await server.app.inject({
      method: 'GET',
      url: '/api/projects/book-signal-arc/runtime-info',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      projectId: 'book-signal-arc',
      source: 'api',
      status: 'healthy',
      capabilities: {
        read: true,
        write: true,
      },
    })
  })

  it('returns unified JSON errors for missing projects', async () => {
    const server = createServer({
      config: {
        host: '127.0.0.1',
        port: 4174,
        apiBasePath: '/api',
        apiBaseUrl: 'http://127.0.0.1:4174/api',
        corsOrigin: true,
      },
    })
    servers.push(server)

    const response = await server.app.inject({
      method: 'GET',
      url: '/api/projects/project-missing/runtime-info',
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      status: 404,
      message: 'Project project-missing was not found.',
      code: 'PROJECT_NOT_FOUND',
      detail: {
        projectId: 'project-missing',
      },
    })
  })

  it('returns the unified JSON 404 body for unmatched routes', async () => {
    const server = createServer({
      config: {
        host: '127.0.0.1',
        port: 4174,
        apiBasePath: '/api',
        apiBaseUrl: 'http://127.0.0.1:4174/api',
        corsOrigin: true,
      },
    })
    servers.push(server)

    const response = await server.app.inject({
      method: 'GET',
      url: '/api/unknown',
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      status: 404,
      message: 'Route GET /api/unknown was not found.',
      code: 'ROUTE_NOT_FOUND',
      detail: {
        method: 'GET',
        url: '/api/unknown',
      },
    })
  })

  it('resets mutable fixture state back to the seeded snapshot', async () => {
    const server = createServer({
      config: {
        host: '127.0.0.1',
        port: 4174,
        apiBasePath: '/api',
        apiBaseUrl: 'http://127.0.0.1:4174/api',
        corsOrigin: true,
      },
    })
    servers.push(server)

    const original = server.repository.exportSnapshot()
    original.projects['book-signal-arc'].runtimeInfo.summary = 'mutated outside the repository'

    const mutated = server.repository.exportSnapshot()
    mutated.projects['book-signal-arc'].runtimeInfo.summary = 'changed'
    server.repository.reset()

    expect(server.repository.exportSnapshot()).toMatchObject({
      projects: {
        'book-signal-arc': {
          runtimeInfo: {
            summary: 'Connected to fixture API runtime.',
          },
          books: {
            'book-signal-arc': {
              chapterIds: ['chapter-signals-in-rain'],
            },
          },
        },
      },
    })
  })
})
