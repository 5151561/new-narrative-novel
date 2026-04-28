import path from 'node:path'

import cors from '@fastify/cors'
import Fastify from 'fastify'

import { finalizeCurrentProjectConfig, getApiServerConfig, type ApiServerConfig } from './config.js'
import { notFound, registerGlobalErrorHandler } from './http/errors.js'
import {
  createScenePlannerGateway,
  type ScenePlannerGatewayDependencies,
} from './orchestration/modelGateway/scenePlannerGateway.js'
import {
  createSceneProseWriterGateway,
  type SceneProseWriterGatewayDependencies,
} from './orchestration/modelGateway/sceneProseWriterGateway.js'
import {
  createFixtureRepository,
  type FixtureRepositoryLocalProjectStore,
  type FixtureRepositoryProjectStatePersistence,
} from './repositories/fixtureRepository.js'
import { createLocalProjectStorePersistence } from './repositories/project-state-persistence.js'
import { registerAssetRoutes } from './routes/asset.js'
import { registerBookRoutes } from './routes/book.js'
import { registerChapterRoutes } from './routes/chapter.js'
import { registerProjectRuntimeRoutes } from './routes/project-runtime.js'
import { registerReviewRoutes } from './routes/review.js'
import { registerRunRoutes } from './routes/run.js'
import { registerRunArtifactRoutes } from './routes/runArtifacts.js'
import { registerSceneRoutes } from './routes/scene.js'
import { registerModelSettingsRoutes } from './routes/model-settings.js'

export interface CreateServerOptions {
  config?: ApiServerConfig
  localProjectStore?: FixtureRepositoryLocalProjectStore
  projectStatePersistence?: FixtureRepositoryProjectStatePersistence
  scenePlannerGatewayDependencies?: ScenePlannerGatewayDependencies
  sceneProseWriterGatewayDependencies?: SceneProseWriterGatewayDependencies
}

export function createServer(options: CreateServerOptions = {}) {
  const bootConfig = options.config ?? getApiServerConfig()
  const config: ApiServerConfig = {
    ...bootConfig,
    currentProject: bootConfig.currentProject && bootConfig.modelBindings
      ? finalizeCurrentProjectConfig(bootConfig.currentProject, bootConfig.modelBindings)
      : bootConfig.currentProject,
  }
  const app = Fastify()
  const scenePlannerGateway = createScenePlannerGateway(
    config,
    options.scenePlannerGatewayDependencies,
  )
  const sceneProseWriterGateway = createSceneProseWriterGateway(
    config,
    options.sceneProseWriterGatewayDependencies,
  )
  const projectStoreFilePath = config.projectStoreFilePath ?? config.projectStateFilePath
  const projectArtifactDirPath = config.projectArtifactDirPath
    ?? (projectStoreFilePath ? path.join(path.dirname(projectStoreFilePath), 'artifacts') : undefined)
  const localProjectStore = options.localProjectStore
    ?? (
      config.currentProject && projectStoreFilePath && projectArtifactDirPath
        ? createLocalProjectStorePersistence({
          filePath: projectStoreFilePath,
          artifactDirPath: projectArtifactDirPath,
          apiBaseUrl: config.apiBaseUrl,
          projectId: config.currentProject.projectId,
          projectTitle: config.currentProject.projectTitle,
        })
        : undefined
    )
  const repository = createFixtureRepository({
    apiBaseUrl: config.apiBaseUrl,
    currentProject: config.currentProject,
    scenePlannerGateway,
    sceneProseWriterGateway,
    localProjectStore,
    projectStatePersistence: options.projectStatePersistence,
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
    currentProject: config.currentProject,
    repository,
  }

  registerProjectRuntimeRoutes(routeContext)
  registerModelSettingsRoutes({
    app,
    apiBasePath: config.apiBasePath,
    config,
  })
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
