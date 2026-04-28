import { afterEach, describe, expect, it, vi } from 'vitest'

import { DESKTOP_API_CHANNELS } from '../shared/desktop-bridge-types.js'

afterEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  vi.unmock('electron')
})

describe('desktop main bridge registration', () => {
  it('registers provider-profile CRUD plus provider-id-scoped credential handlers from the real main entry path', async () => {
    const ipcHandle = vi.fn()
    const appOn = vi.fn()
    const createMainWindow = vi.fn(async () => undefined)
    const setApplicationMenu = vi.fn()
    const selectedProject = {
      projectId: 'local-project-alpha',
      projectMode: 'real-project' as const,
      projectRoot: '/tmp/local-project',
      projectTitle: 'Desktop Local Project',
    }
    let currentProject = selectedProject
    const projectStore = {
      createProject: vi.fn(async () => selectedProject),
      forgetProjectRoot: vi.fn(async () => []),
      getCurrentProject: vi.fn(() => currentProject),
      getRecentProjects: vi.fn(() => []),
      openProject: vi.fn(async () => selectedProject),
      openRecentProject: vi.fn(async () => selectedProject),
      restoreLastProject: vi.fn(async () => null),
      selectDemoProject: vi.fn(async () => selectedProject),
      selectProjectRoot: vi.fn(async () => selectedProject),
    }
    const workerSupervisor = {
      getSnapshot: vi.fn(() => ({
        implementation: 'placeholder' as const,
        status: 'disabled' as const,
      })),
      restart: vi.fn(async () => ({
        implementation: 'placeholder' as const,
        status: 'disabled' as const,
      })),
      stop: vi.fn(),
    }
    const credentialStore = {
      deleteCredential: vi.fn(async () => ({
        configured: false,
        provider: 'openai-compatible' as const,
        providerId: 'deepseek',
      })),
      getCredentialStatus: vi.fn(async () => ({
        configured: true,
        provider: 'openai-compatible' as const,
        providerId: 'deepseek',
        redactedValue: 'sk-...alue',
      })),
      saveCredential: vi.fn(async () => ({
        configured: true,
        provider: 'openai-compatible' as const,
        providerId: 'deepseek',
        redactedValue: 'sk-...alue',
      })),
    }
    const modelBindingStore = {
      deleteProviderProfile: vi.fn(async () => []),
      readBindings: vi.fn(async () => ({
        continuityReviewer: { provider: 'fixture' as const },
        planner: { modelId: 'deepseek-chat', provider: 'openai-compatible' as const, providerId: 'deepseek' },
        sceneProseWriter: { provider: 'fixture' as const },
        sceneRevision: { provider: 'fixture' as const },
        summary: { provider: 'fixture' as const },
      })),
      readModelSettingsRecord: vi.fn(async () => ({
        bindings: {
          continuityReviewer: { provider: 'fixture' as const },
          planner: { modelId: 'deepseek-chat', provider: 'openai-compatible' as const, providerId: 'deepseek' },
          sceneProseWriter: { provider: 'fixture' as const },
          sceneRevision: { provider: 'fixture' as const },
          summary: { provider: 'fixture' as const },
        },
        connectionTest: { status: 'never' as const },
        providers: [{
          baseUrl: 'https://api.deepseek.com/v1',
          id: 'deepseek',
          label: 'DeepSeek',
        }],
      })),
      readProviderProfiles: vi.fn(async () => [{
        baseUrl: 'https://api.deepseek.com/v1',
        id: 'deepseek',
        label: 'DeepSeek',
      }]),
      resetConnectionTest: vi.fn(async () => ({ status: 'never' as const })),
      saveProviderProfile: vi.fn(async () => [{
        baseUrl: 'https://api.deepseek.com/v1',
        id: 'deepseek',
        label: 'DeepSeek',
      }]),
      updateBinding: vi.fn(async () => ({
        continuityReviewer: { provider: 'fixture' as const },
        planner: { modelId: 'deepseek-chat', provider: 'openai-compatible' as const, providerId: 'deepseek' },
        sceneProseWriter: { provider: 'fixture' as const },
        sceneRevision: { modelId: 'deepseek-reasoner', provider: 'openai-compatible' as const, providerId: 'deepseek' },
        summary: { provider: 'fixture' as const },
      })),
      writeConnectionTest: vi.fn(async () => ({
        errorCode: 'missing_key' as const,
        status: 'failed' as const,
        summary: 'Provider API key is missing.',
      })),
    }
    let localApiSnapshot = {
      lastError: undefined as string | undefined,
      logs: [] as string[],
      runtimeConfig: {
        apiBaseUrl: 'http://127.0.0.1:4888/api',
        apiHealthUrl: 'http://127.0.0.1:4888/api/health',
        port: 4888,
        projectId: 'local-project-alpha',
        projectMode: 'real-project' as const,
        projectTitle: 'Desktop Local Project',
        runtimeMode: 'desktop-local' as const,
      },
      status: 'ready' as const,
    }
    const localApiSupervisor = {
      getLogs: vi.fn(() => []),
      getSnapshot: vi.fn(() => localApiSnapshot),
      restart: vi.fn(async () => localApiSnapshot),
      start: vi.fn(async () => localApiSnapshot),
      stop: vi.fn(() => localApiSnapshot),
      testModelSettings: vi.fn(async () => ({
        errorCode: 'missing_key' as const,
        status: 'failed' as const,
        summary: 'Provider API key is missing.',
      })),
    }

    vi.doMock('electron', () => ({
      BrowserWindow: {
        getAllWindows: vi.fn(() => []),
      },
      app: {
        getVersion: vi.fn(() => '0.1.0'),
        isPackaged: false,
        on: appOn,
        quit: vi.fn(),
        whenReady: vi.fn(() => Promise.resolve()),
      },
      ipcMain: {
        handle: ipcHandle,
      },
    }))
    vi.doMock('./app-menu.js', () => ({
      setApplicationMenu,
    }))
    vi.doMock('./create-window.js', () => ({
      createMainWindow,
    }))
    vi.doMock('./local-api-supervisor.js', () => ({
      createLocalApiSupervisor: vi.fn(() => localApiSupervisor),
    }))
    vi.doMock('./project-store.js', () => ({
      ProjectStore: vi.fn(() => projectStore),
    }))
    vi.doMock('./credential-store.js', () => ({
      CredentialStore: vi.fn(() => credentialStore),
    }))
    vi.doMock('./model-binding-store.js', () => ({
      ModelBindingStore: vi.fn(() => modelBindingStore),
    }))
    vi.doMock('../../../../packages/api/src/repositories/project-backup.js', () => ({
      createProjectBackup: vi.fn(),
      exportProjectArchive: vi.fn(),
    }))
    vi.doMock('./worker-supervisor.js', () => ({
      createWorkerSupervisor: vi.fn(() => workerSupervisor),
    }))

    await import('./main.js')

    const registrations = new Map(
      ipcHandle.mock.calls.map(([channel, handler]) => [channel as string, handler as (...args: unknown[]) => unknown]),
    )

    expect(registrations.has(DESKTOP_API_CHANNELS.getProviderProfiles)).toBe(true)
    expect(registrations.has(DESKTOP_API_CHANNELS.saveProviderProfile)).toBe(true)
    expect(registrations.has(DESKTOP_API_CHANNELS.deleteProviderProfile)).toBe(true)

    await expect(registrations.get(DESKTOP_API_CHANNELS.getProviderProfiles)?.()).resolves.toEqual([
      {
        baseUrl: 'https://api.deepseek.com/v1',
        id: 'deepseek',
        label: 'DeepSeek',
      },
    ])
    await expect(registrations.get(DESKTOP_API_CHANNELS.saveProviderProfile)?.(undefined, {
      baseUrl: 'https://api.deepseek.com/v1',
      id: 'deepseek',
      label: 'DeepSeek',
    })).resolves.toEqual([
      {
        baseUrl: 'https://api.deepseek.com/v1',
        id: 'deepseek',
        label: 'DeepSeek',
      },
    ])
    await expect(registrations.get(DESKTOP_API_CHANNELS.getProviderCredentialStatus)?.(undefined, {
      provider: 'openai-compatible',
      providerId: 'deepseek',
    })).resolves.toEqual({
      configured: true,
      provider: 'openai-compatible',
      providerId: 'deepseek',
      redactedValue: 'sk-...alue',
    })
    await expect(registrations.get(DESKTOP_API_CHANNELS.saveProviderCredential)?.(undefined, {
      provider: 'openai-compatible',
      providerId: 'deepseek',
      secret: 'sk-secret-value',
    })).resolves.toEqual({
      configured: true,
      provider: 'openai-compatible',
      providerId: 'deepseek',
      redactedValue: 'sk-...alue',
    })
    await expect(registrations.get(DESKTOP_API_CHANNELS.deleteProviderCredential)?.(undefined, {
      provider: 'openai-compatible',
      providerId: 'deepseek',
    })).resolves.toEqual({
      configured: false,
      provider: 'openai-compatible',
      providerId: 'deepseek',
    })
    await expect(registrations.get(DESKTOP_API_CHANNELS.getModelSettingsSnapshot)?.()).resolves.toEqual({
      bindings: {
        continuityReviewer: { provider: 'fixture' },
        planner: { modelId: 'deepseek-chat', provider: 'openai-compatible', providerId: 'deepseek' },
        sceneProseWriter: { provider: 'fixture' },
        sceneRevision: { provider: 'fixture' },
        summary: { provider: 'fixture' },
      },
      connectionTest: {
        status: 'never',
      },
      credentialStatuses: [{
        configured: true,
        provider: 'openai-compatible',
        providerId: 'deepseek',
        redactedValue: 'sk-...alue',
      }],
      providers: [{
        baseUrl: 'https://api.deepseek.com/v1',
        id: 'deepseek',
        label: 'DeepSeek',
      }],
    })
    await expect(registrations.get(DESKTOP_API_CHANNELS.deleteProviderProfile)?.(undefined, 'deepseek')).resolves.toEqual([])

    expect(credentialStore.getCredentialStatus).toHaveBeenCalledWith('deepseek')
    expect(credentialStore.saveCredential).toHaveBeenCalledWith('deepseek', 'sk-secret-value')
    expect(credentialStore.deleteCredential).toHaveBeenCalledWith('deepseek')
    expect(modelBindingStore.saveProviderProfile).toHaveBeenCalledWith('/tmp/local-project', {
      baseUrl: 'https://api.deepseek.com/v1',
      id: 'deepseek',
      label: 'DeepSeek',
    })
    expect(modelBindingStore.deleteProviderProfile).toHaveBeenCalledWith('/tmp/local-project', 'deepseek')
    expect(modelBindingStore.resetConnectionTest).toHaveBeenCalledTimes(2)
    expect(localApiSupervisor.restart).toHaveBeenCalledTimes(4)
    expect(createMainWindow).toHaveBeenCalledTimes(1)
    expect(setApplicationMenu).toHaveBeenCalled()
  })
})
