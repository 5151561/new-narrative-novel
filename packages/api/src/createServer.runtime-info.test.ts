import Fastify from 'fastify'
import { afterEach, describe, expect, it } from 'vitest'

import type { ProjectRuntimeInfoRecord } from './contracts/api-records.js'
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
      const primaryRuntimeInfo = primaryProjectResponse.json() as ProjectRuntimeInfoRecord
      expect(primaryRuntimeInfo.runtimeKind).toBe('fixture-demo')
      expect(primaryRuntimeInfo).toMatchObject({
        projectId: 'book-signal-arc',
        runtimeKind: 'fixture-demo',
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
      const clonedRuntimeInfo = clonedProjectResponse.json() as ProjectRuntimeInfoRecord
      expect(clonedRuntimeInfo.runtimeKind).toBe('fixture-demo')
      expect(clonedRuntimeInfo).toMatchObject({
        projectId: 'project-artifact-a',
        runtimeKind: 'fixture-demo',
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

  it('keeps a selected local project on real-local-project runtime kind even when it reuses the canonical fixture project id', async () => {
    await withTestServer(async ({ app }) => {
      const [selectedProjectResponse, otherProjectResponse] = await Promise.all([
        app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/runtime-info',
        }),
        app.inject({
          method: 'GET',
          url: '/api/projects/project-artifact-a/runtime-info',
        }),
      ])

      expect(selectedProjectResponse.statusCode).toBe(200)
      const selectedRuntimeInfo = selectedProjectResponse.json() as ProjectRuntimeInfoRecord
      expect(selectedRuntimeInfo.runtimeKind).toBe('real-local-project')
      expect(selectedRuntimeInfo).toMatchObject({
        projectId: 'book-signal-arc',
        projectTitle: 'Desktop Local Prototype',
        runtimeKind: 'real-local-project',
        summary: 'Connected to local project store v1.',
        versionLabel: 'local-project-store-v1',
      })

      expect(otherProjectResponse.statusCode).toBe(200)
      const otherRuntimeInfo = otherProjectResponse.json() as ProjectRuntimeInfoRecord
      expect(otherRuntimeInfo.runtimeKind).toBe('fixture-demo')
      expect(otherRuntimeInfo).toMatchObject({
        projectId: 'project-artifact-a',
        projectTitle: 'Signal Arc',
        runtimeKind: 'fixture-demo',
      })
    }, {
      configOverrides: {
        currentProject: {
          projectId: 'book-signal-arc',
          projectRoot: '/tmp/desktop-local-prototype',
          projectTitle: 'Desktop Local Prototype',
        },
      },
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

  it('returns selected local project runtime info from the local project store for local-project-alpha', async () => {
    await withTestServer(async ({ app }) => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/projects/local-project-alpha/runtime-info',
      })

      expect(response.statusCode).toBe(200)
      const runtimeInfo = response.json() as ProjectRuntimeInfoRecord
      expect(runtimeInfo.runtimeKind).toBe('real-local-project')
      expect(runtimeInfo).toMatchObject({
        projectId: 'local-project-alpha',
        projectTitle: 'Local Project Alpha',
        runtimeKind: 'real-local-project',
        source: 'api',
        status: 'healthy',
        summary: 'Connected to local project store v1.',
        versionLabel: 'local-project-store-v1',
      })
    }, {
      configOverrides: {
        currentProject: {
          projectId: 'local-project-alpha',
          projectRoot: '/tmp/local-project-alpha',
          projectTitle: 'Local Project Alpha',
        },
      },
    })
  })
})
