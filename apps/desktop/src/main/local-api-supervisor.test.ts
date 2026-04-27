import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { LocalApiSupervisor, type LocalApiChildProcess, type LocalApiSpawnConfig } from './local-api-supervisor.js'

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
    const spawnConfigs: LocalApiSpawnConfig[] = []
    const fetch = vi.fn(async () => okResponse())
    const supervisor = new LocalApiSupervisor({
      fetch,
      findAvailablePort: async () => 4888,
      sleep: async () => {},
      spawnLocalApi: (config) => {
        spawnConfigs.push(config)
        return child
      },
    })

    const snapshot = await supervisor.start()
    child.stdout.write('api ready\n')

    expect(snapshot.status).toBe('ready')
    expect(snapshot.runtimeConfig).toEqual({
      apiBaseUrl: 'http://127.0.0.1:4888/api',
      apiHealthUrl: 'http://127.0.0.1:4888/api/health',
      port: 4888,
      runtimeMode: 'desktop-local',
    })
    expect(spawnConfigs).toHaveLength(1)
    expect(spawnConfigs[0]?.env).toMatchObject({
      NARRATIVE_RUNTIME: 'desktop-local',
      PORT: '4888',
    })
    expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:4888/api/health', { signal: expect.any(AbortSignal) })
    expect(supervisor.getSnapshot().logs).toContain('[stdout] api ready')
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
      },
      status: 'ready',
    })
  })

  it('clears stale failed status and error details on restart before returning a fresh ready snapshot', async () => {
    const childOne = new FakeLocalApiChild()
    const childTwo = new FakeLocalApiChild()
    const children = [childOne, childTwo]
    let healthOk = false
    const supervisor = new LocalApiSupervisor({
      fetch: vi.fn(async () => (healthOk ? okResponse() : ({ ok: false, status: 503 } as Response))),
      findAvailablePort: async () => 4888,
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
