import cors from '@fastify/cors'
import Fastify from 'fastify'

import { getApiServerConfig, type ApiServerConfig } from './config.js'
import { notFound, registerGlobalErrorHandler } from './http/errors.js'
import { createFixtureRepository } from './repositories/fixtureRepository.js'
import { registerAssetRoutes } from './routes/asset.js'
import { registerBookRoutes } from './routes/book.js'
import { registerChapterRoutes } from './routes/chapter.js'
import { registerProjectRuntimeRoutes } from './routes/project-runtime.js'
import { registerReviewRoutes } from './routes/review.js'
import { registerRunRoutes } from './routes/run.js'
import { registerRunArtifactRoutes } from './routes/runArtifacts.js'
import { registerSceneRoutes } from './routes/scene.js'

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

  const routeContext = {
    app,
    apiBasePath: config.apiBasePath,
    repository,
  }

  registerProjectRuntimeRoutes(routeContext)
  registerBookRoutes(routeContext)
  registerChapterRoutes(routeContext)
  registerAssetRoutes(routeContext)
  registerReviewRoutes(routeContext)
  registerSceneRoutes(routeContext)
  registerRunRoutes(routeContext)
  registerRunArtifactRoutes(routeContext)

  return {
    app,
    config,
    repository,
  }
}
