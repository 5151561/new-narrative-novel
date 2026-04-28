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
    const createMainWindow = vi.fn(async () => undefined)
    const setApplicationMenu = vi.fn()
    const selectedProject = {
      projectId: 'local-project-alpha',
      projectRoot: '/tmp/local-project',
      projectTitle: 'Desktop Local Project',
    }
    const createProjectBackup = vi.fn(async () => ({
      filePath: '/tmp/local-project/.narrative/backups/project-backup-2026-04-28T00-00-00-000Z.json',
    }))
    const exportProjectArchive = vi.fn(async () => ({
      filePath: '/tmp/local-project/.narrative/exports/project-archive-2026-04-28T00-00-00-000Z.json',
    }))
    let currentProject: typeof selectedProject | null = null
    const projectStore = {
      createProject: vi.fn(async () => ({
        projectId: 'local-project-created',
        projectRoot: '/tmp/project-created',
        projectTitle: 'Created Project',
      })),
      forgetProjectRoot: vi.fn(async () => []),
      getCurrentProject: vi.fn(() => currentProject),
      getRecentProjects: vi.fn(() => []),
      openProject: vi.fn(async () => null),
      restoreLastProject: vi.fn(async () => null),
      selectProjectRoot: vi.fn(async () => {
        currentProject = selectedProject
        return selectedProject
      }),
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
      readModelSettingsRecord: vi.fn(async () => ({
        bindings: {
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
        },
        connectionTest: {
          status: 'never' as const,
        },
      })),
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
      resetConnectionTest: vi.fn(async () => ({
        status: 'never' as const,
      })),
      writeConnectionTest: vi.fn(async () => ({
        errorCode: 'missing_key' as const,
        status: 'failed' as const,
        summary: 'OpenAI API key is missing.',
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
      testModelSettings: vi.fn(async () => ({
        errorCode: 'missing_key' as const,
        status: 'failed' as const,
        summary: 'OpenAI API key is missing.',
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
        name: 'Narrative Desktop',
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
    const { buildApplicationMenuTemplate } = await vi.importActual<typeof import('./app-menu.js')>('./app-menu.js')

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
      createProjectBackup,
      exportProjectArchive,
    }))
    vi.doMock('./runtime-config.js', () => ({
      resolveWorkspaceRoot: vi.fn(() => '/tmp/local-project'),
    }))
    vi.doMock('./worker-supervisor.js', () => ({
      createWorkerSupervisor: vi.fn(() => workerSupervisor),
    }))

    await import('./main.js')

    const initialMenuOptions = setApplicationMenu.mock.calls.at(-1)?.[0] as {
      onCreateProject?: () => Promise<void>
      onOpenProject?: () => Promise<void>
      onOpenRecentProject?: (projectRoot: string) => Promise<void>
      onCreateProjectBackup?: () => Promise<void>
      onExportProjectArchive?: () => Promise<void>
      onRestartLocalApi?: () => Promise<void>
      onRestartWorker?: () => Promise<void>
    } | undefined

    const registrations = new Map(
      ipcHandle.mock.calls.map(([channel, handler]) => [channel as string, handler as (...args: unknown[]) => unknown]),
    )

    expect(projectStore.restoreLastProject).toHaveBeenCalledTimes(1)
    expect(projectStore.selectProjectRoot).toHaveBeenCalledWith('/tmp/local-project')
    expect(localApiSupervisor.start).toHaveBeenCalledTimes(1)
    expect(createMainWindow).toHaveBeenCalledTimes(1)

    expect(registrations.has(DESKTOP_API_CHANNELS.getWorkerStatus)).toBe(true)
    expect(registrations.has(DESKTOP_API_CHANNELS.restartWorker)).toBe(true)
    expect(registrations.has(DESKTOP_API_CHANNELS.getLocalApiStatus)).toBe(true)
    expect(registrations.has(DESKTOP_API_CHANNELS.restartLocalApi)).toBe(true)
    expect(registrations.has(DESKTOP_API_CHANNELS.getLocalApiLogs)).toBe(true)
    expect(registrations.has(DESKTOP_API_CHANNELS.getCurrentProject)).toBe(true)
    expect(registrations.has(DESKTOP_API_CHANNELS.getRuntimeConfig)).toBe(true)
    expect(registrations.has(DESKTOP_API_CHANNELS.getProviderCredentialStatus)).toBe(true)
    expect(registrations.has(DESKTOP_API_CHANNELS.saveProviderCredential)).toBe(true)
    expect(registrations.has(DESKTOP_API_CHANNELS.deleteProviderCredential)).toBe(true)
    expect(registrations.has(DESKTOP_API_CHANNELS.getModelBindings)).toBe(true)
    expect(registrations.has(DESKTOP_API_CHANNELS.getModelSettingsSnapshot)).toBe(true)
    expect(registrations.has(DESKTOP_API_CHANNELS.testModelSettings)).toBe(true)
    expect(registrations.has(DESKTOP_API_CHANNELS.updateModelBinding)).toBe(true)
    expect(Array.from(registrations.keys())).not.toContain('narrativeDesktop:getRawCredential')

    expect(registrations.get(DESKTOP_API_CHANNELS.getCurrentProject)?.()).toEqual({
      projectId: selectedProject.projectId,
      projectTitle: selectedProject.projectTitle,
    })
    await expect(registrations.get(DESKTOP_API_CHANNELS.getRuntimeConfig)?.()).resolves.toEqual({
      apiBaseUrl: 'http://127.0.0.1:4888/api',
      apiHealthUrl: 'http://127.0.0.1:4888/api/health',
      port: 4888,
      projectId: 'local-project-alpha',
      projectTitle: 'Desktop Local Project',
      runtimeMode: 'desktop-local',
    })
    expect(registrations.get(DESKTOP_API_CHANNELS.getLocalApiStatus)?.()).toEqual({
      lastError: undefined,
      runtimeConfig: {
        apiBaseUrl: 'http://127.0.0.1:4888/api',
        apiHealthUrl: 'http://127.0.0.1:4888/api/health',
        port: 4888,
        projectId: 'local-project-alpha',
        projectTitle: 'Desktop Local Project',
        runtimeMode: 'desktop-local',
      },
      status: 'ready',
    })
    await expect(registrations.get(DESKTOP_API_CHANNELS.restartLocalApi)?.()).resolves.toEqual({
      lastError: undefined,
      runtimeConfig: {
        apiBaseUrl: 'http://127.0.0.1:4888/api',
        apiHealthUrl: 'http://127.0.0.1:4888/api/health',
        port: 4888,
        projectId: 'local-project-alpha',
        projectTitle: 'Desktop Local Project',
        runtimeMode: 'desktop-local',
      },
      status: 'ready',
    })
    expect(registrations.get(DESKTOP_API_CHANNELS.getLocalApiLogs)?.()).toEqual([])
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
    await expect(registrations.get(DESKTOP_API_CHANNELS.getModelSettingsSnapshot)?.()).resolves.toEqual({
      bindings: {
        continuityReviewer: {
          provider: 'fixture',
        },
        planner: {
          modelId: 'gpt-5.4',
          provider: 'openai',
        },
        sceneProseWriter: {
          provider: 'fixture',
        },
        sceneRevision: {
          provider: 'fixture',
        },
        summary: {
          provider: 'fixture',
        },
      },
      connectionTest: {
        status: 'never',
      },
      credentialStatus: {
        configured: true,
        provider: 'openai',
        redactedValue: 'sk-...alue',
      },
    })
    await expect(registrations.get(DESKTOP_API_CHANNELS.testModelSettings)?.()).resolves.toEqual({
      errorCode: 'missing_key',
      status: 'failed',
      summary: 'OpenAI API key is missing.',
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
    expect(modelBindingStore.readModelSettingsRecord).toHaveBeenCalledWith('/tmp/local-project')
    expect(modelBindingStore.readBindings).toHaveBeenCalledWith('/tmp/local-project')
    expect(modelBindingStore.resetConnectionTest).toHaveBeenCalledTimes(2)
    expect(modelBindingStore.updateBinding).toHaveBeenCalledWith('/tmp/local-project', {
      binding: {
        modelId: 'gpt-5.4-mini',
        provider: 'openai',
      },
      role: 'sceneRevision',
    })
    expect(modelBindingStore.writeConnectionTest).toHaveBeenCalledWith('/tmp/local-project', {
      errorCode: 'missing_key',
      status: 'failed',
      summary: 'OpenAI API key is missing.',
    })
    expect(localApiSupervisor.restart).toHaveBeenCalledTimes(4)
    expect(localApiSupervisor.testModelSettings).toHaveBeenCalledTimes(1)

    const beforeQuitHandler = appOn.mock.calls.find(([event]) => event === 'before-quit')?.[1] as (() => void) | undefined
    expect(beforeQuitHandler).toBeTypeOf('function')

    beforeQuitHandler?.()

    expect(workerSupervisor.stop).toHaveBeenCalledTimes(1)

    expect(initialMenuOptions?.onCreateProject).toBeTypeOf('function')
    await expect(initialMenuOptions!.onCreateProject!()).resolves.toBeUndefined()
    expect(projectStore.createProject).toHaveBeenCalledTimes(1)
    expect(localApiSupervisor.restart).toHaveBeenCalledTimes(5)
    expect(setApplicationMenu).toHaveBeenCalledTimes(2)

    projectStore.openProject.mockRejectedValueOnce(new Error('dialog failed'))
    expect(initialMenuOptions?.onOpenProject).toBeTypeOf('function')
    await expect(initialMenuOptions!.onOpenProject!()).resolves.toBeUndefined()
    expect(localApiSupervisor.restart).toHaveBeenCalledTimes(5)
    expect(setApplicationMenu).toHaveBeenCalledTimes(3)

    projectStore.selectProjectRoot.mockRejectedValueOnce(new Error('project missing'))
    expect(initialMenuOptions?.onOpenRecentProject).toBeTypeOf('function')
    await expect(initialMenuOptions!.onOpenRecentProject!('/tmp/local-project')).resolves.toBeUndefined()
    expect(projectStore.forgetProjectRoot).toHaveBeenCalledWith('/tmp/local-project')
    expect(setApplicationMenu).toHaveBeenCalledTimes(4)

    projectStore.selectProjectRoot.mockRejectedValueOnce(new Error('project missing again'))
    projectStore.forgetProjectRoot.mockRejectedValueOnce(new Error('cleanup failed'))
    await expect(initialMenuOptions!.onOpenRecentProject!('/tmp/local-project')).resolves.toBeUndefined()
    expect(projectStore.forgetProjectRoot).toHaveBeenCalledWith('/tmp/local-project')
    expect(setApplicationMenu).toHaveBeenCalledTimes(5)

    expect(initialMenuOptions?.onCreateProjectBackup).toBeTypeOf('function')
    await expect(initialMenuOptions!.onCreateProjectBackup!()).resolves.toBeUndefined()
    expect(createProjectBackup).toHaveBeenCalledWith({
      projectRoot: '/tmp/local-project',
      storeFilePath: '/tmp/local-project/.narrative/project-store.json',
    })

    expect(initialMenuOptions?.onRestartLocalApi).toBeTypeOf('function')
    await expect(initialMenuOptions!.onRestartLocalApi!()).resolves.toBeUndefined()
    expect(localApiSupervisor.restart).toHaveBeenCalledTimes(6)

    expect(initialMenuOptions?.onRestartWorker).toBeTypeOf('function')
    await expect(initialMenuOptions!.onRestartWorker!()).resolves.toBeUndefined()
    expect(workerSupervisor.restart).toHaveBeenCalledTimes(2)

    expect(initialMenuOptions?.onExportProjectArchive).toBeTypeOf('function')
    await expect(initialMenuOptions!.onExportProjectArchive!()).resolves.toBeUndefined()
    expect(exportProjectArchive).toHaveBeenCalledWith({
      projectRoot: '/tmp/local-project',
      storeFilePath: '/tmp/local-project/.narrative/project-store.json',
    })
    expect(setApplicationMenu).toHaveBeenCalledTimes(9)

    const runtimeMenuTemplate = buildApplicationMenuTemplate({
      isDev: false,
      onOpenProject: vi.fn(),
      onCreateProject: vi.fn(),
      onOpenRecentProject: vi.fn(),
      onCreateProjectBackup: vi.fn(),
      onExportProjectArchive: vi.fn(),
      onRestartLocalApi: vi.fn(),
      onRestartWorker: vi.fn(),
    })
    const runtimeMenu = runtimeMenuTemplate.find((item) => item.label === 'Runtime')
    const runtimeLabels = (runtimeMenu?.submenu as Array<{ label?: string }> | undefined)?.map((item) => item.label)

    expect(runtimeLabels).toEqual([
      'Restart Local API',
      'Restart Worker',
    ])
  })
})
