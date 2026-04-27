export type DesktopPlatform = 'darwin' | 'win32' | 'linux'
export type DesktopRuntimeMode = 'web' | 'desktop'
export type DesktopLocalRuntimeMode = 'desktop-local'
export type LocalApiStatus = 'stopped' | 'starting' | 'ready' | 'failed'
export type WorkerStatus = 'disabled' | 'starting' | 'ready' | 'failed' | 'stopped'

export interface DesktopRuntimeConfig {
  runtimeMode: DesktopLocalRuntimeMode
  apiBaseUrl: string
  apiHealthUrl: string
  port: number
  projectId: string
  projectTitle: string
}

export interface LocalApiStatusSnapshot {
  status: LocalApiStatus
  runtimeConfig?: DesktopRuntimeConfig
  lastError?: string
}

export interface CurrentProjectSnapshot {
  projectId: string
  projectTitle: string
}

export interface WorkerStatusSnapshot {
  status: WorkerStatus
  implementation: 'placeholder'
  processId?: number
  lastError?: string
}

export interface NarrativeDesktopApi {
  getAppVersion(): Promise<string>
  getCurrentProject(): Promise<CurrentProjectSnapshot | null>
  getPlatform(): Promise<DesktopPlatform>
  getRuntimeMode(): Promise<DesktopRuntimeMode>
  getRuntimeConfig(): Promise<DesktopRuntimeConfig>
  getLocalApiStatus(): Promise<LocalApiStatusSnapshot>
  restartLocalApi(): Promise<LocalApiStatusSnapshot>
  getLocalApiLogs(): Promise<string[]>
  getWorkerStatus(): Promise<WorkerStatusSnapshot>
  restartWorker(): Promise<WorkerStatusSnapshot>
}

export const DESKTOP_API_CHANNELS = {
  getAppVersion: 'narrativeDesktop:getAppVersion',
  getCurrentProject: 'narrativeDesktop:getCurrentProject',
  getPlatform: 'narrativeDesktop:getPlatform',
  getRuntimeMode: 'narrativeDesktop:getRuntimeMode',
  getRuntimeConfig: 'narrativeDesktop:getRuntimeConfig',
  getLocalApiStatus: 'narrativeDesktop:getLocalApiStatus',
  restartLocalApi: 'narrativeDesktop:restartLocalApi',
  getLocalApiLogs: 'narrativeDesktop:getLocalApiLogs',
  getWorkerStatus: 'narrativeDesktop:getWorkerStatus',
  restartWorker: 'narrativeDesktop:restartWorker',
} as const

export type DesktopApiChannel = (typeof DESKTOP_API_CHANNELS)[keyof typeof DESKTOP_API_CHANNELS]

declare global {
  interface Window {
    narrativeDesktop: NarrativeDesktopApi
  }
}
