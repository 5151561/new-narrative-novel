import {
  DESKTOP_API_CHANNELS,
  type DesktopApiChannel,
  type DesktopRuntimeConfig,
  type LocalApiStatusSnapshot,
  type DesktopPlatform,
  type DesktopRuntimeMode,
  type NarrativeDesktopApi,
} from '../shared/desktop-bridge-types.js'

export type DesktopIpcInvoke = <T>(channel: DesktopApiChannel) => Promise<T>

export function createNarrativeDesktopApi(invoke: DesktopIpcInvoke): NarrativeDesktopApi {
  return {
    getAppVersion: () => invoke<string>(DESKTOP_API_CHANNELS.getAppVersion),
    getPlatform: () => invoke<DesktopPlatform>(DESKTOP_API_CHANNELS.getPlatform),
    getRuntimeMode: () => invoke<DesktopRuntimeMode>(DESKTOP_API_CHANNELS.getRuntimeMode),
    getRuntimeConfig: () => invoke<DesktopRuntimeConfig>(DESKTOP_API_CHANNELS.getRuntimeConfig),
    getLocalApiStatus: () => invoke<LocalApiStatusSnapshot>(DESKTOP_API_CHANNELS.getLocalApiStatus),
    restartLocalApi: () => invoke<LocalApiStatusSnapshot>(DESKTOP_API_CHANNELS.restartLocalApi),
    getLocalApiLogs: () => invoke<string[]>(DESKTOP_API_CHANNELS.getLocalApiLogs),
  }
}
