import { resolveDefaultProjectStateFilePath } from './repositories/project-state-persistence.js'

export interface ApiServerConfig {
  host: string
  port: number
  apiBasePath: string
  apiBaseUrl: string
  corsOrigin: string | true
  projectStateFilePath: string
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

export function getApiServerConfig(): ApiServerConfig {
  const host = process.env.HOST ?? '127.0.0.1'
  const port = readPort('PORT', 4174)
  const apiBasePath = process.env.API_BASE_PATH ?? '/api'
  const apiBaseUrl = process.env.API_BASE_URL ?? `http://${host}:${port}${apiBasePath}`
  const corsOrigin = process.env.CORS_ORIGIN === undefined || process.env.CORS_ORIGIN === 'true'
    ? true
    : process.env.CORS_ORIGIN
  const projectStateFilePath = process.env.NARRATIVE_PROJECT_STATE_FILE ?? resolveDefaultProjectStateFilePath()

  return {
    host,
    port,
    apiBasePath,
    apiBaseUrl,
    corsOrigin,
    projectStateFilePath,
  }
}
