import { contextBridge, ipcRenderer } from 'electron'

import { createNarrativeDesktopApi } from './desktop-api.js'

contextBridge.exposeInMainWorld(
  'narrativeDesktop',
  createNarrativeDesktopApi((channel) => ipcRenderer.invoke(channel)),
)
