import { spawn, type SpawnOptionsWithoutStdio } from 'node:child_process'
import type { Readable } from 'node:stream'

import { findAvailablePort } from './port-utils.js'
import { ProcessLogBuffer } from './process-log-buffer.js'
import type { SelectedProjectSession } from './project-picker.js'
import {
  createDesktopRuntimeConfig,
  createLocalApiProcessConfig,
  type ApiRuntimeModelSettingsPayload,
  resolveWorkspaceRoot,
  type DesktopRuntimeConfig,
  type LocalApiProcessConfig,
} from './runtime-config.js'
import type {
  DesktopModelConnectionTestRecord,
  DesktopModelBindings,
  OpenAiCompatibleProviderProfile,
} from '../shared/desktop-bridge-types.js'

export type LocalApiStatus = 'stopped' | 'starting' | 'ready' | 'failed'

export interface LocalApiSnapshot {
  status: LocalApiStatus
  runtimeConfig?: DesktopRuntimeConfig
  lastError?: string
  logs: string[]
}

export type LocalApiSpawnConfig = LocalApiProcessConfig

export interface LocalApiChildProcess {
  stdout?: Readable | null
  stderr?: Readable | null
  killed?: boolean
  kill(signal?: NodeJS.Signals | number): boolean
  on(event: 'exit', listener: (code: number | null, signal: NodeJS.Signals | null) => void): this
  on(event: 'error', listener: (error: Error) => void): this
}

export interface LocalApiSupervisorOptions {
  findAvailablePort?: () => Promise<number>
  getCurrentProject?: () => SelectedProjectSession | null
  getModelSettings?: (projectRoot: string) => Promise<{
    providers: OpenAiCompatibleProviderProfile[]
    bindings: DesktopModelBindings
  } | undefined>
  getProviderCredential?: (providerId: string) => Promise<string | null>
  spawnLocalApi?: (config: LocalApiSpawnConfig) => LocalApiChildProcess
  fetch?: typeof fetch
  sleep?: (ms: number) => Promise<void>
  healthPollIntervalMs?: number
  healthTimeoutMs?: number
  logBuffer?: ProcessLogBuffer
}

const DEFAULT_HEALTH_POLL_INTERVAL_MS = 250
const DEFAULT_HEALTH_TIMEOUT_MS = 15_000

function defaultSleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

function spawnLocalApiProcess(config: LocalApiSpawnConfig): LocalApiChildProcess {
  const options: SpawnOptionsWithoutStdio = {
    cwd: config.cwd,
    env: config.env,
    stdio: 'pipe',
  }

  return spawn(config.command, config.args, options)
}

export class LocalApiSupervisor {
  private status: LocalApiStatus = 'stopped'
  private runtimeConfig: DesktopRuntimeConfig | undefined
  private lastError: string | undefined
  private child: LocalApiChildProcess | null = null
  private startupPromise: Promise<LocalApiSnapshot> | null = null
  private stopping = false
  private readonly findPort: () => Promise<number>
  private readonly getCurrentProject: () => SelectedProjectSession | null
  private readonly getModelSettings: (projectRoot: string) => Promise<{
    providers: OpenAiCompatibleProviderProfile[]
    bindings: DesktopModelBindings
  } | undefined>
  private readonly getProviderCredential: (providerId: string) => Promise<string | null>
  private readonly spawnLocalApi: (config: LocalApiSpawnConfig) => LocalApiChildProcess
  private readonly fetchImpl: typeof fetch
  private readonly sleep: (ms: number) => Promise<void>
  private readonly healthPollIntervalMs: number
  private readonly healthTimeoutMs: number
  private readonly logBuffer: ProcessLogBuffer

  constructor({
    findAvailablePort: findPort = () => findAvailablePort(),
    getCurrentProject = () => null,
    getModelSettings = async () => undefined,
    getProviderCredential = async () => null,
    spawnLocalApi = spawnLocalApiProcess,
    fetch: fetchImpl = globalThis.fetch.bind(globalThis),
    sleep = defaultSleep,
    healthPollIntervalMs = DEFAULT_HEALTH_POLL_INTERVAL_MS,
    healthTimeoutMs = DEFAULT_HEALTH_TIMEOUT_MS,
    logBuffer = new ProcessLogBuffer(),
  }: LocalApiSupervisorOptions = {}) {
    this.findPort = findPort
    this.getCurrentProject = getCurrentProject
    this.getModelSettings = getModelSettings
    this.getProviderCredential = getProviderCredential
    this.spawnLocalApi = spawnLocalApi
    this.fetchImpl = fetchImpl
    this.sleep = sleep
    this.healthPollIntervalMs = healthPollIntervalMs
    this.healthTimeoutMs = healthTimeoutMs
    this.logBuffer = logBuffer
  }

  getSnapshot(): LocalApiSnapshot {
    return {
      lastError: this.lastError,
      logs: this.logBuffer.getLines(),
      runtimeConfig: this.status === 'ready' ? this.runtimeConfig : undefined,
      status: this.status,
    }
  }

  getLogs(): string[] {
    return this.logBuffer.getLines()
  }

  async start(): Promise<LocalApiSnapshot> {
    if (this.status === 'ready') {
      return this.getSnapshot()
    }

    if (this.startupPromise) {
      return this.startupPromise
    }

    this.startupPromise = this.startLocalApi().finally(() => {
      this.startupPromise = null
    })

    return this.startupPromise
  }

  private async startLocalApi(): Promise<LocalApiSnapshot> {
    this.status = 'starting'
    this.lastError = undefined
    this.stopping = false

    try {
      const port = await this.findPort()
      const currentProject = this.getCurrentProject()
      if (!currentProject) {
        throw new Error('No desktop project is selected.')
      }

      this.runtimeConfig = createDesktopRuntimeConfig(port, {
        currentProject,
      })
      const persistedModelSettings = await this.getModelSettings(currentProject.projectRoot)
      const modelSettings = await this.resolveRuntimeModelSettings(persistedModelSettings)
      const spawnConfig = createLocalApiProcessConfig({
        currentProject,
        modelSettings,
        port,
      })
      const child = this.spawnLocalApi(spawnConfig)
      this.child = child
      this.attachChildHandlers(child)

      await Promise.race([
        this.waitForHealth(this.runtimeConfig.apiHealthUrl),
        this.waitForChildFailure(child),
      ])
      if (this.child === child && this.status === 'starting') {
        this.status = 'ready'
      }
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error)
      this.status = 'failed'
      this.runtimeConfig = undefined
      this.stopChild()
    }

    return this.getSnapshot()
  }

  async restart(): Promise<LocalApiSnapshot> {
    this.stop()
    return this.start()
  }

  async testModelSettings(): Promise<DesktopModelConnectionTestRecord> {
    const snapshot = await this.ensureReadyForControlPlaneRequest()
    if (!snapshot.runtimeConfig) {
      throw new Error(snapshot.lastError ?? 'Local API runtime config is unavailable.')
    }

    const response = await this.fetchImpl(`${snapshot.runtimeConfig.apiBaseUrl}/model-settings/test-connection`, {
      method: 'POST',
    })
    if (!response.ok) {
      throw new Error(`Model settings connection test failed with HTTP ${response.status}.`)
    }

    return response.json() as Promise<DesktopModelConnectionTestRecord>
  }

  stop(): LocalApiSnapshot {
    this.status = 'stopped'
    this.lastError = undefined
    this.stopping = true
    this.startupPromise = null
    this.stopChild()
    return this.getSnapshot()
  }

  private async resolveRuntimeModelSettings(
    persistedModelSettings?: {
      providers: OpenAiCompatibleProviderProfile[]
      bindings: DesktopModelBindings
    },
  ): Promise<ApiRuntimeModelSettingsPayload> {
    const providers = persistedModelSettings?.providers ?? []
    const runtimeProviders = await Promise.all(providers.map(async (provider) => {
      const apiKey = await this.getProviderCredential(provider.id)
      return {
        ...(apiKey ? { apiKey } : {}),
        baseUrl: provider.baseUrl,
        id: provider.id,
        label: provider.label,
      }
    }))

    return {
      bindings: persistedModelSettings?.bindings ?? {
        continuityReviewer: { provider: 'fixture' },
        planner: { provider: 'fixture' },
        sceneProseWriter: { provider: 'fixture' },
        sceneRevision: { provider: 'fixture' },
        summary: { provider: 'fixture' },
      },
      providers: runtimeProviders,
    }
  }

  private attachChildHandlers(child: LocalApiChildProcess): void {
    child.stdout?.on('data', (chunk: Buffer) => {
      this.logBuffer.append('stdout', chunk)
    })
    child.stderr?.on('data', (chunk: Buffer) => {
      this.logBuffer.append('stderr', chunk)
    })
    child.on('error', (error) => {
      if (this.child !== child || this.stopping) {
        return
      }

      this.lastError = error.message
      this.status = 'failed'
    })
    child.on('exit', (code, signal) => {
      if (this.child !== child || this.stopping) {
        return
      }

      this.lastError = `Local API process exited before shutdown (code=${code ?? 'null'}, signal=${signal ?? 'null'}).`
      this.status = 'failed'
      this.child = null
    })
  }

  private waitForChildFailure(child: LocalApiChildProcess): Promise<never> {
    return new Promise((_, reject) => {
      child.on('error', (error) => {
        if (this.child === child && !this.stopping) {
          reject(error)
        }
      })
      child.on('exit', (code, signal) => {
        if (this.child === child && !this.stopping) {
          reject(new Error(`Local API process exited before shutdown (code=${code ?? 'null'}, signal=${signal ?? 'null'}).`))
        }
      })
    })
  }

  private stopChild(): void {
    if (!this.child || this.child.killed) {
      this.child = null
      return
    }

    this.child.kill()
    this.child = null
  }

  private async waitForHealth(healthUrl: string): Promise<void> {
    const startedAt = Date.now()
    let lastError: string | undefined

    while (Date.now() - startedAt < this.healthTimeoutMs) {
      this.throwIfChildFailed()
      const abortController = new AbortController()
      const remainingTimeoutMs = Math.max(1, this.healthTimeoutMs - (Date.now() - startedAt))
      const attemptTimeoutMs = Math.max(1, Math.min(this.healthPollIntervalMs, remainingTimeoutMs))
      let attemptTimeout: ReturnType<typeof setTimeout> | undefined

      try {
        const response = await Promise.race([
          this.fetchImpl(healthUrl, {
            signal: abortController.signal,
          }),
          new Promise<never>((_, reject) => {
            attemptTimeout = setTimeout(() => {
              abortController.abort()
              reject(new Error(`Health fetch timed out after ${attemptTimeoutMs}ms`))
            }, attemptTimeoutMs)
          }),
        ])

        if (response.ok) {
          return
        }

        lastError = `HTTP ${response.status}`
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error)
      } finally {
        if (attemptTimeout) {
          clearTimeout(attemptTimeout)
        }
        abortController.abort()
      }

      const remainingSleepMs = Math.max(0, this.healthTimeoutMs - (Date.now() - startedAt))
      if (remainingSleepMs > 0) {
        await this.sleep(Math.min(this.healthPollIntervalMs, remainingSleepMs))
      }
      this.throwIfChildFailed()
    }

    throw new Error(`Local API health check failed at ${healthUrl}${lastError ? `: ${lastError}` : ''}`)
  }

  private throwIfChildFailed(): void {
    if (this.status === 'failed') {
      throw new Error(this.lastError ?? 'Local API process failed before readiness.')
    }
  }

  private async ensureReadyForControlPlaneRequest(): Promise<LocalApiSnapshot> {
    if (this.status === 'ready') {
      return this.getSnapshot()
    }

    if (this.status === 'stopped') {
      return this.start()
    }

    return this.restart()
  }
}

export function createLocalApiSupervisor(options?: LocalApiSupervisorOptions): LocalApiSupervisor {
  return new LocalApiSupervisor(options)
}
