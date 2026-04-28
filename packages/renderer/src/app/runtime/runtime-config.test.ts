import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createWebRuntimeConfig,
  getRuntimeKindFromRuntimeConfig,
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

  it('resolves the web runtime config from env when no desktop bridge is present', async () => {
    runtimeEnv.VITE_NARRATIVE_API_BASE_URL = 'https://api.example.test'

    const runtimeConfig = await resolveRuntimeConfig()

    expect(runtimeConfig).toEqual({
      apiBaseUrl: 'https://api.example.test',
      runtimeMode: 'web',
    })
    expect(getRuntimeKindFromRuntimeConfig(runtimeConfig)).toBe('fixture-demo')
  })

  it('resolves desktop-local runtime config from the narrow desktop bridge', async () => {
    const desktopConfig: RuntimeConfig = {
      apiBaseUrl: 'http://127.0.0.1:4888/api',
      projectId: 'desktop-project-signal-arc',
      projectMode: 'real-project',
      projectTitle: 'Signal Arc Desktop',
      runtimeMode: 'desktop-local',
    }
    Object.defineProperty(window, 'narrativeDesktop', {
      configurable: true,
      value: {
        getRuntimeConfig: vi.fn(async () => desktopConfig),
      },
    })

    const runtimeConfig = await resolveRuntimeConfig()

    expect(runtimeConfig).toEqual(desktopConfig)
    expect(getRuntimeKindFromRuntimeConfig(runtimeConfig)).toBe('real-local-project')
  })

  it('fails loudly when desktop-local runtime config omits the current project identity', async () => {
    Object.defineProperty(window, 'narrativeDesktop', {
      configurable: true,
      value: {
        getRuntimeConfig: vi.fn(async () => ({
          apiBaseUrl: 'http://127.0.0.1:4888/api',
          projectMode: 'real-project',
          runtimeMode: 'desktop-local',
        })),
      },
    })

    await expect(resolveRuntimeConfig()).rejects.toThrow('Desktop runtime config response is invalid.')
  })

  it('fails loudly when the desktop bridge returns an invalid runtime config', async () => {
    Object.defineProperty(window, 'narrativeDesktop', {
      configurable: true,
      value: {
        getRuntimeConfig: vi.fn(async () => ({
          apiBaseUrl: '',
          projectMode: 'real-project',
          runtimeMode: 'desktop-local',
        })),
      },
    })

    await expect(resolveRuntimeConfig()).rejects.toThrow('Desktop runtime config response is invalid.')
  })

  it('useRuntimeConfig starts with web config and updates after desktop config resolves', async () => {
    const desktopConfig: RuntimeConfig = {
      apiBaseUrl: 'http://127.0.0.1:4888/api',
      projectId: 'desktop-project-signal-arc',
      projectMode: 'real-project',
      projectTitle: 'Signal Arc Desktop',
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

    expect(getRuntimeKindFromRuntimeConfig((hook.result.current as { runtimeConfig: RuntimeConfig }).runtimeConfig)).toBe(
      'real-local-project',
    )
  })

  it('maps demo-fixture desktop runtime config back to fixture-demo instead of real-local-project', async () => {
    const desktopConfig: RuntimeConfig = {
      apiBaseUrl: 'http://127.0.0.1:4888/api',
      projectId: 'book-signal-arc',
      projectMode: 'demo-fixture',
      projectTitle: 'Signal Arc Demo',
      runtimeMode: 'desktop-local',
    }
    Object.defineProperty(window, 'narrativeDesktop', {
      configurable: true,
      value: {
        getRuntimeConfig: vi.fn(async () => desktopConfig),
      },
    })

    const runtimeConfig = await resolveRuntimeConfig()

    expect(runtimeConfig).toEqual(desktopConfig)
    expect(getRuntimeKindFromRuntimeConfig(runtimeConfig)).toBe('fixture-demo')
  })

  it('useRuntimeConfig surfaces invalid desktop runtime config errors instead of silently falling back', async () => {
    Object.defineProperty(window, 'narrativeDesktop', {
      configurable: true,
      value: {
        getRuntimeConfig: vi.fn(async () => ({
          apiBaseUrl: '',
          projectMode: 'real-project',
          runtimeMode: 'desktop-local',
        })),
      },
    })

    const hook = renderHook(() => useRuntimeConfig())

    expect(hook.result.current.status).toBe('pending')

    await waitFor(() => {
      expect(hook.result.current.status).toBe('error')
    })

    expect(hook.result.current).toMatchObject({
      error: new Error('Desktop runtime config response is invalid.'),
      status: 'error',
    })
  })
})
