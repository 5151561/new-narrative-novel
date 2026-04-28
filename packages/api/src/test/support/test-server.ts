import { mkdtempSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { createServer, type CreateServerOptions } from '../../createServer.js'
import type { ApiServerConfig } from '../../config.js'
import type {
  FixtureRepositoryLocalProjectStore,
  FixtureRepositoryProjectStatePersistence,
} from '../../repositories/fixtureRepository.js'

interface CreateTestServerOptions {
  projectStateFilePath?: string
  projectStoreFilePath?: string
  projectArtifactDirPath?: string
  configOverrides?: Partial<ApiServerConfig>
  localProjectStore?: FixtureRepositoryLocalProjectStore
  projectStatePersistence?: FixtureRepositoryProjectStatePersistence
  scenePlannerGatewayDependencies?: CreateServerOptions['scenePlannerGatewayDependencies']
  sceneProseWriterGatewayDependencies?: CreateServerOptions['sceneProseWriterGatewayDependencies']
}

type CurrentProjectConfig = NonNullable<ApiServerConfig['currentProject']>

function createIsolatedProjectStateFilePath() {
  const directory = mkdtempSync(path.join(tmpdir(), 'narrative-api-test-'))

  return {
    directory,
    filePath: path.join(directory, 'local-project-store.json'),
  }
}

export function createTestServer(options: CreateTestServerOptions = {}) {
  const explicitStoreFilePath = options.projectStoreFilePath ?? options.projectStateFilePath
  const isolatedState = explicitStoreFilePath ? null : createIsolatedProjectStateFilePath()
  const projectStoreFilePath = explicitStoreFilePath ?? isolatedState!.filePath
  const defaultCurrentProject: CurrentProjectConfig | undefined = explicitStoreFilePath && !options.configOverrides?.currentProject
    ? {
      projectId: 'book-signal-arc',
      projectMode: 'demo-fixture',
      projectRoot: '/tmp/narrative-api-test-project',
      projectTitle: 'Signal Arc',
    }
    : undefined
  const server = createServer({
    config: {
      host: '127.0.0.1',
      port: 4174,
      apiBasePath: '/api',
      apiBaseUrl: 'http://127.0.0.1:4174/api',
      corsOrigin: true,
      currentProject: defaultCurrentProject,
      projectStoreFilePath,
      projectArtifactDirPath: options.projectArtifactDirPath ?? path.join(path.dirname(projectStoreFilePath), 'artifacts'),
      projectStateFilePath: projectStoreFilePath,
      modelProvider: 'fixture',
      ...options.configOverrides,
    },
    localProjectStore: options.localProjectStore,
    projectStatePersistence: options.projectStatePersistence,
    scenePlannerGatewayDependencies: options.scenePlannerGatewayDependencies,
    sceneProseWriterGatewayDependencies: options.sceneProseWriterGatewayDependencies,
  })

  return {
    ...server,
    async cleanupProjectStateFile() {
      if (!isolatedState) {
        return
      }

      await rm(isolatedState.directory, {
        recursive: true,
        force: true,
      })
    },
  }
}

export async function withTestServer(
  run: (server: ReturnType<typeof createTestServer>) => Promise<void> | void,
  options?: CreateTestServerOptions,
) {
  const server = createTestServer(options)

  try {
    await run(server)
  } finally {
    await server.app.close()
    await server.cleanupProjectStateFile()
  }
}
