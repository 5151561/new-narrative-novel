import Fastify from 'fastify'
import { afterEach, describe, expect, it } from 'vitest'

import { createFixtureRepository } from './repositories/fixtureRepository.js'
import { registerGlobalErrorHandler } from './http/errors.js'
import { registerProjectRuntimeRoutes } from './routes/project-runtime.js'
import { registerRunRoutes } from './routes/run.js'
import { withTestServer } from './test/support/test-server.js'

describe('fixture API server runtime info surfaces', () => {
  const extraApps = [] as Array<ReturnType<typeof Fastify>>

  afterEach(async () => {
    await Promise.all(extraApps.splice(0).map((app) => app.close()))
  })

  it('serves /healthz', async () => {
    await withTestServer(async ({ app }) => {
      const response = await app.inject({
        method: 'GET',
        url: '/healthz',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ ok: true })
    })
  })

  it('serves /api/health for desktop local API supervisor readiness', async () => {
    await withTestServer(async ({ app }) => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/health',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        ok: true,
        runtime: 'api',
      })
    })
  })

  it('returns project runtime info from the fixture repository', async () => {
    await withTestServer(async ({ app }) => {
      const [primaryProjectResponse, clonedProjectResponse] = await Promise.all([
        app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/runtime-info',
        }),
        app.inject({
          method: 'GET',
          url: '/api/projects/project-artifact-a/runtime-info',
        }),
      ])

      expect(primaryProjectResponse.statusCode).toBe(200)
      expect(primaryProjectResponse.json()).toMatchObject({
        projectId: 'book-signal-arc',
        source: 'api',
        status: 'healthy',
        capabilities: {
          read: true,
          write: true,
          runEvents: true,
          runEventPolling: true,
          runEventStream: true,
        },
      })

      expect(clonedProjectResponse.statusCode).toBe(200)
      expect(clonedProjectResponse.json()).toMatchObject({
        projectId: 'project-artifact-a',
        source: 'api',
        status: 'healthy',
        capabilities: {
          read: true,
          write: true,
          runEvents: true,
          runEventPolling: true,
          runEventStream: true,
        },
      })
    })
  })

  it('keeps runEventStream false and leaves the stream route unavailable when stream transport is disabled', async () => {
    const app = Fastify()
    extraApps.push(app)
    const repository = createFixtureRepository({
      apiBaseUrl: 'http://127.0.0.1:4174/api',
      runEventStreamEnabled: false,
      scenePlannerGateway: {
        async generate() {
          throw new Error('scene planner should not run in runtime-info coverage')
        },
      },
    })

    app.setErrorHandler((error, request, reply) => {
      registerGlobalErrorHandler(request, reply, error)
    })
    app.addHook('onReady', async () => {
      await repository.whenReady()
    })
    registerProjectRuntimeRoutes({
      app,
      apiBasePath: '/api',
      repository,
    })
    registerRunRoutes({
      app,
      apiBasePath: '/api',
      repository,
    })

    const [runtimeInfoResponse, streamResponse] = await Promise.all([
      app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/runtime-info',
      }),
      app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-001/events/stream',
      }),
    ])

    expect(runtimeInfoResponse.statusCode).toBe(200)
    expect(runtimeInfoResponse.json()).toMatchObject({
      projectId: 'book-signal-arc',
      capabilities: {
        runEvents: true,
        runEventPolling: true,
        runEventStream: false,
      },
    })
    expect(streamResponse.statusCode).toBe(501)
    expect(streamResponse.json()).toMatchObject({
      code: 'RUN_EVENT_STREAM_UNIMPLEMENTED',
    })
  })
})
