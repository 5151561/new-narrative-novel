import {
  type CurrentProjectSnapshot,
  DESKTOP_API_CHANNELS,
  type DesktopModelBindings,
  type DesktopApiChannel,
  type DesktopModelBindingRole,
  type DesktopModelBindingProvider,
  type DesktopRuntimeConfig,
  type LocalApiStatusSnapshot,
  type DesktopPlatform,
  type DesktopRuntimeMode,
  type NarrativeDesktopApi,
  type ProviderCredentialProvider,
  type ProviderCredentialStatus,
  type SaveProviderCredentialInput,
  type UpdateModelBindingInput,
  type WorkerStatusSnapshot,
} from '../shared/desktop-bridge-types.js'

export type DesktopIpcInvoke = <T>(channel: DesktopApiChannel, ...args: unknown[]) => Promise<T>

export function createNarrativeDesktopApi(invoke: DesktopIpcInvoke): NarrativeDesktopApi {
  return {
    getAppVersion: () => invoke<string>(DESKTOP_API_CHANNELS.getAppVersion),
    getCurrentProject: () => invoke<CurrentProjectSnapshot | null>(DESKTOP_API_CHANNELS.getCurrentProject),
    getPlatform: () => invoke<DesktopPlatform>(DESKTOP_API_CHANNELS.getPlatform),
    getRuntimeMode: () => invoke<DesktopRuntimeMode>(DESKTOP_API_CHANNELS.getRuntimeMode),
    getRuntimeConfig: () => invoke<DesktopRuntimeConfig>(DESKTOP_API_CHANNELS.getRuntimeConfig),
    getLocalApiStatus: () => invoke<LocalApiStatusSnapshot>(DESKTOP_API_CHANNELS.getLocalApiStatus),
    restartLocalApi: () => invoke<LocalApiStatusSnapshot>(DESKTOP_API_CHANNELS.restartLocalApi),
    getLocalApiLogs: () => invoke<string[]>(DESKTOP_API_CHANNELS.getLocalApiLogs),
    getWorkerStatus: () => invoke<WorkerStatusSnapshot>(DESKTOP_API_CHANNELS.getWorkerStatus),
    restartWorker: () => invoke<WorkerStatusSnapshot>(DESKTOP_API_CHANNELS.restartWorker),
    getProviderCredentialStatus: (provider: ProviderCredentialProvider) => invoke<ProviderCredentialStatus>(
      DESKTOP_API_CHANNELS.getProviderCredentialStatus,
      provider,
    ),
    saveProviderCredential: (input: SaveProviderCredentialInput) => invoke<ProviderCredentialStatus>(
      DESKTOP_API_CHANNELS.saveProviderCredential,
      input,
    ),
    deleteProviderCredential: (provider: ProviderCredentialProvider) => invoke<ProviderCredentialStatus>(
      DESKTOP_API_CHANNELS.deleteProviderCredential,
      provider,
    ),
    getModelBindings: () => invoke<DesktopModelBindings>(DESKTOP_API_CHANNELS.getModelBindings),
    updateModelBinding: (input: UpdateModelBindingInput) => invoke<DesktopModelBindings>(
      DESKTOP_API_CHANNELS.updateModelBinding,
      input,
    ),
  }
}
