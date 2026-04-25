export type DesktopPlatform = 'darwin' | 'win32' | 'linux'
export type DesktopRuntimeMode = 'web' | 'desktop'

export interface NarrativeDesktopApi {
  getAppVersion(): Promise<string>
  getPlatform(): Promise<DesktopPlatform>
  getRuntimeMode(): Promise<DesktopRuntimeMode>
}

export const DESKTOP_API_CHANNELS = {
  getAppVersion: 'narrativeDesktop:getAppVersion',
  getPlatform: 'narrativeDesktop:getPlatform',
  getRuntimeMode: 'narrativeDesktop:getRuntimeMode',
} as const

export type DesktopApiChannel = (typeof DESKTOP_API_CHANNELS)[keyof typeof DESKTOP_API_CHANNELS]

declare global {
  interface Window {
    narrativeDesktop: NarrativeDesktopApi
  }
}
