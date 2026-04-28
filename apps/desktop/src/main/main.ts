import path from 'node:path'

import { app, BrowserWindow, ipcMain } from 'electron'

import { setApplicationMenu } from './app-menu.js'
import { CredentialStore } from './credential-store.js'
import { createMainWindow } from './create-window.js'
import { createLocalApiSupervisor, type LocalApiSupervisor } from './local-api-supervisor.js'
import { ModelBindingStore } from './model-binding-store.js'
import { ProjectStore } from './project-store.js'
import { resolveWorkspaceRoot } from './runtime-config.js'
import { createWorkerSupervisor, type WorkerSupervisor } from './worker-supervisor.js'
import {
  createProjectBackup,
  exportProjectArchive,
} from '../../../../packages/api/src/repositories/project-backup.js'
import {
  DESKTOP_API_CHANNELS,
  type CurrentProjectSnapshot,
  type DesktopModelBinding,
  type DesktopModelSettingsSnapshot,
  type DesktopModelBindingRole,
  type DesktopPlatform,
  type ProviderCredentialProvider,
  type SaveProviderCredentialInput,
  type UpdateModelBindingInput,
  type DesktopRuntimeMode,
} from '../shared/desktop-bridge-types.js'

export function getDesktopPlatform(platform: NodeJS.Platform = process.platform): DesktopPlatform {
  if (platform === 'darwin' || platform === 'win32' || platform === 'linux') {
    return platform
  }

  return 'linux'
}

let projectStore: ProjectStore | null = null
const localApiSupervisor = createLocalApiSupervisor({
  getCurrentProject: () => projectStore?.getCurrentProject() ?? null,
  getModelBindings: async (projectRoot) => modelBindingStore.readBindings(projectRoot),
  getProviderCredential: async (provider) => credentialStore.getRawCredential(provider),
})
const workerSupervisor = createWorkerSupervisor()
const credentialStore = new CredentialStore()
const modelBindingStore = new ModelBindingStore()

function assertProviderCredentialProvider(value: unknown): ProviderCredentialProvider {
  if (value === 'openai') {
    return value
  }

  throw new Error('Unsupported credential provider.')
}

function assertNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string.`)
  }

  return value.trim()
}

function assertSaveProviderCredentialInput(value: unknown): SaveProviderCredentialInput {
  if (!value || typeof value !== 'object') {
    throw new Error('Provider credential input is required.')
  }

  const candidate = value as Partial<SaveProviderCredentialInput>

  return {
    provider: assertProviderCredentialProvider(candidate.provider),
    secret: assertNonEmptyString(candidate.secret, 'secret'),
  }
}

function assertDesktopModelBindingRole(value: unknown): DesktopModelBindingRole {
  if (
    value === 'planner'
    || value === 'sceneProseWriter'
    || value === 'sceneRevision'
    || value === 'continuityReviewer'
    || value === 'summary'
  ) {
    return value
  }

  throw new Error('Unsupported model binding role.')
}

function assertDesktopModelBinding(value: unknown): DesktopModelBinding {
  if (!value || typeof value !== 'object') {
    throw new Error('Model binding input is required.')
  }

  const candidate = value as Partial<DesktopModelBinding>
  if (candidate.provider === 'fixture') {
    return {
      provider: 'fixture',
    }
  }

  if (candidate.provider === 'openai') {
    return {
      modelId: assertNonEmptyString(candidate.modelId, 'modelId'),
      provider: 'openai',
    }
  }

  throw new Error('Unsupported model binding provider.')
}

function assertUpdateModelBindingInput(value: unknown): UpdateModelBindingInput {
  if (!value || typeof value !== 'object') {
    throw new Error('Model binding update input is required.')
  }

  const candidate = value as Partial<UpdateModelBindingInput>
  return {
    binding: assertDesktopModelBinding(candidate.binding),
    role: assertDesktopModelBindingRole(candidate.role),
  }
}

function requireCurrentProjectRoot(): string {
  const currentProject = projectStore?.getCurrentProject()
  if (!currentProject) {
    throw new Error('A selected desktop project is required before reading model bindings.')
  }

  return currentProject.projectRoot
}

async function restartLocalApiForModelConfigChange(supervisor: LocalApiSupervisor): Promise<void> {
  if (supervisor.getSnapshot().status === 'stopped') {
    return
  }

  await supervisor.restart()
}

function readCurrentProjectRootIfAvailable(): string | null {
  return projectStore?.getCurrentProject()?.projectRoot ?? null
}

async function resetStoredConnectionTestIfPossible() {
  const projectRoot = readCurrentProjectRootIfAvailable()
  if (!projectRoot) {
    return
  }

  await modelBindingStore.resetConnectionTest(projectRoot)
}

async function readModelSettingsSnapshot(projectRoot: string): Promise<DesktopModelSettingsSnapshot> {
  const record = await modelBindingStore.readModelSettingsRecord(projectRoot)
  const credentialStatus = await credentialStore.getCredentialStatus('openai')

  return {
    bindings: record.bindings,
    connectionTest: record.connectionTest,
    credentialStatus,
  }
}

export function registerDesktopBridgeHandlers(
  supervisor: LocalApiSupervisor = localApiSupervisor,
  processWorkerSupervisor: WorkerSupervisor = workerSupervisor,
): void {
  ipcMain.handle(DESKTOP_API_CHANNELS.getAppVersion, () => app.getVersion())
  ipcMain.handle(DESKTOP_API_CHANNELS.getCurrentProject, (): CurrentProjectSnapshot | null => {
    const currentProject = projectStore?.getCurrentProject()
    if (!currentProject) {
      return null
    }

    return {
      projectId: currentProject.projectId,
      projectTitle: currentProject.projectTitle,
    }
  })
  ipcMain.handle(DESKTOP_API_CHANNELS.getPlatform, () => getDesktopPlatform())
  ipcMain.handle(DESKTOP_API_CHANNELS.getRuntimeMode, (): DesktopRuntimeMode => 'desktop')
  ipcMain.handle(DESKTOP_API_CHANNELS.getRuntimeConfig, async () => {
    const snapshot = supervisor.getSnapshot().runtimeConfig ? supervisor.getSnapshot() : await supervisor.start()

    if (!snapshot.runtimeConfig) {
      throw new Error(snapshot.lastError ?? 'Local API runtime config is unavailable.')
    }

    return snapshot.runtimeConfig
  })
  ipcMain.handle(DESKTOP_API_CHANNELS.getLocalApiStatus, () => {
    const { logs: _logs, ...snapshot } = supervisor.getSnapshot()
    return snapshot
  })
  ipcMain.handle(DESKTOP_API_CHANNELS.restartLocalApi, async () => {
    const { logs: _logs, ...snapshot } = await supervisor.restart()
    return snapshot
  })
  ipcMain.handle(DESKTOP_API_CHANNELS.getLocalApiLogs, () => supervisor.getLogs())
  ipcMain.handle(DESKTOP_API_CHANNELS.getWorkerStatus, () => processWorkerSupervisor.getSnapshot())
  ipcMain.handle(DESKTOP_API_CHANNELS.restartWorker, () => processWorkerSupervisor.restart())
  ipcMain.handle(DESKTOP_API_CHANNELS.getProviderCredentialStatus, (_event, provider: unknown) => (
    credentialStore.getCredentialStatus(assertProviderCredentialProvider(provider))
  ))
  ipcMain.handle(DESKTOP_API_CHANNELS.saveProviderCredential, (_event, input: unknown) => {
    const normalized = assertSaveProviderCredentialInput(input)
    return credentialStore.saveCredential(normalized.provider, normalized.secret).then(async (status) => {
      await resetStoredConnectionTestIfPossible()
      await restartLocalApiForModelConfigChange(supervisor)
      return status
    })
  })
  ipcMain.handle(DESKTOP_API_CHANNELS.deleteProviderCredential, (_event, provider: unknown) => (
    credentialStore.deleteCredential(assertProviderCredentialProvider(provider)).then(async (status) => {
      await resetStoredConnectionTestIfPossible()
      await restartLocalApiForModelConfigChange(supervisor)
      return status
    })
  ))
  ipcMain.handle(DESKTOP_API_CHANNELS.getModelBindings, () => (
    modelBindingStore.readBindings(requireCurrentProjectRoot())
  ))
  ipcMain.handle(DESKTOP_API_CHANNELS.getModelSettingsSnapshot, () => (
    readModelSettingsSnapshot(requireCurrentProjectRoot())
  ))
  ipcMain.handle(DESKTOP_API_CHANNELS.testModelSettings, async () => {
    const projectRoot = requireCurrentProjectRoot()
    const connectionTest = await supervisor.testModelSettings()
    await modelBindingStore.writeConnectionTest(projectRoot, connectionTest)
    return connectionTest
  })
  ipcMain.handle(DESKTOP_API_CHANNELS.updateModelBinding, (_event, input: unknown) => (
    modelBindingStore.updateBinding(requireCurrentProjectRoot(), assertUpdateModelBindingInput(input)).then(async (bindings) => {
      await restartLocalApiForModelConfigChange(supervisor)
      return bindings
    })
  ))
}

const isDev = !app.isPackaged

registerDesktopBridgeHandlers()

function ensureProjectStore(): ProjectStore {
  if (!projectStore) {
    projectStore = new ProjectStore()
  }

  return projectStore
}

async function restartLocalApiForProjectSelection(): Promise<void> {
  const snapshot = localApiSupervisor.getSnapshot()
  if (snapshot.status === 'stopped') {
    return
  }

  await localApiSupervisor.restart()
}

function requireCurrentProjectSession(activeProjectStore: ProjectStore) {
  const currentProject = activeProjectStore.getCurrentProject()
  if (!currentProject) {
    throw new Error('A selected desktop project is required for this action.')
  }

  return currentProject
}

async function createManualProjectBackup(activeProjectStore: ProjectStore): Promise<void> {
  const currentProject = requireCurrentProjectSession(activeProjectStore)
  await createProjectBackup({
    projectRoot: currentProject.projectRoot,
    storeFilePath: path.join(currentProject.projectRoot, '.narrative', 'project-store.json'),
  })
}

async function exportManualProjectArchive(activeProjectStore: ProjectStore): Promise<void> {
  const currentProject = requireCurrentProjectSession(activeProjectStore)
  await exportProjectArchive({
    projectRoot: currentProject.projectRoot,
    storeFilePath: path.join(currentProject.projectRoot, '.narrative', 'project-store.json'),
  })
}

function refreshApplicationMenu(): void {
  const activeProjectStore = ensureProjectStore()

  async function recoverFromProjectMenuFailure({
    error,
    invalidProjectRoot,
  }: {
    error: unknown
    invalidProjectRoot?: string
  }) {
    if (invalidProjectRoot) {
      try {
        await activeProjectStore.forgetProjectRoot(invalidProjectRoot)
      } catch (cleanupError) {
        console.error('Desktop project menu recovery cleanup failed.', cleanupError)
      }
    }

    console.error('Desktop project menu action failed.', error)
  }

  async function runProjectMenuAction(
    action: () => Promise<void>,
    { invalidProjectRoot }: { invalidProjectRoot?: string } = {},
  ): Promise<void> {
    try {
      await action()
    } catch (error) {
      await recoverFromProjectMenuFailure({
        error,
        invalidProjectRoot,
      })
    } finally {
      refreshApplicationMenu()
    }
  }

  setApplicationMenu({
    isDev,
    onCreateProject: () => runProjectMenuAction(async () => {
      const selectedProject = await activeProjectStore.createProject()
      if (!selectedProject) {
        return
      }

      await restartLocalApiForProjectSelection()
    }),
    onOpenProject: () => runProjectMenuAction(async () => {
      const selectedProject = await activeProjectStore.openProject()
      if (!selectedProject) {
        return
      }

      await restartLocalApiForProjectSelection()
    }),
    onOpenRecentProject: (projectRoot) => runProjectMenuAction(async () => {
      await activeProjectStore.selectProjectRoot(projectRoot)
      await restartLocalApiForProjectSelection()
    }, { invalidProjectRoot: projectRoot }),
    onCreateProjectBackup: () => runProjectMenuAction(async () => {
      await createManualProjectBackup(activeProjectStore)
    }),
    onExportProjectArchive: () => runProjectMenuAction(async () => {
      await exportManualProjectArchive(activeProjectStore)
    }),
    onRestartLocalApi: () => runProjectMenuAction(async () => {
      await localApiSupervisor.restart()
    }),
    onRestartWorker: () => runProjectMenuAction(async () => {
      await workerSupervisor.restart()
    }),
    recentProjects: activeProjectStore.getRecentProjects(),
  })
}

app.whenReady().then(async () => {
  const activeProjectStore = ensureProjectStore()
  await activeProjectStore.restoreLastProject()
  if (!activeProjectStore.getCurrentProject()) {
    await activeProjectStore.selectProjectRoot(resolveWorkspaceRoot())
  }

  refreshApplicationMenu()
  await localApiSupervisor.start()
  await createMainWindow()

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow()
    }
  })
})

app.on('before-quit', () => {
  localApiSupervisor.stop()
  workerSupervisor.stop()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
