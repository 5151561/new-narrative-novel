import { app, BrowserWindow, ipcMain } from 'electron'

import { setApplicationMenu } from './app-menu.js'
import { createMainWindow } from './create-window.js'
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

export function registerDesktopBridgeHandlers(): void {
  ipcMain.handle(DESKTOP_API_CHANNELS.getAppVersion, () => app.getVersion())
  ipcMain.handle(DESKTOP_API_CHANNELS.getPlatform, () => getDesktopPlatform())
  ipcMain.handle(DESKTOP_API_CHANNELS.getRuntimeMode, (): DesktopRuntimeMode => 'desktop')
}

const isDev = !app.isPackaged

registerDesktopBridgeHandlers()

app.whenReady().then(async () => {
  setApplicationMenu({ isDev })
  await createMainWindow()

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
