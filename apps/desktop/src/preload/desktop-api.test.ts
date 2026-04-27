import { afterEach, describe, expect, it, vi } from 'vitest'

import { DESKTOP_API_CHANNELS, type DesktopApiChannel, type NarrativeDesktopApi } from '../shared/desktop-bridge-types.js'
import { createNarrativeDesktopApi, type DesktopIpcInvoke } from './desktop-api.js'

afterEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  vi.unmock('electron')
})

describe('createNarrativeDesktopApi', () => {
  it('exposes only the v1 desktop bridge contract', async () => {
    const calls: DesktopApiChannel[] = []
    const invoke: DesktopIpcInvoke = async <T>(channel: DesktopApiChannel): Promise<T> => {
      calls.push(channel)

      if (channel === DESKTOP_API_CHANNELS.getAppVersion) {
        return '0.1.0' as T
      }

      if (channel === DESKTOP_API_CHANNELS.getPlatform) {
        return 'darwin' as T
      }

      if (channel === DESKTOP_API_CHANNELS.getCurrentProject) {
        return {
          projectId: 'local-project-alpha',
          projectTitle: 'Selected Project',
        } as T
      }

      if (channel === DESKTOP_API_CHANNELS.getWorkerStatus || channel === DESKTOP_API_CHANNELS.restartWorker) {
        return {
          implementation: 'placeholder',
          status: 'disabled',
        } as T
      }

      return 'desktop' as T
    }
    const api = createNarrativeDesktopApi(invoke)

    expect(Object.keys(api).sort()).toEqual([
      'getAppVersion',
      'getCurrentProject',
      'getLocalApiLogs',
      'getLocalApiStatus',
      'getPlatform',
      'getRuntimeConfig',
      'getRuntimeMode',
      'getWorkerStatus',
      'restartLocalApi',
      'restartWorker',
    ])
    expect('ipcRenderer' in api).toBe(false)
    expect('fs' in api).toBe(false)
    expect('child_process' in api).toBe(false)
    expect('process' in api).toBe(false)

    await expect(api.getAppVersion()).resolves.toBe('0.1.0')
    await expect(api.getCurrentProject()).resolves.toEqual({
      projectId: 'local-project-alpha',
      projectTitle: 'Selected Project',
    })
    await expect(api.getPlatform()).resolves.toBe('darwin')
    await expect(api.getRuntimeMode()).resolves.toBe('desktop')
    await expect(api.getWorkerStatus()).resolves.toEqual({
      implementation: 'placeholder',
      status: 'disabled',
    })
    await expect(api.restartWorker()).resolves.toEqual({
      implementation: 'placeholder',
      status: 'disabled',
    })
    expect(calls).toEqual([
      DESKTOP_API_CHANNELS.getAppVersion,
      DESKTOP_API_CHANNELS.getCurrentProject,
      DESKTOP_API_CHANNELS.getPlatform,
      DESKTOP_API_CHANNELS.getRuntimeMode,
      DESKTOP_API_CHANNELS.getWorkerStatus,
      DESKTOP_API_CHANNELS.restartWorker,
    ])
  })

  it('exposes the real preload entrypoint through contextBridge with only the narrow worker API surface', async () => {
    const invoke = vi.fn(async (channel: DesktopApiChannel) => {
      if (channel === DESKTOP_API_CHANNELS.getWorkerStatus || channel === DESKTOP_API_CHANNELS.restartWorker) {
        return {
          implementation: 'placeholder' as const,
          status: 'disabled' as const,
        }
      }

      return 'desktop'
    })
    const exposeInMainWorld = vi.fn()

    vi.doMock('electron', () => ({
      contextBridge: {
        exposeInMainWorld,
      },
      ipcRenderer: {
        invoke,
      },
    }))

    await import('./index.js')

    expect(exposeInMainWorld).toHaveBeenCalledTimes(1)
    const [key, api] = exposeInMainWorld.mock.calls[0] as [string, NarrativeDesktopApi]

    expect(key).toBe('narrativeDesktop')
    expect(Object.keys(api).sort()).toEqual([
      'getAppVersion',
      'getCurrentProject',
      'getLocalApiLogs',
      'getLocalApiStatus',
      'getPlatform',
      'getRuntimeConfig',
      'getRuntimeMode',
      'getWorkerStatus',
      'restartLocalApi',
      'restartWorker',
    ])
    expect('ipcRenderer' in api).toBe(false)
    expect('fs' in api).toBe(false)
    expect('child_process' in api).toBe(false)
    expect('process' in api).toBe(false)

    await expect(api.getCurrentProject()).resolves.toBe('desktop')
    await expect(api.getWorkerStatus()).resolves.toEqual({
      implementation: 'placeholder',
      status: 'disabled',
    })
    await expect(api.restartWorker()).resolves.toEqual({
      implementation: 'placeholder',
      status: 'disabled',
    })
    expect(invoke).toHaveBeenNthCalledWith(1, DESKTOP_API_CHANNELS.getCurrentProject)
    expect(invoke).toHaveBeenNthCalledWith(2, DESKTOP_API_CHANNELS.getWorkerStatus)
    expect(invoke).toHaveBeenNthCalledWith(3, DESKTOP_API_CHANNELS.restartWorker)
  })
})
