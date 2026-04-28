import path from 'node:path'

import { resolveDefaultProjectStoreFilePath } from './repositories/project-state-persistence.js'
import {
  createModelBindingsFromLegacyConfig,
  MODEL_BINDING_ROLES,
  type ModelBindings,
  type ModelBindingRole,
  type ResolvedModelBinding,
} from './orchestration/modelGateway/model-binding.js'

export type ModelProvider = 'fixture' | 'openai'

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

function readModelProvider(name = 'NARRATIVE_MODEL_PROVIDER', fallback?: ModelProvider): ModelProvider {
  const value = process.env[name]
  if (value === undefined) {
    return fallback ?? 'fixture'
  }

  if (value === 'fixture' || value === 'openai') {
    return value
  }

  throw new Error(`${name} must be one of: fixture, openai`)
}

function readOptionalTrimmedEnv(name: string) {
  const value = process.env[name]?.trim()
  return value ? value : undefined
}

function readCurrentProject() {
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

  return {
    projectId,
    projectMode: projectMode ?? 'real-project',
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
  const provider = readModelProvider(`${prefix}_MODEL_PROVIDER`, legacyBinding.provider)

  if (provider !== 'openai') {
    return {
      provider: 'fixture',
    }
  }

  return {
    apiKey: readOptionalTrimmedEnv(`${prefix}_OPENAI_API_KEY`) ?? legacyBinding.apiKey,
    modelId: readOptionalTrimmedEnv(`${prefix}_OPENAI_MODEL`) ?? legacyBinding.modelId,
    provider: 'openai',
  }
}

function readModelBindings(modelProvider: ModelProvider, openAiModel?: string, openAiApiKey?: string): ModelBindings {
  const legacyBindings = createModelBindingsFromLegacyConfig({
    modelProvider,
    openAiApiKey,
    openAiModel,
  })

  return MODEL_BINDING_ROLES.reduce<ModelBindings>((result, role) => {
    result[role] = readRoleModelBinding(role, legacyBindings[role])
    return result
  }, { ...legacyBindings })
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
  const defaultModelProvider = currentProject?.projectMode === 'real-project' ? 'openai' : 'fixture'
  const projectStoreFilePath = process.env.NARRATIVE_PROJECT_STORE_FILE
    ?? process.env.NARRATIVE_PROJECT_STATE_FILE
    ?? resolveDefaultProjectStoreFilePath()
  const projectArtifactDirPath = process.env.NARRATIVE_PROJECT_ARTIFACT_DIR
    ?? path.join(path.dirname(projectStoreFilePath), 'artifacts')
  const requestedModelProvider = readModelProvider('NARRATIVE_MODEL_PROVIDER', defaultModelProvider)
  const modelProvider =
    currentProject?.projectMode === 'real-project' && requestedModelProvider === 'fixture'
      ? 'openai'
      : requestedModelProvider
  const openAiModel = modelProvider === 'openai'
    ? readOptionalTrimmedEnv('NARRATIVE_OPENAI_MODEL')
    : undefined
  const openAiApiKey = modelProvider === 'openai'
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
