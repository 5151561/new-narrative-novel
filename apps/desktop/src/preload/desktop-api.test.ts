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
    const calls: Array<{ channel: DesktopApiChannel; payload: unknown[] }> = []
    const invoke: DesktopIpcInvoke = async <T>(channel: DesktopApiChannel, ...payload: unknown[]): Promise<T> => {
      calls.push({ channel, payload })

      if (channel === DESKTOP_API_CHANNELS.getAppVersion) {
        return '0.1.0' as T
      }

      if (channel === DESKTOP_API_CHANNELS.getPlatform) {
        return 'darwin' as T
      }

      if (channel === DESKTOP_API_CHANNELS.getCurrentProject) {
        return {
          projectId: 'local-project-alpha',
          projectMode: 'real-project',
          projectTitle: 'Selected Project',
        } as T
      }

      if (
        channel === DESKTOP_API_CHANNELS.openDemoProject
        || channel === DESKTOP_API_CHANNELS.createRealProject
        || channel === DESKTOP_API_CHANNELS.openExistingProject
      ) {
        return {
          projectId: channel === DESKTOP_API_CHANNELS.openDemoProject ? 'book-signal-arc' : 'local-project-alpha',
          projectMode: channel === DESKTOP_API_CHANNELS.openDemoProject ? 'demo-fixture' : 'real-project',
          projectTitle: channel === DESKTOP_API_CHANNELS.openDemoProject ? 'Signal Arc Demo' : 'Selected Project',
        } as T
      }

      if (channel === DESKTOP_API_CHANNELS.getRuntimeConfig) {
        return {
          apiBaseUrl: 'http://127.0.0.1:4888/api',
          apiHealthUrl: 'http://127.0.0.1:4888/api/health',
          port: 4888,
          projectId: 'local-project-alpha',
          projectMode: 'real-project',
          projectTitle: 'Selected Project',
          runtimeMode: 'desktop-local',
        } as T
      }

      if (channel === DESKTOP_API_CHANNELS.getLocalApiStatus || channel === DESKTOP_API_CHANNELS.restartLocalApi) {
        return {
          lastError: undefined,
          runtimeConfig: {
            apiBaseUrl: 'http://127.0.0.1:4888/api',
            apiHealthUrl: 'http://127.0.0.1:4888/api/health',
            port: 4888,
            projectId: 'local-project-alpha',
            projectMode: 'real-project',
            projectTitle: 'Selected Project',
            runtimeMode: 'desktop-local',
          },
          status: 'ready',
        } as T
      }

      if (channel === DESKTOP_API_CHANNELS.getLocalApiLogs) {
        return ['[stdout] api ready'] as T
      }

      if (channel === DESKTOP_API_CHANNELS.getWorkerStatus || channel === DESKTOP_API_CHANNELS.restartWorker) {
        return {
          implementation: 'placeholder',
          status: 'disabled',
        } as T
      }

      if (
        channel === DESKTOP_API_CHANNELS.getProviderCredentialStatus
        || channel === DESKTOP_API_CHANNELS.saveProviderCredential
        || channel === DESKTOP_API_CHANNELS.deleteProviderCredential
      ) {
        return {
          configured: true,
          provider: 'openai',
          redactedValue: 'sk-...alue',
        } as T
      }

      if (channel === DESKTOP_API_CHANNELS.getModelBindings || channel === DESKTOP_API_CHANNELS.updateModelBinding) {
        return {
          continuityReviewer: { provider: 'fixture' },
          planner: { modelId: 'gpt-5.4', provider: 'openai' },
          sceneProseWriter: { provider: 'fixture' },
          sceneRevision: { provider: 'fixture' },
          summary: { provider: 'fixture' },
        } as T
      }

      if (channel === DESKTOP_API_CHANNELS.getModelSettingsSnapshot) {
        return {
          bindings: {
            continuityReviewer: { provider: 'fixture' },
            planner: { modelId: 'gpt-5.4', provider: 'openai' },
            sceneProseWriter: { provider: 'fixture' },
            sceneRevision: { provider: 'fixture' },
            summary: { provider: 'fixture' },
          },
          connectionTest: {
            status: 'never',
          },
          credentialStatus: {
            configured: false,
            provider: 'openai',
          },
        } as T
      }

      if (channel === DESKTOP_API_CHANNELS.testModelSettings) {
        return {
          status: 'failed',
          errorCode: 'missing_key',
          summary: 'OpenAI API key is missing.',
        } as T
      }

      return 'desktop' as T
    }
    const api = createNarrativeDesktopApi(invoke)

    expect(Object.keys(api).sort()).toEqual([
      'createRealProject',
      'deleteProviderCredential',
      'getAppVersion',
      'getCurrentProject',
      'getLocalApiLogs',
      'getLocalApiStatus',
      'getModelBindings',
      'getModelSettingsSnapshot',
      'getPlatform',
      'getProviderCredentialStatus',
      'getRuntimeConfig',
      'getRuntimeMode',
      'getWorkerStatus',
      'openDemoProject',
      'openExistingProject',
      'restartLocalApi',
      'restartWorker',
      'saveProviderCredential',
      'testModelSettings',
      'updateModelBinding',
    ])
    expect('ipcRenderer' in api).toBe(false)
    expect('fs' in api).toBe(false)
    expect('child_process' in api).toBe(false)
    expect('getRawCredential' in api).toBe(false)
    expect('listSecrets' in api).toBe(false)
    expect('process' in api).toBe(false)

    await expect(api.getAppVersion()).resolves.toBe('0.1.0')
    await expect(api.getCurrentProject()).resolves.toEqual({
      projectId: 'local-project-alpha',
      projectMode: 'real-project',
      projectTitle: 'Selected Project',
    })
    await expect(api.openDemoProject()).resolves.toEqual({
      projectId: 'book-signal-arc',
      projectMode: 'demo-fixture',
      projectTitle: 'Signal Arc Demo',
    })
    await expect(api.createRealProject()).resolves.toEqual({
      projectId: 'local-project-alpha',
      projectMode: 'real-project',
      projectTitle: 'Selected Project',
    })
    await expect(api.openExistingProject()).resolves.toEqual({
      projectId: 'local-project-alpha',
      projectMode: 'real-project',
      projectTitle: 'Selected Project',
    })
    await expect(api.getPlatform()).resolves.toBe('darwin')
    await expect(api.getRuntimeMode()).resolves.toBe('desktop')
    await expect(api.getRuntimeConfig()).resolves.toEqual({
      apiBaseUrl: 'http://127.0.0.1:4888/api',
      apiHealthUrl: 'http://127.0.0.1:4888/api/health',
      port: 4888,
      projectId: 'local-project-alpha',
      projectMode: 'real-project',
      projectTitle: 'Selected Project',
      runtimeMode: 'desktop-local',
    })
    await expect(api.getLocalApiStatus()).resolves.toEqual({
      lastError: undefined,
      runtimeConfig: {
        apiBaseUrl: 'http://127.0.0.1:4888/api',
        apiHealthUrl: 'http://127.0.0.1:4888/api/health',
        port: 4888,
        projectId: 'local-project-alpha',
        projectMode: 'real-project',
        projectTitle: 'Selected Project',
        runtimeMode: 'desktop-local',
      },
      status: 'ready',
    })
    await expect(api.restartLocalApi()).resolves.toEqual({
      lastError: undefined,
      runtimeConfig: {
        apiBaseUrl: 'http://127.0.0.1:4888/api',
        apiHealthUrl: 'http://127.0.0.1:4888/api/health',
        port: 4888,
        projectId: 'local-project-alpha',
        projectMode: 'real-project',
        projectTitle: 'Selected Project',
        runtimeMode: 'desktop-local',
      },
      status: 'ready',
    })
    await expect(api.getLocalApiLogs()).resolves.toEqual(['[stdout] api ready'])
    await expect(api.getWorkerStatus()).resolves.toEqual({
      implementation: 'placeholder',
      status: 'disabled',
    })
    await expect(api.restartWorker()).resolves.toEqual({
      implementation: 'placeholder',
      status: 'disabled',
    })
    await expect(api.getProviderCredentialStatus('openai')).resolves.toEqual({
      configured: true,
      provider: 'openai',
      redactedValue: 'sk-...alue',
    })
    await expect(api.saveProviderCredential({
      provider: 'openai',
      secret: 'sk-secret-value',
    })).resolves.toEqual({
      configured: true,
      provider: 'openai',
      redactedValue: 'sk-...alue',
    })
    await expect(api.deleteProviderCredential('openai')).resolves.toEqual({
      configured: true,
      provider: 'openai',
      redactedValue: 'sk-...alue',
    })
    await expect(api.getModelBindings()).resolves.toMatchObject({
      planner: {
        modelId: 'gpt-5.4',
        provider: 'openai',
      },
    })
    await expect(api.getModelSettingsSnapshot()).resolves.toEqual({
      bindings: {
        continuityReviewer: { provider: 'fixture' },
        planner: { modelId: 'gpt-5.4', provider: 'openai' },
        sceneProseWriter: { provider: 'fixture' },
        sceneRevision: { provider: 'fixture' },
        summary: { provider: 'fixture' },
      },
      connectionTest: {
        status: 'never',
      },
      credentialStatus: {
        configured: false,
        provider: 'openai',
      },
    })
    await expect(api.testModelSettings()).resolves.toEqual({
      status: 'failed',
      errorCode: 'missing_key',
      summary: 'OpenAI API key is missing.',
    })
    await expect(api.updateModelBinding({
      binding: {
        modelId: 'gpt-5.4-mini',
        provider: 'openai',
      },
      role: 'sceneRevision',
    })).resolves.toMatchObject({
      planner: {
        modelId: 'gpt-5.4',
        provider: 'openai',
      },
    })
    expect(calls).toEqual([
      { channel: DESKTOP_API_CHANNELS.getAppVersion, payload: [] },
      { channel: DESKTOP_API_CHANNELS.getCurrentProject, payload: [] },
      { channel: DESKTOP_API_CHANNELS.openDemoProject, payload: [] },
      { channel: DESKTOP_API_CHANNELS.createRealProject, payload: [] },
      { channel: DESKTOP_API_CHANNELS.openExistingProject, payload: [] },
      { channel: DESKTOP_API_CHANNELS.getPlatform, payload: [] },
      { channel: DESKTOP_API_CHANNELS.getRuntimeMode, payload: [] },
      { channel: DESKTOP_API_CHANNELS.getRuntimeConfig, payload: [] },
      { channel: DESKTOP_API_CHANNELS.getLocalApiStatus, payload: [] },
      { channel: DESKTOP_API_CHANNELS.restartLocalApi, payload: [] },
      { channel: DESKTOP_API_CHANNELS.getLocalApiLogs, payload: [] },
      { channel: DESKTOP_API_CHANNELS.getWorkerStatus, payload: [] },
      { channel: DESKTOP_API_CHANNELS.restartWorker, payload: [] },
      { channel: DESKTOP_API_CHANNELS.getProviderCredentialStatus, payload: ['openai'] },
      {
        channel: DESKTOP_API_CHANNELS.saveProviderCredential,
        payload: [{
          provider: 'openai',
          secret: 'sk-secret-value',
        }],
      },
      { channel: DESKTOP_API_CHANNELS.deleteProviderCredential, payload: ['openai'] },
      { channel: DESKTOP_API_CHANNELS.getModelBindings, payload: [] },
      { channel: DESKTOP_API_CHANNELS.getModelSettingsSnapshot, payload: [] },
      { channel: DESKTOP_API_CHANNELS.testModelSettings, payload: [] },
      {
        channel: DESKTOP_API_CHANNELS.updateModelBinding,
        payload: [{
          binding: {
            modelId: 'gpt-5.4-mini',
            provider: 'openai',
          },
          role: 'sceneRevision',
        }],
      },
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

      if (
        channel === DESKTOP_API_CHANNELS.getProviderCredentialStatus
        || channel === DESKTOP_API_CHANNELS.saveProviderCredential
        || channel === DESKTOP_API_CHANNELS.deleteProviderCredential
      ) {
        return {
          configured: true,
          provider: 'openai' as const,
          redactedValue: 'sk-...alue',
        }
      }

      if (channel === DESKTOP_API_CHANNELS.getModelBindings || channel === DESKTOP_API_CHANNELS.updateModelBinding) {
        return {
          continuityReviewer: { provider: 'fixture' as const },
          planner: { modelId: 'gpt-5.4', provider: 'openai' as const },
          sceneProseWriter: { provider: 'fixture' as const },
          sceneRevision: { provider: 'fixture' as const },
          summary: { provider: 'fixture' as const },
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
      'createRealProject',
      'deleteProviderCredential',
      'getAppVersion',
      'getCurrentProject',
      'getLocalApiLogs',
      'getLocalApiStatus',
      'getModelBindings',
      'getModelSettingsSnapshot',
      'getPlatform',
      'getProviderCredentialStatus',
      'getRuntimeConfig',
      'getRuntimeMode',
      'getWorkerStatus',
      'openDemoProject',
      'openExistingProject',
      'restartLocalApi',
      'restartWorker',
      'saveProviderCredential',
      'testModelSettings',
      'updateModelBinding',
    ])
    expect('ipcRenderer' in api).toBe(false)
    expect('fs' in api).toBe(false)
    expect('child_process' in api).toBe(false)
    expect('getRawCredential' in api).toBe(false)
    expect('listSecrets' in api).toBe(false)
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
    await expect(api.getProviderCredentialStatus('openai')).resolves.toEqual({
      configured: true,
      provider: 'openai',
      redactedValue: 'sk-...alue',
    })
    await expect(api.getModelBindings()).resolves.toMatchObject({
      planner: {
        modelId: 'gpt-5.4',
        provider: 'openai',
      },
    })
    expect(invoke).toHaveBeenNthCalledWith(1, DESKTOP_API_CHANNELS.getCurrentProject)
    expect(invoke).toHaveBeenNthCalledWith(2, DESKTOP_API_CHANNELS.getWorkerStatus)
    expect(invoke).toHaveBeenNthCalledWith(3, DESKTOP_API_CHANNELS.restartWorker)
    expect(invoke).toHaveBeenNthCalledWith(4, DESKTOP_API_CHANNELS.getProviderCredentialStatus, 'openai')
    expect(invoke).toHaveBeenNthCalledWith(5, DESKTOP_API_CHANNELS.getModelBindings)
  })
})
