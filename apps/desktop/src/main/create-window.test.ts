import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { getMainWindowOptions, resolvePreloadPath, resolveRendererDevUrl, resolveRendererTarget } from './create-window.js'

describe('getMainWindowOptions', () => {
  it('uses the required BrowserWindow security defaults', () => {
    const preloadPath = path.resolve('/tmp/narrative-desktop/preload.js')
    const options = getMainWindowOptions({ preloadPath })

    expect(options.webPreferences).toMatchObject({
      contextIsolation: true,
      nodeIntegration: false,
      preload: preloadPath,
      sandbox: true,
    })
  })
})

describe('resolvePreloadPath', () => {
  it('uses the CommonJS preload bundle required by sandboxed Electron preload', () => {
    expect(resolvePreloadPath('/repo/apps/desktop/dist')).toBe(path.resolve('/repo/apps/desktop/dist/preload.cjs'))
  })
})

describe('resolveRendererTarget', () => {
  it('loads the renderer dev server in desktop dev mode', () => {
    expect(
      resolveRendererTarget({
        isPackaged: false,
        rendererDevUrl: 'http://127.0.0.1:5173',
      }),
    ).toEqual({
      kind: 'url',
      url: 'http://127.0.0.1:5173/',
    })
  })

  it('accepts localhost renderer dev URLs', () => {
    expect(resolveRendererDevUrl('http://localhost:5173/workbench')).toBe('http://localhost:5173/workbench')
  })

  it('rejects remote renderer dev URLs', () => {
    expect(() => resolveRendererDevUrl('https://example.com:5173')).toThrow(
      'Renderer dev URL must use a local loopback host: https://example.com:5173',
    )
  })

  it('loads the renderer dist index when production loading is forced outside a package', () => {
    const target = resolveRendererTarget({
      desktopDistDir: '/repo/apps/desktop/dist',
      forceProductionLoad: true,
      isPackaged: false,
    })

    expect(target).toEqual({
      filePath: path.resolve('/repo/packages/renderer/dist/index.html'),
      kind: 'file',
    })
  })
})
