import fs from 'node:fs'
import path from 'node:path'

import type { SelectedProjectSession } from './project-picker.js'

export type DesktopLocalRuntimeMode = 'desktop-local'

export interface DesktopRuntimeConfig {
  runtimeMode: DesktopLocalRuntimeMode
  apiBaseUrl: string
  apiHealthUrl: string
  port: number
  projectId: string
  projectTitle: string
}

export interface LocalApiProcessConfig {
  command: string
  args: string[]
  cwd: string
  env: NodeJS.ProcessEnv
}

export interface CreateDesktopRuntimeConfigOptions {
  host?: string
  apiBasePath?: string
  currentProject: Pick<SelectedProjectSession, 'projectId' | 'projectTitle'>
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
  port,
  workspaceRoot = resolveWorkspaceRoot(),
  env = process.env,
}: {
  currentProject: SelectedProjectSession
  port: number
  workspaceRoot?: string
  env?: NodeJS.ProcessEnv
}): LocalApiProcessConfig {
  const apiPackageRoot = path.resolve(workspaceRoot, 'packages/api')
  const projectStateFilePath = path.resolve(currentProject.projectRoot, '.narrative', 'prototype-state.json')
  const tsxExecutable = path.resolve(apiPackageRoot, 'node_modules/.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx')

  return {
    args: ['src/server.ts'],
    command: tsxExecutable,
    cwd: apiPackageRoot,
    env: {
      ...env,
      HOST: '127.0.0.1',
      NARRATIVE_PROJECT_ID: currentProject.projectId,
      NARRATIVE_PROJECT_ROOT: currentProject.projectRoot,
      NARRATIVE_PROJECT_STATE_FILE: projectStateFilePath,
      NARRATIVE_PROJECT_TITLE: currentProject.projectTitle,
      NARRATIVE_RUNTIME: 'desktop-local',
      PORT: String(port),
    },
  }
}
