import cors from '@fastify/cors'
import Fastify from 'fastify'

import { getApiServerConfig, type ApiServerConfig } from './config.js'
import { notFound, registerGlobalErrorHandler } from './http/errors.js'
import {
  createScenePlannerGateway,
  type ScenePlannerGatewayDependencies,
} from './orchestration/modelGateway/scenePlannerGateway.js'
import {
  createFixtureRepository,
  type FixtureRepositoryProjectStatePersistence,
} from './repositories/fixtureRepository.js'
import { createProjectStatePersistence } from './repositories/project-state-persistence.js'
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
  projectStatePersistence?: FixtureRepositoryProjectStatePersistence
  scenePlannerGatewayDependencies?: ScenePlannerGatewayDependencies
}

export function createServer(options: CreateServerOptions = {}) {
  const config = options.config ?? getApiServerConfig()
  const app = Fastify()
  const scenePlannerGateway = createScenePlannerGateway(
    config,
    options.scenePlannerGatewayDependencies,
  )
  const repository = createFixtureRepository({
    apiBaseUrl: config.apiBaseUrl,
    scenePlannerGateway,
    projectStatePersistence: options.projectStatePersistence ?? createProjectStatePersistence({
      filePath: config.projectStateFilePath,
    }),
  })

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

  app.get(`${config.apiBasePath}/health`, async () => ({
    ok: true,
    runtime: process.env.NARRATIVE_RUNTIME ?? 'api',
  }))

  app.addHook('onReady', async () => {
    await repository.whenReady()
  })

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
