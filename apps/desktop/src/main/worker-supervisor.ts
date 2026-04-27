import type { WorkerStatusSnapshot } from '../shared/desktop-bridge-types.js'
import type { WorkerProcessHandle, WorkerProcessLaunchResult, WorkerSupervisorOptions } from './process-supervisor-types.js'

class PlaceholderWorkerProcess implements WorkerProcessHandle {
  readonly pid = undefined

  stop(): void {}
}

function launchPlaceholderWorkerProcess(): WorkerProcessLaunchResult {
  return {
    implementation: 'placeholder',
    process: new PlaceholderWorkerProcess(),
    ready: Promise.resolve(),
  }
}

export class WorkerSupervisor {
  private status: WorkerStatusSnapshot['status'] = 'disabled'
  private lastError: string | undefined
  private process: WorkerProcessHandle | null = null
  private implementation: WorkerStatusSnapshot['implementation'] = 'placeholder'
  private startupPromise: Promise<WorkerStatusSnapshot> | null = null
  private startupToken = 0
  private readonly launchWorkerProcess: () => Promise<WorkerProcessLaunchResult> | WorkerProcessLaunchResult

  constructor({ launchWorkerProcess = launchPlaceholderWorkerProcess }: WorkerSupervisorOptions = {}) {
    this.launchWorkerProcess = launchWorkerProcess
  }

  getSnapshot(): WorkerStatusSnapshot {
    return {
      implementation: this.implementation,
      lastError: this.lastError,
      processId: this.status === 'ready' ? this.process?.pid : undefined,
      status: this.status,
    }
  }

  async start(): Promise<WorkerStatusSnapshot> {
    if (this.status === 'ready') {
      return this.getSnapshot()
    }

    if (this.startupPromise) {
      return this.startupPromise
    }

    const token = ++this.startupToken
    const startupPromise = this.startWorker(token)
    const trackedPromise = startupPromise.finally(() => {
      if (this.startupPromise === trackedPromise) {
        this.startupPromise = null
      }
    })

    this.startupPromise = trackedPromise

    return trackedPromise
  }

  async restart(): Promise<WorkerStatusSnapshot> {
    this.stop()
    return this.start()
  }

  stop(): WorkerStatusSnapshot {
    this.startupToken += 1
    this.startupPromise = null
    this.lastError = undefined
    this.status = this.status === 'disabled' ? 'disabled' : 'stopped'
    this.stopProcess()
    return this.getSnapshot()
  }

  private async startWorker(token: number): Promise<WorkerStatusSnapshot> {
    this.status = 'starting'
    this.lastError = undefined
    let launchedProcess: WorkerProcessHandle | null = null

    try {
      const launched = await this.launchWorkerProcess()
      launchedProcess = launched.process

      if (token !== this.startupToken) {
        launchedProcess.stop()
        return this.getSnapshot()
      }

      this.implementation = launched.implementation ?? 'placeholder'
      this.process = launchedProcess
      await launched.ready

      if (token !== this.startupToken) {
        this.stopLaunchedProcess(launchedProcess)
        return this.getSnapshot()
      }

      this.status = 'ready'
    } catch (error) {
      if (token !== this.startupToken) {
        this.stopLaunchedProcess(launchedProcess)
        return this.getSnapshot()
      }

      this.lastError = error instanceof Error ? error.message : String(error)
      this.status = 'failed'
      this.stopLaunchedProcess(launchedProcess)
    }

    return this.getSnapshot()
  }

  private stopLaunchedProcess(process: WorkerProcessHandle | null): void {
    if (!process) {
      return
    }

    process.stop()

    if (this.process === process) {
      this.process = null
    }
  }

  private stopProcess(): void {
    if (!this.process) {
      return
    }

    this.stopLaunchedProcess(this.process)
  }
}

export function createWorkerSupervisor(): WorkerSupervisor {
  return new WorkerSupervisor()
}
