import fs from 'node:fs'
import path from 'node:path'

import type { SelectedProjectSession } from './project-picker.js'
import {
  DESKTOP_MODEL_BINDING_ROLES,
  type DesktopModelBindings,
  type DesktopModelBindingRole,
  type ProviderCredentialProvider,
} from '../shared/desktop-bridge-types.js'

export type DesktopLocalRuntimeMode = 'desktop-local'

export interface DesktopRuntimeConfig {
  runtimeMode: DesktopLocalRuntimeMode
  apiBaseUrl: string
  apiHealthUrl: string
  port: number
  projectId: string
  projectMode: 'demo-fixture' | 'real-project'
  projectTitle: string
}

export interface LocalApiProcessConfig {
  command: string
  args: string[]
  cwd: string
  env: NodeJS.ProcessEnv
}

const ROLE_ENV_PREFIXES: Record<DesktopModelBindingRole, string> = {
  continuityReviewer: 'NARRATIVE_CONTINUITY_REVIEWER',
  planner: 'NARRATIVE_PLANNER',
  sceneProseWriter: 'NARRATIVE_SCENE_PROSE_WRITER',
  sceneRevision: 'NARRATIVE_SCENE_REVISION',
  summary: 'NARRATIVE_SUMMARY',
}

export interface CreateDesktopRuntimeConfigOptions {
  host?: string
  apiBasePath?: string
  currentProject: Pick<SelectedProjectSession, 'projectId' | 'projectMode' | 'projectTitle'>
}

export function createDesktopRuntimeConfig(
  port: number,
  {
    host = '127.0.0.1',
    apiBasePath = '/api',
    currentProject,
  }: CreateDesktopRuntimeConfigOptions,
): DesktopRuntimeConfig {
  const normalizedBasePath = apiBasePath.startsWith('/') ? apiBasePath : `/${apiBasePath}`
  const apiBaseUrl = `http://${host}:${port}${normalizedBasePath}`

  return {
    apiBaseUrl,
    apiHealthUrl: `${apiBaseUrl}/health`,
    port,
    projectId: currentProject.projectId,
    projectMode: currentProject.projectMode,
    projectTitle: currentProject.projectTitle,
    runtimeMode: 'desktop-local',
  }
}

export function resolveWorkspaceRoot(startDir = process.cwd()): string {
  let currentDir = path.resolve(startDir)

  while (true) {
    if (fs.existsSync(path.join(currentDir, 'pnpm-workspace.yaml'))) {
      return currentDir
    }

    const parentDir = path.dirname(currentDir)
    if (parentDir === currentDir) {
      throw new Error(`Unable to resolve workspace root from ${startDir}`)
    }

    currentDir = parentDir
  }
}

export function createLocalApiProcessConfig({
  currentProject,
  modelBindings,
  port,
  providerCredentials,
  workspaceRoot = resolveWorkspaceRoot(),
  env = process.env,
}: {
  currentProject: SelectedProjectSession
  modelBindings?: DesktopModelBindings
  port: number
  providerCredentials?: Partial<Record<ProviderCredentialProvider, string>>
  workspaceRoot?: string
  env?: NodeJS.ProcessEnv
}): LocalApiProcessConfig {
  const apiPackageRoot = path.resolve(workspaceRoot, 'packages/api')
  const projectStoreFilePath = path.resolve(currentProject.projectRoot, '.narrative', 'project-store.json')
  const projectArtifactDirPath = path.resolve(currentProject.projectRoot, '.narrative', 'artifacts')
  const tsxExecutable = path.resolve(apiPackageRoot, 'node_modules/.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx')
  const {
    NARRATIVE_CONTINUITY_REVIEWER_MODEL_PROVIDER: _continuityProvider,
    NARRATIVE_CONTINUITY_REVIEWER_OPENAI_API_KEY: _continuityApiKey,
    NARRATIVE_CONTINUITY_REVIEWER_OPENAI_MODEL: _continuityModel,
    NARRATIVE_MODEL_PROVIDER: _legacyModelProvider,
    NARRATIVE_OPENAI_MODEL: _legacyOpenAiModel,
    NARRATIVE_PLANNER_MODEL_PROVIDER: _plannerProvider,
    NARRATIVE_PLANNER_OPENAI_API_KEY: _plannerApiKey,
    NARRATIVE_PLANNER_OPENAI_MODEL: _plannerModel,
    NARRATIVE_PROJECT_STATE_FILE: _legacyProjectStateFile,
    NARRATIVE_SCENE_PROSE_WRITER_MODEL_PROVIDER: _proseProvider,
    NARRATIVE_SCENE_PROSE_WRITER_OPENAI_API_KEY: _proseApiKey,
    NARRATIVE_SCENE_PROSE_WRITER_OPENAI_MODEL: _proseModel,
    NARRATIVE_SCENE_REVISION_MODEL_PROVIDER: _revisionProvider,
    NARRATIVE_SCENE_REVISION_OPENAI_API_KEY: _revisionApiKey,
    NARRATIVE_SCENE_REVISION_OPENAI_MODEL: _revisionModel,
    NARRATIVE_SUMMARY_MODEL_PROVIDER: _summaryProvider,
    NARRATIVE_SUMMARY_OPENAI_API_KEY: _summaryApiKey,
    NARRATIVE_SUMMARY_OPENAI_MODEL: _summaryModel,
    OPENAI_API_KEY: _legacyOpenAiApiKey,
    ...inheritedEnv
  } = env
  const bindingEnv = buildModelBindingEnv(modelBindings, providerCredentials)

  return {
    args: ['src/server.ts'],
    command: tsxExecutable,
    cwd: apiPackageRoot,
    env: {
      ...inheritedEnv,
      HOST: '127.0.0.1',
      ...bindingEnv,
      NARRATIVE_PROJECT_ARTIFACT_DIR: projectArtifactDirPath,
      NARRATIVE_PROJECT_ID: currentProject.projectId,
      NARRATIVE_PROJECT_MODE: currentProject.projectMode,
      NARRATIVE_PROJECT_ROOT: currentProject.projectRoot,
      NARRATIVE_PROJECT_STORE_FILE: projectStoreFilePath,
      NARRATIVE_PROJECT_TITLE: currentProject.projectTitle,
      NARRATIVE_RUNTIME: 'desktop-local',
      PORT: String(port),
    },
  }
}

function buildModelBindingEnv(
  modelBindings?: DesktopModelBindings,
  providerCredentials?: Partial<Record<ProviderCredentialProvider, string>>,
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    NARRATIVE_MODEL_PROVIDER: 'fixture',
  }

  for (const role of DESKTOP_MODEL_BINDING_ROLES) {
    const prefix = ROLE_ENV_PREFIXES[role]
    const binding = modelBindings?.[role]

    env[`${prefix}_MODEL_PROVIDER`] = binding?.provider ?? 'fixture'

    if (binding?.provider === 'openai' && binding.modelId) {
      env[`${prefix}_OPENAI_MODEL`] = binding.modelId
      const apiKey = providerCredentials?.openai?.trim()

      if (apiKey) {
        env[`${prefix}_OPENAI_API_KEY`] = apiKey
      }
    }
  }

  return env
}
