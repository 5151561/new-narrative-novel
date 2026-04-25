import { app, BrowserWindow, ipcMain } from 'electron'

import { setApplicationMenu } from './app-menu.js'
import { createMainWindow } from './create-window.js'
import { createLocalApiSupervisor, type LocalApiSupervisor } from './local-api-supervisor.js'
import {
  DESKTOP_API_CHANNELS,
  type DesktopPlatform,
  type DesktopRuntimeMode,
} from '../shared/desktop-bridge-types.js'

export function getDesktopPlatform(platform: NodeJS.Platform = process.platform): DesktopPlatform {
  if (platform === 'darwin' || platform === 'win32' || platform === 'linux') {
    return platform
  }

  return 'linux'
}

const localApiSupervisor = createLocalApiSupervisor()

export function registerDesktopBridgeHandlers(supervisor: LocalApiSupervisor = localApiSupervisor): void {
  ipcMain.handle(DESKTOP_API_CHANNELS.getAppVersion, () => app.getVersion())
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
}

const isDev = !app.isPackaged

registerDesktopBridgeHandlers()

app.whenReady().then(async () => {
  setApplicationMenu({ isDev })
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
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
