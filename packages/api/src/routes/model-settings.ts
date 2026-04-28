import type { ApiServerConfig } from '../config.js'
import {
  runModelConnectionTest as defaultRunModelConnectionTest,
  type ModelConnectionTestRecord,
} from '../orchestration/modelGateway/modelConnectionTest.js'

export function registerModelSettingsRoutes({
  app,
  apiBasePath,
  config,
  runModelConnectionTest = defaultRunModelConnectionTest,
}: {
  app: {
    post: (path: string, handler: () => Promise<ModelConnectionTestRecord> | ModelConnectionTestRecord) => void
  }
  apiBasePath: string
  config: ApiServerConfig
  runModelConnectionTest?: typeof defaultRunModelConnectionTest
}) {
  app.post(`${apiBasePath}/model-settings/test-connection`, async () => {
    return runModelConnectionTest({
      modelBindings: config.modelBindings,
    })
  })
}
