import type { BrowserWindow, BrowserWindowConstructorOptions } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export type RendererTarget =
  | { kind: 'url'; url: string }
  | { kind: 'file'; filePath: string }

export interface MainWindowOptionsInput {
  preloadPath: string
}

export interface RendererTargetInput {
  isPackaged: boolean
  rendererDevUrl?: string
  forceProductionLoad?: boolean
  resourcesPath?: string
  desktopDistDir?: string
}

const DEFAULT_RENDERER_DEV_URL = 'http://127.0.0.1:4173'
const LOCAL_RENDERER_DEV_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])
const currentDir = path.dirname(fileURLToPath(import.meta.url))
const processWithElectronPaths = process as NodeJS.Process & { resourcesPath?: string }

export function getMainWindowOptions({ preloadPath }: MainWindowOptionsInput): BrowserWindowConstructorOptions {
  return {
    height: 900,
    minHeight: 720,
    minWidth: 1080,
    show: false,
    title: 'Narrative Novel',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: preloadPath,
      sandbox: true,
    },
    width: 1440,
  }
}

export function resolvePreloadPath(desktopDistDir = currentDir): string {
  return path.resolve(desktopDistDir, 'preload.cjs')
}

export function resolveRendererDevUrl(rendererDevUrl = DEFAULT_RENDERER_DEV_URL): string {
  const url = new URL(rendererDevUrl)

  if (!LOCAL_RENDERER_DEV_HOSTS.has(url.hostname)) {
    throw new Error(`Renderer dev URL must use a local loopback host: ${url.origin}`)
  }

  return url.toString()
}

export function resolveRendererTarget({
  isPackaged,
  rendererDevUrl = process.env.NARRATIVE_RENDERER_DEV_URL,
  forceProductionLoad = process.env.NARRATIVE_DESKTOP_LOAD_PROD === '1',
  resourcesPath = processWithElectronPaths.resourcesPath || currentDir,
  desktopDistDir = currentDir,
}: RendererTargetInput): RendererTarget {
  if (!isPackaged && !forceProductionLoad) {
    return {
      kind: 'url',
      url: resolveRendererDevUrl(rendererDevUrl || DEFAULT_RENDERER_DEV_URL),
    }
  }

  const filePath = isPackaged
    ? path.resolve(resourcesPath, 'renderer', 'index.html')
    : path.resolve(desktopDistDir, '../../../packages/renderer/dist/index.html')

  return {
    filePath,
    kind: 'file',
  }
}

export async function createMainWindow(): Promise<BrowserWindow> {
  const { app, BrowserWindow } = await import('electron')
  const window = new BrowserWindow(
    getMainWindowOptions({
      preloadPath: resolvePreloadPath(),
    }),
  )

  const target = resolveRendererTarget({
    isPackaged: app.isPackaged,
  })

  if (target.kind === 'url') {
    await window.loadURL(target.url)
  } else {
    await window.loadFile(target.filePath)
  }

  window.once('ready-to-show', () => {
    window.show()
  })

  return window
}
