import { afterEach, describe, expect, it, vi } from 'vitest'

import type { WorkerProcessHandle } from './process-supervisor-types.js'
import { WorkerSupervisor } from './worker-supervisor.js'

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
  vi.restoreAllMocks()
})

describe('WorkerSupervisor', () => {
  it('starts disabled until Electron explicitly restarts the worker boundary', () => {
    const supervisor = new WorkerSupervisor()

    expect(supervisor.getSnapshot()).toEqual({
      implementation: 'placeholder',
      lastError: undefined,
      processId: undefined,
      status: 'disabled',
    })
  })

  it('transitions from starting to ready and only exposes typed worker metadata', async () => {
    const ready = deferred<void>()
    const stop = vi.fn()
    const supervisor = new WorkerSupervisor({
      launchWorkerProcess: async () => ({
        implementation: 'placeholder',
        process: {
          pid: 4242,
          stop,
        } satisfies WorkerProcessHandle,
        ready: ready.promise,
      }),
    })

    const startPromise = supervisor.start()

    expect(supervisor.getSnapshot()).toEqual({
      implementation: 'placeholder',
      lastError: undefined,
      processId: undefined,
      status: 'starting',
    })

    ready.resolve()

    await expect(startPromise).resolves.toEqual({
      implementation: 'placeholder',
      lastError: undefined,
      processId: 4242,
      status: 'ready',
    })
    expect(stop).not.toHaveBeenCalled()
  })

  it('marks the placeholder worker failed when launch readiness rejects', async () => {
    const stop = vi.fn()
    const supervisor = new WorkerSupervisor({
      launchWorkerProcess: async () => ({
        implementation: 'placeholder',
        process: {
          pid: 4242,
          stop,
        } satisfies WorkerProcessHandle,
        ready: Promise.reject(new Error('worker heartbeat timeout')),
      }),
    })

    await expect(supervisor.start()).resolves.toEqual({
      implementation: 'placeholder',
      lastError: 'worker heartbeat timeout',
      processId: undefined,
      status: 'failed',
    })
    expect(stop).toHaveBeenCalledTimes(1)
  })

  it('restarts from failed into a fresh ready snapshot without keeping stale error state', async () => {
    const failedStop = vi.fn()
    const readyStop = vi.fn()
    const launches = [
      {
        implementation: 'placeholder' as const,
        process: {
          pid: 4001,
          stop: failedStop,
        } satisfies WorkerProcessHandle,
        ready: Promise.reject(new Error('worker boot failed')),
      },
      {
        implementation: 'placeholder' as const,
        process: {
          pid: 4002,
          stop: readyStop,
        } satisfies WorkerProcessHandle,
        ready: Promise.resolve(),
      },
    ]
    const supervisor = new WorkerSupervisor({
      launchWorkerProcess: async () => launches.shift() ?? launches[0],
    })

    await expect(supervisor.start()).resolves.toMatchObject({
      lastError: 'worker boot failed',
      status: 'failed',
    })

    await expect(supervisor.restart()).resolves.toEqual({
      implementation: 'placeholder',
      lastError: undefined,
      processId: 4002,
      status: 'ready',
    })
    expect(failedStop).toHaveBeenCalledTimes(1)
    expect(readyStop).not.toHaveBeenCalled()
  })

  it('does not let an obsolete ready resolution stop the active worker after restart', async () => {
    const firstReady = deferred<void>()
    const secondReady = deferred<void>()
    const firstStop = vi.fn()
    const secondStop = vi.fn()
    const launches = [
      {
        implementation: 'placeholder' as const,
        process: {
          pid: 6101,
          stop: firstStop,
        } satisfies WorkerProcessHandle,
        ready: firstReady.promise,
      },
      {
        implementation: 'placeholder' as const,
        process: {
          pid: 6102,
          stop: secondStop,
        } satisfies WorkerProcessHandle,
        ready: secondReady.promise,
      },
    ]
    const supervisor = new WorkerSupervisor({
      launchWorkerProcess: async () => {
        const launch = launches.shift()
        if (!launch) {
          throw new Error('unexpected extra launch')
        }

        return launch
      },
    })

    const firstStart = supervisor.start()
    await Promise.resolve()

    const restartPromise = supervisor.restart()
    await Promise.resolve()

    secondReady.resolve()

    await expect(restartPromise).resolves.toEqual({
      implementation: 'placeholder',
      lastError: undefined,
      processId: 6102,
      status: 'ready',
    })

    firstReady.resolve()

    await expect(firstStart).resolves.toEqual({
      implementation: 'placeholder',
      lastError: undefined,
      processId: 6102,
      status: 'ready',
    })
    expect(firstStop).toHaveBeenCalled()
    expect(secondStop).not.toHaveBeenCalled()
    expect(supervisor.getSnapshot()).toEqual({
      implementation: 'placeholder',
      lastError: undefined,
      processId: 6102,
      status: 'ready',
    })
  })

  it('does not let an obsolete startup failure overwrite the active worker snapshot', async () => {
    const firstReady = deferred<void>()
    const secondReady = deferred<void>()
    const firstStop = vi.fn()
    const secondStop = vi.fn()
    const launches = [
      {
        implementation: 'placeholder' as const,
        process: {
          pid: 7101,
          stop: firstStop,
        } satisfies WorkerProcessHandle,
        ready: firstReady.promise,
      },
      {
        implementation: 'placeholder' as const,
        process: {
          pid: 7102,
          stop: secondStop,
        } satisfies WorkerProcessHandle,
        ready: secondReady.promise,
      },
    ]
    const supervisor = new WorkerSupervisor({
      launchWorkerProcess: async () => {
        const launch = launches.shift()
        if (!launch) {
          throw new Error('unexpected extra launch')
        }

        return launch
      },
    })

    const firstStart = supervisor.start()
    await Promise.resolve()

    const restartPromise = supervisor.restart()
    await Promise.resolve()

    secondReady.resolve()

    await expect(restartPromise).resolves.toEqual({
      implementation: 'placeholder',
      lastError: undefined,
      processId: 7102,
      status: 'ready',
    })

    firstReady.reject(new Error('obsolete worker failed'))

    await expect(firstStart).resolves.toEqual({
      implementation: 'placeholder',
      lastError: undefined,
      processId: 7102,
      status: 'ready',
    })
    expect(firstStop).toHaveBeenCalled()
    expect(secondStop).not.toHaveBeenCalled()
    expect(supervisor.getSnapshot()).toEqual({
      implementation: 'placeholder',
      lastError: undefined,
      processId: 7102,
      status: 'ready',
    })
  })

  it('keeps the active startup promise when an obsolete launch settles while a new worker is still starting', async () => {
    const firstReady = deferred<void>()
    const secondReady = deferred<void>()
    const launches = [
      {
        implementation: 'placeholder' as const,
        process: {
          pid: 8101,
          stop: vi.fn(),
        } satisfies WorkerProcessHandle,
        ready: firstReady.promise,
      },
      {
        implementation: 'placeholder' as const,
        process: {
          pid: 8102,
          stop: vi.fn(),
        } satisfies WorkerProcessHandle,
        ready: secondReady.promise,
      },
    ]
    const launchWorkerProcess = vi.fn(async () => {
      const launch = launches.shift()
      if (!launch) {
        throw new Error('unexpected extra launch')
      }

      return launch
    })
    const supervisor = new WorkerSupervisor({
      launchWorkerProcess,
    })

    const firstStart = supervisor.start()
    await Promise.resolve()

    const restartPromise = supervisor.restart()
    await Promise.resolve()

    firstReady.resolve()
    await firstStart

    const followupStart = supervisor.start()
    secondReady.resolve()

    await expect(restartPromise).resolves.toEqual({
      implementation: 'placeholder',
      lastError: undefined,
      processId: 8102,
      status: 'ready',
    })
    await expect(followupStart).resolves.toEqual({
      implementation: 'placeholder',
      lastError: undefined,
      processId: 8102,
      status: 'ready',
    })
    expect(launchWorkerProcess).toHaveBeenCalledTimes(2)
  })

  it('stops a ready worker and reports the boundary as stopped', async () => {
    const stop = vi.fn()
    const supervisor = new WorkerSupervisor({
      launchWorkerProcess: async () => ({
        implementation: 'placeholder',
        process: {
          pid: 5110,
          stop,
        } satisfies WorkerProcessHandle,
        ready: Promise.resolve(),
      }),
    })

    await supervisor.start()

    expect(supervisor.stop()).toEqual({
      implementation: 'placeholder',
      lastError: undefined,
      processId: undefined,
      status: 'stopped',
    })
    expect(stop).toHaveBeenCalledTimes(1)
  })
})
