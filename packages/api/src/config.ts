import path from 'node:path'

import { resolveDefaultProjectStoreFilePath } from './repositories/project-state-persistence.js'
import {
  createModelBindingsFromLegacyConfig,
  DEFAULT_MODEL_BINDINGS,
  MODEL_BINDING_ROLES,
  resolveModelBindingsFromRuntimeSettings,
  type ApiRuntimeModelSettingsPayload,
  type ApiRuntimeOpenAiCompatibleProviderProfile,
  type ModelBindingInput,
  type ModelBindings,
  type ModelBindingRole,
  type ModelBindingProvider,
  type ResolvedModelBinding,
} from './orchestration/modelGateway/model-binding.js'

export type ModelProvider = ModelBindingProvider

export interface ApiServerConfig {
  host: string
  port: number
  apiBasePath: string
  apiBaseUrl: string
  corsOrigin: string | true
  currentProject?: {
    projectId: string
    projectMode: 'demo-fixture' | 'real-project'
    projectRoot: string
    projectTitle: string
  }
  projectStoreFilePath?: string
  projectArtifactDirPath?: string
  projectStateFilePath?: string
  modelProvider: ModelProvider
  openAiModel?: string
  openAiApiKey?: string
  modelBindings?: ModelBindings
}

type CurrentProjectConfig = NonNullable<ApiServerConfig['currentProject']>
type LegacyEnvModelProvider = ModelProvider | 'openai'

function readPort(name: string, fallback: number) {
  const value = process.env[name]
  if (!value) {
    return fallback
  }

  if (!/^\d+$/.test(value)) {
    throw new Error(`${name} must be a full integer string between 0 and 65535`)
  }

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65535) {
    throw new Error(`${name} must be a full integer string between 0 and 65535`)
  }

  return parsed
}

function readModelProvider(name = 'NARRATIVE_MODEL_PROVIDER', fallback?: LegacyEnvModelProvider): LegacyEnvModelProvider {
  const value = process.env[name]
  if (value === undefined) {
    return fallback ?? 'fixture'
  }

  if (value === 'fixture' || value === 'openai' || value === 'openai-compatible') {
    return value
  }

  throw new Error(`${name} must be one of: fixture, openai, openai-compatible`)
}

function normalizeModelProvider(provider: LegacyEnvModelProvider): ModelProvider {
  return provider === 'openai' ? 'openai-compatible' : provider
}

function readOptionalTrimmedEnv(name: string) {
  const value = process.env[name]?.trim()
  return value ? value : undefined
}

function readCurrentProject(): CurrentProjectConfig | undefined {
  const projectRoot = readOptionalTrimmedEnv('NARRATIVE_PROJECT_ROOT')
  const projectId = readOptionalTrimmedEnv('NARRATIVE_PROJECT_ID')
  const projectMode = readOptionalTrimmedEnv('NARRATIVE_PROJECT_MODE')
  const projectTitle = readOptionalTrimmedEnv('NARRATIVE_PROJECT_TITLE')

  if (!projectRoot || !projectId || !projectTitle) {
    return undefined
  }

  if (projectMode !== undefined && projectMode !== 'demo-fixture' && projectMode !== 'real-project') {
    throw new Error('NARRATIVE_PROJECT_MODE must be one of: demo-fixture, real-project')
  }

  const resolvedProjectMode: CurrentProjectConfig['projectMode'] = projectMode ?? 'real-project'

  return {
    projectId,
    projectMode: resolvedProjectMode,
    projectRoot,
    projectTitle,
  }
}

const ROLE_ENV_PREFIXES: Record<ModelBindingRole, string> = {
  continuityReviewer: 'NARRATIVE_CONTINUITY_REVIEWER',
  planner: 'NARRATIVE_PLANNER',
  sceneProseWriter: 'NARRATIVE_SCENE_PROSE_WRITER',
  sceneRevision: 'NARRATIVE_SCENE_REVISION',
  summary: 'NARRATIVE_SUMMARY',
}

function readRoleModelBinding(role: ModelBindingRole, legacyBinding: ResolvedModelBinding): ResolvedModelBinding {
  const prefix = ROLE_ENV_PREFIXES[role]
  const provider = normalizeModelProvider(readModelProvider(
    `${prefix}_MODEL_PROVIDER`,
    legacyBinding.provider === 'fixture' ? 'fixture' : 'openai-compatible',
  ))

  if (provider !== 'openai-compatible') {
    return {
      provider: 'fixture',
    }
  }

  if (legacyBinding.provider !== 'openai-compatible') {
    return {
      provider: 'fixture',
    }
  }

  return {
    apiKey: readOptionalTrimmedEnv(`${prefix}_OPENAI_API_KEY`) ?? legacyBinding.apiKey,
    baseUrl: legacyBinding.baseUrl,
    modelId: readOptionalTrimmedEnv(`${prefix}_OPENAI_MODEL`) ?? legacyBinding.modelId,
    provider: 'openai-compatible',
    providerId: legacyBinding.providerId,
    providerLabel: legacyBinding.providerLabel,
  }
}

function readModelBindings(modelProvider: ModelProvider, openAiModel?: string, openAiApiKey?: string): ModelBindings {
  const legacyBindings = createModelBindingsFromLegacyConfig({
    modelProvider: modelProvider === 'openai-compatible' ? 'openai' : modelProvider,
    openAiApiKey,
    openAiModel,
  })

  if (modelProvider !== 'openai-compatible') {
    return { ...DEFAULT_MODEL_BINDINGS }
  }

  return MODEL_BINDING_ROLES.reduce<ModelBindings>((result, role) => {
    result[role] = readRoleModelBinding(role, legacyBindings[role])
    return result
  }, { ...legacyBindings })
}

function parseProviderProfile(value: unknown): ApiRuntimeOpenAiCompatibleProviderProfile {
  if (!value || typeof value !== 'object') {
    throw new Error('NARRATIVE_MODEL_SETTINGS_JSON providers must be objects.')
  }

  const candidate = value as Partial<ApiRuntimeOpenAiCompatibleProviderProfile>
  const id = candidate.id?.trim()
  const label = candidate.label?.trim()
  const baseUrl = candidate.baseUrl?.trim()
  if (!id || !label || !baseUrl) {
    throw new Error('NARRATIVE_MODEL_SETTINGS_JSON providers require id, label, and baseUrl.')
  }

  return {
    ...(candidate.apiKey?.trim() ? { apiKey: candidate.apiKey.trim() } : {}),
    baseUrl,
    id,
    label,
  }
}

function parseModelBindingInput(value: unknown): ModelBindingInput {
  if (!value || typeof value !== 'object') {
    return { provider: 'fixture' }
  }

  const candidate = value as Partial<ModelBindingInput>
  if (candidate.provider === 'fixture') {
    return { provider: 'fixture' }
  }

  if (candidate.provider === 'openai-compatible') {
    const providerId = candidate.providerId?.trim()
    const modelId = candidate.modelId?.trim()
    if (!providerId || !modelId) {
      throw new Error('NARRATIVE_MODEL_SETTINGS_JSON openai-compatible bindings require providerId and modelId.')
    }

    return {
      modelId,
      provider: 'openai-compatible',
      providerId,
    }
  }

  throw new Error('NARRATIVE_MODEL_SETTINGS_JSON bindings must use fixture or openai-compatible providers.')
}

function readModelSettingsFromJson(): ModelBindings | undefined {
  const raw = readOptionalTrimmedEnv('NARRATIVE_MODEL_SETTINGS_JSON')
  if (!raw) {
    return undefined
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('NARRATIVE_MODEL_SETTINGS_JSON must be valid JSON.')
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('NARRATIVE_MODEL_SETTINGS_JSON must be a JSON object.')
  }

  const candidate = parsed as Partial<ApiRuntimeModelSettingsPayload>
  if (!Array.isArray(candidate.providers)) {
    throw new Error('NARRATIVE_MODEL_SETTINGS_JSON providers must be an array.')
  }

  const providers = candidate.providers.map(parseProviderProfile)
  const bindingsSource = candidate.bindings
  if (!bindingsSource || typeof bindingsSource !== 'object') {
    throw new Error('NARRATIVE_MODEL_SETTINGS_JSON bindings must be an object.')
  }

  const bindings = MODEL_BINDING_ROLES.reduce<Record<ModelBindingRole, ModelBindingInput>>((result, role) => {
    result[role] = parseModelBindingInput((bindingsSource as Partial<Record<ModelBindingRole, unknown>>)[role])
    return result
  }, {
    continuityReviewer: { provider: 'fixture' },
    planner: { provider: 'fixture' },
    sceneProseWriter: { provider: 'fixture' },
    sceneRevision: { provider: 'fixture' },
    summary: { provider: 'fixture' },
  })

  return resolveModelBindingsFromRuntimeSettings({
    bindings,
    providers,
  })
}

function deriveModelProvider(modelBindings: ModelBindings): ModelProvider {
  return MODEL_BINDING_ROLES.some((role) => modelBindings[role].provider === 'openai-compatible')
    ? 'openai-compatible'
    : 'fixture'
}

export function getApiServerConfig(): ApiServerConfig {
  const host = process.env.HOST ?? '127.0.0.1'
  const port = readPort('PORT', 4174)
  const apiBasePath = process.env.API_BASE_PATH ?? '/api'
  const apiBaseUrl = process.env.API_BASE_URL ?? `http://${host}:${port}${apiBasePath}`
  const corsOrigin = process.env.CORS_ORIGIN === undefined || process.env.CORS_ORIGIN === 'true'
    ? true
    : process.env.CORS_ORIGIN
  const currentProject = readCurrentProject()
  const defaultModelProvider: LegacyEnvModelProvider = currentProject?.projectMode === 'real-project' ? 'openai' : 'fixture'
  const projectStoreFilePath = process.env.NARRATIVE_PROJECT_STORE_FILE
    ?? process.env.NARRATIVE_PROJECT_STATE_FILE
    ?? resolveDefaultProjectStoreFilePath()
  const projectArtifactDirPath = process.env.NARRATIVE_PROJECT_ARTIFACT_DIR
    ?? path.join(path.dirname(projectStoreFilePath), 'artifacts')

  const modelBindingsFromJson = readModelSettingsFromJson()
  if (modelBindingsFromJson) {
    return {
      apiBasePath,
      apiBaseUrl,
      corsOrigin,
      currentProject,
      host,
      modelBindings: modelBindingsFromJson,
      modelProvider: deriveModelProvider(modelBindingsFromJson),
      port,
      projectArtifactDirPath,
      projectStoreFilePath,
    }
  }

  const requestedModelProvider = normalizeModelProvider(readModelProvider('NARRATIVE_MODEL_PROVIDER', defaultModelProvider))
  const modelProvider =
    currentProject?.projectMode === 'real-project' && requestedModelProvider === 'fixture'
      ? 'openai-compatible'
      : requestedModelProvider
  const openAiModel = modelProvider === 'openai-compatible'
    ? readOptionalTrimmedEnv('NARRATIVE_OPENAI_MODEL')
    : undefined
  const openAiApiKey = modelProvider === 'openai-compatible'
    ? readOptionalTrimmedEnv('OPENAI_API_KEY')
    : undefined
  const modelBindings = readModelBindings(modelProvider, openAiModel, openAiApiKey)

  return {
    host,
    port,
    apiBasePath,
    apiBaseUrl,
    corsOrigin,
    currentProject,
    projectStoreFilePath,
    projectArtifactDirPath,
    modelProvider,
    openAiModel,
    openAiApiKey,
    modelBindings,
  }
}
