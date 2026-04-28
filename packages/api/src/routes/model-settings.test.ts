import Fastify from 'fastify'
import { describe, expect, it } from 'vitest'

import { registerGlobalErrorHandler } from '../http/errors.js'
import { registerModelSettingsRoutes } from './model-settings.js'

describe('registerModelSettingsRoutes', () => {
  it('serves the sanitized connection test result from the narrow local API route', async () => {
    const app = Fastify()
    app.setErrorHandler((error, request, reply) => {
      registerGlobalErrorHandler(request, reply, error)
    })

    registerModelSettingsRoutes({
      app,
      apiBasePath: '/api',
      config: {
        apiBasePath: '/api',
        apiBaseUrl: 'http://127.0.0.1:4174/api',
        corsOrigin: true,
        host: '127.0.0.1',
        modelBindings: {
          continuityReviewer: { provider: 'fixture' },
          planner: { provider: 'fixture' },
          sceneProseWriter: { provider: 'fixture' },
          sceneRevision: { provider: 'fixture' },
          summary: { provider: 'fixture' },
        },
        modelProvider: 'fixture',
        port: 4174,
      },
      runModelConnectionTest: async () => ({
        status: 'passed',
        summary: 'All model roles are explicitly configured to use fixture providers.',
      }),
    })

    const response = await app.inject({
      method: 'POST',
      url: '/api/model-settings/test-connection',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      status: 'passed',
      summary: 'All model roles are explicitly configured to use fixture providers.',
    })

    await app.close()
  })
})
