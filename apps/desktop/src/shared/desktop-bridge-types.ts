export type DesktopPlatform = 'darwin' | 'win32' | 'linux'
export type DesktopRuntimeMode = 'web' | 'desktop'
export type DesktopLocalRuntimeMode = 'desktop-local'
export type LocalApiStatus = 'stopped' | 'starting' | 'ready' | 'failed'
export type WorkerStatus = 'disabled' | 'starting' | 'ready' | 'failed' | 'stopped'
export type ProviderCredentialProvider = 'openai'
export type DesktopModelBindingProvider = 'fixture' | 'openai'
export const DESKTOP_MODEL_BINDING_ROLES = [
  'planner',
  'sceneProseWriter',
  'sceneRevision',
  'continuityReviewer',
  'summary',
] as const
export type DesktopModelBindingRole = (typeof DESKTOP_MODEL_BINDING_ROLES)[number]

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

export interface ProviderCredentialStatus {
  provider: ProviderCredentialProvider
  configured: boolean
  redactedValue?: string
}

export interface SaveProviderCredentialInput {
  provider: ProviderCredentialProvider
  secret: string
}

export type DesktopModelConnectionTestStatus = 'never' | 'passed' | 'failed'
export type DesktopModelConnectionTestErrorCode =
  | 'missing_key'
  | 'invalid_key'
  | 'model_not_found'
  | 'network_error'
  | 'invalid_output'

export interface DesktopModelConnectionTestRecord {
  status: DesktopModelConnectionTestStatus
  errorCode?: DesktopModelConnectionTestErrorCode
  summary?: string
}

export interface DesktopModelBinding {
  provider: DesktopModelBindingProvider
  modelId?: string
}

export type DesktopModelBindings = Record<DesktopModelBindingRole, DesktopModelBinding>

export interface UpdateModelBindingInput {
  role: DesktopModelBindingRole
  binding: DesktopModelBinding
}

export interface DesktopModelSettingsSnapshot {
  bindings: DesktopModelBindings
  credentialStatus: ProviderCredentialStatus
  connectionTest: DesktopModelConnectionTestRecord
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
  getProviderCredentialStatus(provider: ProviderCredentialProvider): Promise<ProviderCredentialStatus>
  saveProviderCredential(input: SaveProviderCredentialInput): Promise<ProviderCredentialStatus>
  deleteProviderCredential(provider: ProviderCredentialProvider): Promise<ProviderCredentialStatus>
  getModelBindings(): Promise<DesktopModelBindings>
  getModelSettingsSnapshot(): Promise<DesktopModelSettingsSnapshot>
  testModelSettings(): Promise<DesktopModelConnectionTestRecord>
  updateModelBinding(input: UpdateModelBindingInput): Promise<DesktopModelBindings>
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
  getProviderCredentialStatus: 'narrativeDesktop:getProviderCredentialStatus',
  saveProviderCredential: 'narrativeDesktop:saveProviderCredential',
  deleteProviderCredential: 'narrativeDesktop:deleteProviderCredential',
  getModelBindings: 'narrativeDesktop:getModelBindings',
  getModelSettingsSnapshot: 'narrativeDesktop:getModelSettingsSnapshot',
  testModelSettings: 'narrativeDesktop:testModelSettings',
  updateModelBinding: 'narrativeDesktop:updateModelBinding',
} as const

export type DesktopApiChannel = (typeof DESKTOP_API_CHANNELS)[keyof typeof DESKTOP_API_CHANNELS]

declare global {
  interface Window {
    narrativeDesktop: NarrativeDesktopApi
  }
}
