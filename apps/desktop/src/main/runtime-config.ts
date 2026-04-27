import fs from 'node:fs'
import path from 'node:path'

export type DesktopLocalRuntimeMode = 'desktop-local'

export interface DesktopRuntimeConfig {
  runtimeMode: DesktopLocalRuntimeMode
  apiBaseUrl: string
  apiHealthUrl: string
  port: number
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
}

export function createDesktopRuntimeConfig(
  port: number,
  { host = '127.0.0.1', apiBasePath = '/api' }: CreateDesktopRuntimeConfigOptions = {},
): DesktopRuntimeConfig {
  const normalizedBasePath = apiBasePath.startsWith('/') ? apiBasePath : `/${apiBasePath}`
  const apiBaseUrl = `http://${host}:${port}${normalizedBasePath}`

  return {
    apiBaseUrl,
    apiHealthUrl: `${apiBaseUrl}/health`,
    port,
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
  port,
  workspaceRoot = resolveWorkspaceRoot(),
  env = process.env,
}: {
  port: number
  workspaceRoot?: string
  env?: NodeJS.ProcessEnv
}): LocalApiProcessConfig {
  const apiPackageRoot = path.resolve(workspaceRoot, 'packages/api')
  const projectStateFilePath = path.resolve(workspaceRoot, '.narrative', 'prototype-state.json')
  const tsxExecutable = path.resolve(apiPackageRoot, 'node_modules/.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx')

  return {
    args: ['src/server.ts'],
    command: tsxExecutable,
    cwd: apiPackageRoot,
    env: {
      ...env,
      HOST: '127.0.0.1',
      NARRATIVE_PROJECT_STATE_FILE: projectStateFilePath,
      NARRATIVE_RUNTIME: 'desktop-local',
      PORT: String(port),
    },
  }
}
