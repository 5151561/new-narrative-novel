import { afterEach, describe, expect, it, vi } from 'vitest'

import { DESKTOP_API_CHANNELS } from '../shared/desktop-bridge-types.js'

afterEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  vi.unmock('electron')
})

describe('desktop main bridge registration', () => {
  it('registers worker bridge handlers from the real main entry path', async () => {
    const ipcHandle = vi.fn()
    const appOn = vi.fn()
    const setApplicationMenu = vi.fn()
    const projectStore = {
      forgetProjectRoot: vi.fn(async () => []),
      getCurrentProject: vi.fn(() => ({
        projectId: 'local-project-alpha',
        projectRoot: '/tmp/local-project',
        projectTitle: 'Desktop Local Project',
      })),
      getRecentProjects: vi.fn(() => []),
      openProject: vi.fn(async () => null),
      restoreLastProject: vi.fn(async () => null),
      selectProjectRoot: vi.fn(async () => ({
        projectId: 'local-project-alpha',
        projectRoot: '/tmp/local-project',
        projectTitle: 'Desktop Local Project',
      })),
    }
    const workerSnapshot = {
      implementation: 'placeholder' as const,
      lastError: undefined,
      processId: undefined,
      status: 'disabled' as const,
    }
    const restartedSnapshot = {
      implementation: 'placeholder' as const,
      lastError: undefined,
      processId: 4201,
      status: 'ready' as const,
    }
    const workerSupervisor = {
      getSnapshot: vi.fn(() => workerSnapshot),
      restart: vi.fn(async () => restartedSnapshot),
      stop: vi.fn(() => workerSnapshot),
    }
    const credentialStore = {
      deleteCredential: vi.fn(async () => ({
        configured: false,
        provider: 'openai' as const,
      })),
      getCredentialStatus: vi.fn(async () => ({
        configured: true,
        provider: 'openai' as const,
        redactedValue: 'sk-...alue',
      })),
      saveCredential: vi.fn(async () => ({
        configured: true,
        provider: 'openai' as const,
        redactedValue: 'sk-...alue',
      })),
    }
    const modelBindingStore = {
      readBindings: vi.fn(async () => ({
        continuityReviewer: {
          provider: 'fixture' as const,
        },
        planner: {
          modelId: 'gpt-5.4',
          provider: 'openai' as const,
        },
        sceneProseWriter: {
          provider: 'fixture' as const,
        },
        sceneRevision: {
          provider: 'fixture' as const,
        },
        summary: {
          provider: 'fixture' as const,
        },
      })),
      updateBinding: vi.fn(async () => ({
        continuityReviewer: {
          provider: 'fixture' as const,
        },
        planner: {
          modelId: 'gpt-5.4',
          provider: 'openai' as const,
        },
        sceneProseWriter: {
          provider: 'fixture' as const,
        },
        sceneRevision: {
          modelId: 'gpt-5.4-mini',
          provider: 'openai' as const,
        },
        summary: {
          provider: 'fixture' as const,
        },
      })),
    }
    const localApiSupervisor = {
      getLogs: vi.fn(() => []),
      getSnapshot: vi.fn(() => ({
        lastError: undefined,
        logs: [],
        runtimeConfig: {
          apiBaseUrl: 'http://127.0.0.1:4888/api',
          apiHealthUrl: 'http://127.0.0.1:4888/api/health',
          port: 4888,
          projectId: 'local-project-alpha',
          projectTitle: 'Desktop Local Project',
          runtimeMode: 'desktop-local' as const,
        },
        status: 'ready' as const,
      })),
      restart: vi.fn(async () => ({
        lastError: undefined,
        logs: [],
        runtimeConfig: {
          apiBaseUrl: 'http://127.0.0.1:4888/api',
          apiHealthUrl: 'http://127.0.0.1:4888/api/health',
          port: 4888,
          projectId: 'local-project-alpha',
          projectTitle: 'Desktop Local Project',
          runtimeMode: 'desktop-local' as const,
        },
        status: 'ready' as const,
      })),
      start: vi.fn(async () => ({
        lastError: undefined,
        logs: [],
        runtimeConfig: {
          apiBaseUrl: 'http://127.0.0.1:4888/api',
          apiHealthUrl: 'http://127.0.0.1:4888/api/health',
          port: 4888,
          projectId: 'local-project-alpha',
          projectTitle: 'Desktop Local Project',
          runtimeMode: 'desktop-local' as const,
        },
        status: 'ready' as const,
      })),
      stop: vi.fn(),
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
      createMainWindow: vi.fn(async () => undefined),
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
    vi.doMock('./runtime-config.js', () => ({
      resolveWorkspaceRoot: vi.fn(() => '/tmp/local-project'),
    }))
    vi.doMock('./worker-supervisor.js', () => ({
      createWorkerSupervisor: vi.fn(() => workerSupervisor),
    }))

    await import('./main.js')

    const initialMenuOptions = setApplicationMenu.mock.calls.at(-1)?.[0] as {
      onOpenProject?: () => Promise<void>
      onOpenRecentProject?: (projectRoot: string) => Promise<void>
    } | undefined

    const registrations = new Map(
      ipcHandle.mock.calls.map(([channel, handler]) => [channel as string, handler as (...args: unknown[]) => unknown]),
    )

    expect(registrations.has(DESKTOP_API_CHANNELS.getWorkerStatus)).toBe(true)
    expect(registrations.has(DESKTOP_API_CHANNELS.restartWorker)).toBe(true)
    expect(registrations.has(DESKTOP_API_CHANNELS.getCurrentProject)).toBe(true)
    expect(registrations.has(DESKTOP_API_CHANNELS.getRuntimeConfig)).toBe(true)
    expect(registrations.has(DESKTOP_API_CHANNELS.getProviderCredentialStatus)).toBe(true)
    expect(registrations.has(DESKTOP_API_CHANNELS.saveProviderCredential)).toBe(true)
    expect(registrations.has(DESKTOP_API_CHANNELS.deleteProviderCredential)).toBe(true)
    expect(registrations.has(DESKTOP_API_CHANNELS.getModelBindings)).toBe(true)
    expect(registrations.has(DESKTOP_API_CHANNELS.updateModelBinding)).toBe(true)
    expect(Array.from(registrations.keys())).not.toContain('narrativeDesktop:getRawCredential')

    expect(registrations.get(DESKTOP_API_CHANNELS.getCurrentProject)?.()).toEqual({
      projectId: 'local-project-alpha',
      projectTitle: 'Desktop Local Project',
    })
    await expect(registrations.get(DESKTOP_API_CHANNELS.getRuntimeConfig)?.()).resolves.toEqual({
      apiBaseUrl: 'http://127.0.0.1:4888/api',
      apiHealthUrl: 'http://127.0.0.1:4888/api/health',
      port: 4888,
      projectId: 'local-project-alpha',
      projectTitle: 'Desktop Local Project',
      runtimeMode: 'desktop-local',
    })
    expect(registrations.get(DESKTOP_API_CHANNELS.getWorkerStatus)?.()).toEqual({
      implementation: 'placeholder',
      lastError: undefined,
      processId: undefined,
      status: 'disabled',
    })
    await expect(registrations.get(DESKTOP_API_CHANNELS.restartWorker)?.()).resolves.toEqual({
      implementation: 'placeholder',
      lastError: undefined,
      processId: 4201,
      status: 'ready',
    })
    await expect(
      registrations.get(DESKTOP_API_CHANNELS.getProviderCredentialStatus)?.(undefined, 'openai'),
    ).resolves.toEqual({
      configured: true,
      provider: 'openai',
      redactedValue: 'sk-...alue',
    })
    await expect(
      registrations.get(DESKTOP_API_CHANNELS.saveProviderCredential)?.(undefined, {
        provider: 'openai',
        secret: 'sk-secret-value',
      }),
    ).resolves.toEqual({
      configured: true,
      provider: 'openai',
      redactedValue: 'sk-...alue',
    })
    await expect(
      registrations.get(DESKTOP_API_CHANNELS.deleteProviderCredential)?.(undefined, 'openai'),
    ).resolves.toEqual({
      configured: false,
      provider: 'openai',
    })
    await expect(registrations.get(DESKTOP_API_CHANNELS.getModelBindings)?.()).resolves.toMatchObject({
      planner: {
        modelId: 'gpt-5.4',
        provider: 'openai',
      },
    })
    await expect(
      registrations.get(DESKTOP_API_CHANNELS.updateModelBinding)?.(undefined, {
        binding: {
          modelId: 'gpt-5.4-mini',
          provider: 'openai',
        },
        role: 'sceneRevision',
      }),
    ).resolves.toMatchObject({
      sceneRevision: {
        modelId: 'gpt-5.4-mini',
        provider: 'openai',
      },
    })
    expect(workerSupervisor.getSnapshot).toHaveBeenCalledTimes(1)
    expect(workerSupervisor.restart).toHaveBeenCalledTimes(1)
    expect(credentialStore.getCredentialStatus).toHaveBeenCalledWith('openai')
    expect(credentialStore.saveCredential).toHaveBeenCalledWith('openai', 'sk-secret-value')
    expect(credentialStore.deleteCredential).toHaveBeenCalledWith('openai')
    expect(modelBindingStore.readBindings).toHaveBeenCalledWith('/tmp/local-project')
    expect(modelBindingStore.updateBinding).toHaveBeenCalledWith('/tmp/local-project', {
      binding: {
        modelId: 'gpt-5.4-mini',
        provider: 'openai',
      },
      role: 'sceneRevision',
    })
    expect(localApiSupervisor.restart).toHaveBeenCalledTimes(3)

    const beforeQuitHandler = appOn.mock.calls.find(([event]) => event === 'before-quit')?.[1] as (() => void) | undefined
    expect(beforeQuitHandler).toBeTypeOf('function')

    beforeQuitHandler?.()

    expect(workerSupervisor.stop).toHaveBeenCalledTimes(1)

    projectStore.openProject.mockRejectedValueOnce(new Error('dialog failed'))
    await expect(initialMenuOptions?.onOpenProject?.()).resolves.toBeUndefined()
    expect(localApiSupervisor.restart).toHaveBeenCalledTimes(3)
    expect(setApplicationMenu).toHaveBeenCalledTimes(2)

    projectStore.selectProjectRoot.mockRejectedValueOnce(new Error('project missing'))
    await expect(initialMenuOptions?.onOpenRecentProject?.('/tmp/local-project')).resolves.toBeUndefined()
    expect(projectStore.forgetProjectRoot).toHaveBeenCalledWith('/tmp/local-project')
    expect(setApplicationMenu).toHaveBeenCalledTimes(3)

    projectStore.selectProjectRoot.mockRejectedValueOnce(new Error('project missing again'))
    projectStore.forgetProjectRoot.mockRejectedValueOnce(new Error('cleanup failed'))
    await expect(initialMenuOptions?.onOpenRecentProject?.('/tmp/local-project')).resolves.toBeUndefined()
    expect(projectStore.forgetProjectRoot).toHaveBeenCalledWith('/tmp/local-project')
    expect(setApplicationMenu).toHaveBeenCalledTimes(4)
  })
})
