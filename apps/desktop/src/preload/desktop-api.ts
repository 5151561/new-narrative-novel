import {
  type CurrentProjectSnapshot,
  DESKTOP_API_CHANNELS,
  type DesktopModelConnectionTestRecord,
  type DesktopModelBindings,
  type DesktopApiChannel,
  type DesktopModelSettingsSnapshot,
  type DesktopRuntimeConfig,
  type LocalApiStatusSnapshot,
  type DesktopPlatform,
  type DesktopRuntimeMode,
  type NarrativeDesktopApi,
  type OpenAiCompatibleProviderProfile,
  type ProviderCredentialReference,
  type ProviderCredentialStatus,
  type SaveProviderCredentialInput,
  type UpdateModelBindingInput,
  type WorkerStatusSnapshot,
} from '../shared/desktop-bridge-types.js'

export type DesktopIpcInvoke = <T>(channel: DesktopApiChannel, ...args: unknown[]) => Promise<T>

export function createNarrativeDesktopApi(invoke: DesktopIpcInvoke): NarrativeDesktopApi {
  return {
    getAppVersion: () => invoke<string>(DESKTOP_API_CHANNELS.getAppVersion),
    openDemoProject: () => invoke<CurrentProjectSnapshot>(DESKTOP_API_CHANNELS.openDemoProject),
    createRealProject: () => invoke<CurrentProjectSnapshot | null>(DESKTOP_API_CHANNELS.createRealProject),
    openExistingProject: () => invoke<CurrentProjectSnapshot | null>(DESKTOP_API_CHANNELS.openExistingProject),
    getCurrentProject: () => invoke<CurrentProjectSnapshot | null>(DESKTOP_API_CHANNELS.getCurrentProject),
    getPlatform: () => invoke<DesktopPlatform>(DESKTOP_API_CHANNELS.getPlatform),
    getRuntimeMode: () => invoke<DesktopRuntimeMode>(DESKTOP_API_CHANNELS.getRuntimeMode),
    getRuntimeConfig: () => invoke<DesktopRuntimeConfig>(DESKTOP_API_CHANNELS.getRuntimeConfig),
    getLocalApiStatus: () => invoke<LocalApiStatusSnapshot>(DESKTOP_API_CHANNELS.getLocalApiStatus),
    restartLocalApi: () => invoke<LocalApiStatusSnapshot>(DESKTOP_API_CHANNELS.restartLocalApi),
    getLocalApiLogs: () => invoke<string[]>(DESKTOP_API_CHANNELS.getLocalApiLogs),
    getWorkerStatus: () => invoke<WorkerStatusSnapshot>(DESKTOP_API_CHANNELS.getWorkerStatus),
    restartWorker: () => invoke<WorkerStatusSnapshot>(DESKTOP_API_CHANNELS.restartWorker),
    getProviderProfiles: () => invoke<OpenAiCompatibleProviderProfile[]>(DESKTOP_API_CHANNELS.getProviderProfiles),
    saveProviderProfile: (profile: OpenAiCompatibleProviderProfile) => invoke<OpenAiCompatibleProviderProfile[]>(
      DESKTOP_API_CHANNELS.saveProviderProfile,
      profile,
    ),
    deleteProviderProfile: (providerId: string) => invoke<OpenAiCompatibleProviderProfile[]>(
      DESKTOP_API_CHANNELS.deleteProviderProfile,
      providerId,
    ),
    getProviderCredentialStatus: (input: ProviderCredentialReference) => invoke<ProviderCredentialStatus>(
      DESKTOP_API_CHANNELS.getProviderCredentialStatus,
      input,
    ),
    saveProviderCredential: (input: SaveProviderCredentialInput) => invoke<ProviderCredentialStatus>(
      DESKTOP_API_CHANNELS.saveProviderCredential,
      input,
    ),
    deleteProviderCredential: (input: ProviderCredentialReference) => invoke<ProviderCredentialStatus>(
      DESKTOP_API_CHANNELS.deleteProviderCredential,
      input,
    ),
    getModelBindings: () => invoke<DesktopModelBindings>(DESKTOP_API_CHANNELS.getModelBindings),
    getModelSettingsSnapshot: () => invoke<DesktopModelSettingsSnapshot>(DESKTOP_API_CHANNELS.getModelSettingsSnapshot),
    testModelSettings: () => invoke<DesktopModelConnectionTestRecord>(DESKTOP_API_CHANNELS.testModelSettings),
    updateModelBinding: (input: UpdateModelBindingInput) => invoke<DesktopModelBindings>(
      DESKTOP_API_CHANNELS.updateModelBinding,
      input,
    ),
  }
}
