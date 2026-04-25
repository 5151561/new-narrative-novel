export type RuntimeMode = 'web' | 'desktop-local'

export interface RuntimeConfig {
  runtimeMode: RuntimeMode
  apiBaseUrl: string
}

export type RuntimeConfigState =
  | { status: 'pending' }
  | { status: 'ready'; runtimeConfig: RuntimeConfig }
  | { status: 'error'; error: Error }

export interface NarrativeDesktopRuntimeBridge {
  getRuntimeConfig?: () => Promise<RuntimeConfig>
}

declare global {
  interface Window {
    narrativeDesktop?: NarrativeDesktopRuntimeBridge
  }
}

const DEFAULT_WEB_API_BASE_URL = '/api'

function isRuntimeConfig(value: unknown): value is RuntimeConfig {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<RuntimeConfig>
  return (
    (candidate.runtimeMode === 'web' || candidate.runtimeMode === 'desktop-local')
    && typeof candidate.apiBaseUrl === 'string'
    && candidate.apiBaseUrl.length > 0
  )
}

export function createWebRuntimeConfig(env: Record<string, string | undefined> = import.meta.env): RuntimeConfig {
  return {
    apiBaseUrl: env.VITE_NARRATIVE_API_BASE_URL ?? DEFAULT_WEB_API_BASE_URL,
    runtimeMode: 'web',
  }
}

export async function resolveRuntimeConfig({
  desktopBridge = typeof window === 'undefined' ? undefined : window.narrativeDesktop,
  env = import.meta.env,
}: {
  desktopBridge?: NarrativeDesktopRuntimeBridge
  env?: Record<string, string | undefined>
} = {}): Promise<RuntimeConfig> {
  if (desktopBridge?.getRuntimeConfig) {
    const runtimeConfig = await desktopBridge.getRuntimeConfig()
    if (isRuntimeConfig(runtimeConfig)) {
      return runtimeConfig
    }

    throw new Error('Desktop runtime config response is invalid.')
  }

  return createWebRuntimeConfig(env)
}
