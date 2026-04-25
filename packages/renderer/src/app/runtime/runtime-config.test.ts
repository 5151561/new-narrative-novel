import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createWebRuntimeConfig,
  resolveRuntimeConfig,
  type RuntimeConfig,
} from './runtime-config'
import { useRuntimeConfig } from './useRuntimeConfig'

const runtimeEnv = import.meta.env as Record<string, string | undefined>
const originalApiBaseUrl = runtimeEnv.VITE_NARRATIVE_API_BASE_URL

afterEach(() => {
  if (originalApiBaseUrl === undefined) {
    delete runtimeEnv.VITE_NARRATIVE_API_BASE_URL
  } else {
    runtimeEnv.VITE_NARRATIVE_API_BASE_URL = originalApiBaseUrl
  }

  Reflect.deleteProperty(window, 'narrativeDesktop')
})

describe('runtime config', () => {
  it('defaults web runtime config to /api while preserving env overrides', () => {
    delete runtimeEnv.VITE_NARRATIVE_API_BASE_URL

    expect(createWebRuntimeConfig()).toEqual({
      apiBaseUrl: '/api',
      runtimeMode: 'web',
    })

    runtimeEnv.VITE_NARRATIVE_API_BASE_URL = 'https://api.example.test'
    expect(createWebRuntimeConfig()).toEqual({
      apiBaseUrl: 'https://api.example.test',
      runtimeMode: 'web',
    })
  })

  it('resolves desktop-local runtime config from the narrow desktop bridge', async () => {
    const desktopConfig: RuntimeConfig = {
      apiBaseUrl: 'http://127.0.0.1:4888/api',
      runtimeMode: 'desktop-local',
    }
    Object.defineProperty(window, 'narrativeDesktop', {
      configurable: true,
      value: {
        getRuntimeConfig: vi.fn(async () => desktopConfig),
      },
    })

    await expect(resolveRuntimeConfig()).resolves.toEqual(desktopConfig)
  })

  it('useRuntimeConfig starts with web config and updates after desktop config resolves', async () => {
    const desktopConfig: RuntimeConfig = {
      apiBaseUrl: 'http://127.0.0.1:4888/api',
      runtimeMode: 'desktop-local',
    }
    Object.defineProperty(window, 'narrativeDesktop', {
      configurable: true,
      value: {
        getRuntimeConfig: vi.fn(async () => desktopConfig),
      },
    })

    const hook = renderHook(() => useRuntimeConfig())

    expect(hook.result.current.status).toBe('pending')

    await waitFor(() => {
      expect(hook.result.current).toEqual({
        runtimeConfig: desktopConfig,
        status: 'ready',
      })
    })
  })
})
