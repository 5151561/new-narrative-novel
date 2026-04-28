import path from 'node:path'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { LocalApiSupervisor, type LocalApiChildProcess, type LocalApiSpawnConfig } from './local-api-supervisor.js'
import { resolveWorkspaceRoot } from './runtime-config.js'

class FakeLocalApiChild extends EventEmitter implements LocalApiChildProcess {
  stdout = new PassThrough()
  stderr = new PassThrough()
  killed = false

  kill(): boolean {
    this.killed = true
    return true
  }
}

function okResponse() {
  return {
    ok: true,
    status: 200,
  } as Response
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return {
    promise,
    reject,
    resolve,
  }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('LocalApiSupervisor', () => {
  it('spawns the API process with desktop-local env and marks it ready after health succeeds', async () => {
    const child = new FakeLocalApiChild()
    const restartedChild = new FakeLocalApiChild()
    const children = [child, restartedChild]
    const spawnConfigs: LocalApiSpawnConfig[] = []
    const fetch = vi.fn(async () => okResponse())
    const supervisor = new LocalApiSupervisor({
      fetch,
      findAvailablePort: async () => 4888,
      getModelBindings: async () => ({
        continuityReviewer: {
          provider: 'fixture',
        },
        planner: {
          modelId: 'gpt-5.4',
          provider: 'openai',
        },
        sceneProseWriter: {
          modelId: 'gpt-5.4',
          provider: 'openai',
        },
        sceneRevision: {
          modelId: 'gpt-5.4-mini',
          provider: 'openai',
        },
        summary: {
          provider: 'fixture',
        },
      }),
      getProviderCredential: async () => 'sk-secret-value',
      getCurrentProject: () => ({
        projectId: 'local-project-alpha',
        projectRoot: '/tmp/local-project',
        projectTitle: 'Desktop Local Project',
      }),
      sleep: async () => {},
      spawnLocalApi: (config) => {
        spawnConfigs.push(config)
        const nextChild = children.shift()
        if (!nextChild) {
          throw new Error('unexpected extra local API spawn')
        }

        return nextChild
      },
    })

    const snapshot = await supervisor.start()
    child.stdout.write('api ready\n')

    expect(snapshot.status).toBe('ready')
    expect(snapshot.runtimeConfig).toEqual({
      apiBaseUrl: 'http://127.0.0.1:4888/api',
      apiHealthUrl: 'http://127.0.0.1:4888/api/health',
      port: 4888,
      projectId: 'local-project-alpha',
      projectTitle: 'Desktop Local Project',
      runtimeMode: 'desktop-local',
    })
    expect(spawnConfigs).toHaveLength(1)
    expect(spawnConfigs[0]?.env).toMatchObject({
      NARRATIVE_PROJECT_ARTIFACT_DIR: '/tmp/local-project/.narrative/artifacts',
      NARRATIVE_PROJECT_ID: 'local-project-alpha',
      NARRATIVE_PROJECT_ROOT: '/tmp/local-project',
      NARRATIVE_PROJECT_STORE_FILE: '/tmp/local-project/.narrative/project-store.json',
      NARRATIVE_PROJECT_TITLE: 'Desktop Local Project',
      NARRATIVE_MODEL_PROVIDER: 'fixture',
      NARRATIVE_PLANNER_MODEL_PROVIDER: 'openai',
      NARRATIVE_PLANNER_OPENAI_API_KEY: 'sk-secret-value',
      NARRATIVE_PLANNER_OPENAI_MODEL: 'gpt-5.4',
      NARRATIVE_RUNTIME: 'desktop-local',
      NARRATIVE_SCENE_PROSE_WRITER_MODEL_PROVIDER: 'openai',
      NARRATIVE_SCENE_PROSE_WRITER_OPENAI_API_KEY: 'sk-secret-value',
      NARRATIVE_SCENE_PROSE_WRITER_OPENAI_MODEL: 'gpt-5.4',
      NARRATIVE_SCENE_REVISION_MODEL_PROVIDER: 'openai',
      NARRATIVE_SCENE_REVISION_OPENAI_API_KEY: 'sk-secret-value',
      NARRATIVE_SCENE_REVISION_OPENAI_MODEL: 'gpt-5.4-mini',
      PORT: '4888',
    })
    expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:4888/api/health', { signal: expect.any(AbortSignal) })
    expect(supervisor.getSnapshot().logs).toContain('[stdout] api ready')
    await expect(supervisor.restart()).resolves.toMatchObject({
      runtimeConfig: {
        projectId: 'local-project-alpha',
      },
      status: 'ready',
    })
    expect(spawnConfigs).toHaveLength(2)
    expect(child.killed).toBe(true)
  })

  it('uses a non-fixture default current project identity when no override is provided', async () => {
    const child = new FakeLocalApiChild()
    const spawnConfigs: LocalApiSpawnConfig[] = []
    const workspaceRoot = resolveWorkspaceRoot()
    const expectedTitle = path.basename(workspaceRoot)
    const expectedProjectId = `local-project-${expectedTitle}`
    const supervisor = new LocalApiSupervisor({
      fetch: async () => okResponse(),
      findAvailablePort: async () => 4888,
      sleep: async () => {},
      spawnLocalApi: (config) => {
        spawnConfigs.push(config)
        return child
      },
    })

    const snapshot = await supervisor.start()

    expect(snapshot.runtimeConfig).toMatchObject({
      projectId: expectedProjectId,
      projectTitle: expectedTitle,
    })
    expect(spawnConfigs[0]?.env).toMatchObject({
      NARRATIVE_PROJECT_ID: expectedProjectId,
      NARRATIVE_PROJECT_ROOT: workspaceRoot,
      NARRATIVE_PROJECT_TITLE: expectedTitle,
    })
    expect(spawnConfigs[0]?.env.NARRATIVE_PROJECT_ID).not.toBe('book-signal-arc')
  })

  it('marks startup failed when health never becomes ready', async () => {
    const child = new FakeLocalApiChild()
    const supervisor = new LocalApiSupervisor({
      fetch: async () => ({ ok: false, status: 503 }) as Response,
      findAvailablePort: async () => 4999,
      healthPollIntervalMs: 1,
      healthTimeoutMs: 1,
      sleep: async () => {},
      spawnLocalApi: () => child,
    })

    const snapshot = await supervisor.start()

    expect(snapshot.status).toBe('failed')
    expect(snapshot.lastError).toContain('Local API health check failed')
    expect(snapshot.runtimeConfig).toBeUndefined()
    expect(supervisor.getSnapshot().runtimeConfig).toBeUndefined()
    expect(child.killed).toBe(true)
  })

  it('bounds a hung health fetch attempt by the health timeout', async () => {
    const child = new FakeLocalApiChild()
    const supervisor = new LocalApiSupervisor({
      fetch: vi.fn(() => new Promise<Response>(() => {})),
      findAvailablePort: async () => 4999,
      healthPollIntervalMs: 2,
      healthTimeoutMs: 5,
      sleep: (ms) => new Promise((resolve) => {
        setTimeout(resolve, ms)
      }),
      spawnLocalApi: () => child,
    })

    const startPromise = supervisor.start()
    await expect(Promise.race([
      startPromise.then(() => 'settled'),
      new Promise((resolve) => {
        setTimeout(() => resolve('pending'), 50)
      }),
    ])).resolves.toBe('settled')

    const snapshot = await startPromise
    expect(snapshot.status).toBe('failed')
    expect(snapshot.lastError).toContain('Local API health check failed')
    expect(snapshot.runtimeConfig).toBeUndefined()
    expect(child.killed).toBe(true)
  })

  it('marks startup failed instead of throwing when port allocation fails before spawn', async () => {
    const supervisor = new LocalApiSupervisor({
      findAvailablePort: async () => {
        throw new Error('no local ports available')
      },
      sleep: async () => {},
      spawnLocalApi: () => new FakeLocalApiChild(),
    })

    await expect(supervisor.start()).resolves.toMatchObject({
      lastError: 'no local ports available',
      status: 'failed',
    })
    expect(supervisor.getSnapshot().runtimeConfig).toBeUndefined()
  })

  it('marks startup failed instead of throwing when process spawn fails before health polling', async () => {
    const supervisor = new LocalApiSupervisor({
      findAvailablePort: async () => 4888,
      sleep: async () => {},
      spawnLocalApi: () => {
        throw new Error('pnpm executable not found')
      },
    })

    await expect(supervisor.start()).resolves.toMatchObject({
      lastError: 'pnpm executable not found',
      status: 'failed',
    })
    expect(supervisor.getSnapshot().runtimeConfig).toBeUndefined()
  })

  it('fails promptly with the child error when spawn reports an async process error', async () => {
    const child = new FakeLocalApiChild()
    const fetch = vi.fn(async () => ({ ok: false, status: 503 }) as Response)
    const sleep = vi.fn(async () => {
      child.emit('error', new Error('spawn pnpm ENOENT'))
    })
    const supervisor = new LocalApiSupervisor({
      fetch,
      findAvailablePort: async () => 4888,
      healthPollIntervalMs: 1,
      healthTimeoutMs: 50,
      sleep,
      spawnLocalApi: () => child,
    })

    const snapshot = await supervisor.start()

    expect(snapshot).toMatchObject({
      lastError: 'spawn pnpm ENOENT',
      status: 'failed',
    })
    expect(snapshot.runtimeConfig).toBeUndefined()
    expect(supervisor.getSnapshot().runtimeConfig).toBeUndefined()
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(sleep).toHaveBeenCalledTimes(1)
  })

  it('coalesces concurrent start calls into the same readiness result', async () => {
    const child = new FakeLocalApiChild()
    const health = deferred<Response>()
    const findAvailablePort = vi.fn(async () => 4888)
    const spawnLocalApi = vi.fn(() => child)
    const supervisor = new LocalApiSupervisor({
      fetch: vi.fn(() => health.promise),
      findAvailablePort,
      getCurrentProject: () => ({
        projectId: 'local-project-alpha',
        projectRoot: '/tmp/local-project',
        projectTitle: 'Desktop Local Project',
      }),
      sleep: async () => {},
      spawnLocalApi,
    })

    const firstStart = supervisor.start()
    const secondStart = supervisor.start()
    health.resolve(okResponse())

    await expect(firstStart).resolves.toMatchObject({
      status: 'ready',
    })
    await expect(secondStart).resolves.toMatchObject({
      runtimeConfig: {
        apiBaseUrl: 'http://127.0.0.1:4888/api',
        projectId: 'local-project-alpha',
        projectTitle: 'Desktop Local Project',
      },
      status: 'ready',
    })
    expect(findAvailablePort).toHaveBeenCalledTimes(1)
    expect(spawnLocalApi).toHaveBeenCalledTimes(1)
  })

  it('does not expose runtimeConfig before the local API status becomes ready', async () => {
    const child = new FakeLocalApiChild()
    const health = deferred<Response>()
    const supervisor = new LocalApiSupervisor({
      fetch: vi.fn(() => health.promise),
      findAvailablePort: async () => 4888,
      getCurrentProject: () => ({
        projectId: 'local-project-alpha',
        projectRoot: '/tmp/local-project',
        projectTitle: 'Desktop Local Project',
      }),
      sleep: async () => {},
      spawnLocalApi: () => child,
    })

    const startPromise = supervisor.start()

    expect(supervisor.getSnapshot()).toMatchObject({
      runtimeConfig: undefined,
      status: 'starting',
    })

    health.resolve(okResponse())

    await expect(startPromise).resolves.toMatchObject({
      runtimeConfig: {
        apiBaseUrl: 'http://127.0.0.1:4888/api',
        projectId: 'local-project-alpha',
        projectTitle: 'Desktop Local Project',
      },
      status: 'ready',
    })
  })

  it('posts model settings connection tests against the running local API and returns the sanitized record', async () => {
    const child = new FakeLocalApiChild()
    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof input === 'string' && input.endsWith('/api/health')) {
        return okResponse()
      }

      if (typeof input === 'string' && input.endsWith('/api/model-settings/test-connection')) {
        expect(init).toMatchObject({
          method: 'POST',
        })

        return {
          json: async () => ({
            errorCode: 'model_not_found',
            status: 'failed',
            summary: 'One or more configured OpenAI models were not found.',
          }),
          ok: true,
          status: 200,
        } as Response
      }

      throw new Error(`Unexpected fetch: ${String(input)}`)
    })
    const supervisor = new LocalApiSupervisor({
      fetch,
      findAvailablePort: async () => 4888,
      getCurrentProject: () => ({
        projectId: 'local-project-alpha',
        projectRoot: '/tmp/local-project',
        projectTitle: 'Desktop Local Project',
      }),
      sleep: async () => {},
      spawnLocalApi: () => child,
    })

    await expect(supervisor.testModelSettings()).resolves.toEqual({
      errorCode: 'model_not_found',
      status: 'failed',
      summary: 'One or more configured OpenAI models were not found.',
    })
    expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:4888/api/model-settings/test-connection',
      expect.objectContaining({
        method: 'POST',
      }),
    )
  })

  it('clears stale failed status and error details on restart before returning a fresh ready snapshot', async () => {
    const childOne = new FakeLocalApiChild()
    const childTwo = new FakeLocalApiChild()
    const children = [childOne, childTwo]
    let healthOk = false
    const supervisor = new LocalApiSupervisor({
      fetch: vi.fn(async () => (healthOk ? okResponse() : ({ ok: false, status: 503 } as Response))),
      findAvailablePort: async () => 4888,
      getCurrentProject: () => ({
        projectId: 'local-project-alpha',
        projectRoot: '/tmp/local-project',
        projectTitle: 'Desktop Local Project',
      }),
      healthPollIntervalMs: 1,
      healthTimeoutMs: 2,
      sleep: async () => {},
      spawnLocalApi: () => children.shift() ?? new FakeLocalApiChild(),
    })

    await expect(supervisor.start()).resolves.toMatchObject({
      lastError: expect.stringContaining('Local API health check failed'),
      status: 'failed',
    })
    expect(supervisor.getSnapshot()).toMatchObject({
      lastError: expect.stringContaining('Local API health check failed'),
      runtimeConfig: undefined,
      status: 'failed',
    })

    healthOk = true
    const restarted = await supervisor.restart()

    expect(restarted).toEqual({
      lastError: undefined,
      logs: [],
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
    expect(supervisor.getSnapshot()).toEqual(restarted)
    expect(childOne.killed).toBe(true)
  })

  it('restarts by stopping the current child and spawning a fresh process', async () => {
    const firstChild = new FakeLocalApiChild()
    const secondChild = new FakeLocalApiChild()
    const children = [firstChild, secondChild]
    const ports = [4888, 4889]
    const supervisor = new LocalApiSupervisor({
      fetch: async () => okResponse(),
      findAvailablePort: async () => ports.shift() ?? 4890,
      sleep: async () => {},
      spawnLocalApi: () => children.shift() ?? new FakeLocalApiChild(),
    })

    await supervisor.start()
    const snapshot = await supervisor.restart()

    expect(firstChild.killed).toBe(true)
    expect(snapshot.status).toBe('ready')
    expect(snapshot.runtimeConfig?.apiBaseUrl).toBe('http://127.0.0.1:4889/api')
  })
})
