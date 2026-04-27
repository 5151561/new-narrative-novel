export interface WorkerProcessHandle {
  readonly pid?: number
  stop(): void
}

export interface WorkerProcessLaunchResult {
  implementation?: 'placeholder'
  process: WorkerProcessHandle
  ready: Promise<void>
}

export interface WorkerSupervisorOptions {
  launchWorkerProcess?: () => Promise<WorkerProcessLaunchResult> | WorkerProcessLaunchResult
}
