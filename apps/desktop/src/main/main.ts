import { app, BrowserWindow, ipcMain } from 'electron'

import { setApplicationMenu } from './app-menu.js'
import { createMainWindow } from './create-window.js'
import { createLocalApiSupervisor, type LocalApiSupervisor } from './local-api-supervisor.js'
import { ProjectStore } from './project-store.js'
import { resolveWorkspaceRoot } from './runtime-config.js'
import { createWorkerSupervisor, type WorkerSupervisor } from './worker-supervisor.js'
import {
  DESKTOP_API_CHANNELS,
  type CurrentProjectSnapshot,
  type DesktopPlatform,
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
})
const workerSupervisor = createWorkerSupervisor()

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
