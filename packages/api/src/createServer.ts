import cors from '@fastify/cors'
import Fastify from 'fastify'

import { getApiServerConfig, type ApiServerConfig } from './config.js'
import { notFound, registerGlobalErrorHandler } from './http/errors.js'
import { createFixtureRepository } from './repositories/fixtureRepository.js'

export interface CreateServerOptions {
  config?: ApiServerConfig
}

export function createServer(options: CreateServerOptions = {}) {
  const config = options.config ?? getApiServerConfig()
  const app = Fastify()
  const repository = createFixtureRepository({ apiBaseUrl: config.apiBaseUrl })

  void app.register(cors, {
    origin: config.corsOrigin,
  })

  app.setErrorHandler((error, request, reply) => {
    registerGlobalErrorHandler(request, reply, error)
  })

  app.setNotFoundHandler((request) => {
    throw notFound(`Route ${request.method} ${request.url} was not found.`, {
      code: 'ROUTE_NOT_FOUND',
      detail: {
        method: request.method,
        url: request.url,
      },
    })
  })

  app.get('/healthz', async () => ({
    ok: true,
  }))

  app.get(`${config.apiBasePath}/projects/:projectId/runtime-info`, async (request) => {
    const { projectId } = request.params as { projectId: string }
    return repository.getProjectRuntimeInfo(projectId)
  })

  return {
    app,
    config,
    repository,
  }
}
