export type DesktopPlatform = 'darwin' | 'win32' | 'linux'
export type DesktopRuntimeMode = 'web' | 'desktop'
export type DesktopLocalRuntimeMode = 'desktop-local'
export type LocalApiStatus = 'stopped' | 'starting' | 'ready' | 'failed'

export interface DesktopRuntimeConfig {
  runtimeMode: DesktopLocalRuntimeMode
  apiBaseUrl: string
  apiHealthUrl: string
  port: number
}

export interface LocalApiStatusSnapshot {
  status: LocalApiStatus
  runtimeConfig?: DesktopRuntimeConfig
  lastError?: string
}

export interface NarrativeDesktopApi {
  getAppVersion(): Promise<string>
  getPlatform(): Promise<DesktopPlatform>
  getRuntimeMode(): Promise<DesktopRuntimeMode>
  getRuntimeConfig(): Promise<DesktopRuntimeConfig>
  getLocalApiStatus(): Promise<LocalApiStatusSnapshot>
  restartLocalApi(): Promise<LocalApiStatusSnapshot>
  getLocalApiLogs(): Promise<string[]>
}

export const DESKTOP_API_CHANNELS = {
  getAppVersion: 'narrativeDesktop:getAppVersion',
  getPlatform: 'narrativeDesktop:getPlatform',
  getRuntimeMode: 'narrativeDesktop:getRuntimeMode',
  getRuntimeConfig: 'narrativeDesktop:getRuntimeConfig',
  getLocalApiStatus: 'narrativeDesktop:getLocalApiStatus',
  restartLocalApi: 'narrativeDesktop:restartLocalApi',
  getLocalApiLogs: 'narrativeDesktop:getLocalApiLogs',
} as const

export type DesktopApiChannel = (typeof DESKTOP_API_CHANNELS)[keyof typeof DESKTOP_API_CHANNELS]

declare global {
  interface Window {
    narrativeDesktop: NarrativeDesktopApi
  }
}
