import { describe, expect, it } from 'vitest'

import { DESKTOP_API_CHANNELS, type DesktopApiChannel } from '../shared/desktop-bridge-types.js'
import { createNarrativeDesktopApi, type DesktopIpcInvoke } from './desktop-api.js'

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

      return 'desktop' as T
    }
    const api = createNarrativeDesktopApi(invoke)

    expect(Object.keys(api).sort()).toEqual([
      'getAppVersion',
      'getLocalApiLogs',
      'getLocalApiStatus',
      'getPlatform',
      'getRuntimeConfig',
      'getRuntimeMode',
      'restartLocalApi',
    ])
    expect('ipcRenderer' in api).toBe(false)
    expect('fs' in api).toBe(false)
    expect('child_process' in api).toBe(false)

    await expect(api.getAppVersion()).resolves.toBe('0.1.0')
    await expect(api.getPlatform()).resolves.toBe('darwin')
    await expect(api.getRuntimeMode()).resolves.toBe('desktop')
    expect(calls).toEqual([
      DESKTOP_API_CHANNELS.getAppVersion,
      DESKTOP_API_CHANNELS.getPlatform,
      DESKTOP_API_CHANNELS.getRuntimeMode,
    ])
  })
})
