import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react'

export type DesktopModelBindingProvider = 'fixture' | 'openai'
export type DesktopModelBindingRole =
  | 'planner'
  | 'sceneProseWriter'
  | 'sceneRevision'
  | 'continuityReviewer'
  | 'summary'

export interface DesktopModelBinding {
  provider: DesktopModelBindingProvider
  modelId?: string
}

export type DesktopModelBindings = Record<DesktopModelBindingRole, DesktopModelBinding>

export interface DesktopModelConnectionTestRecord {
  status: 'never' | 'passed' | 'failed'
  errorCode?: 'missing_key' | 'invalid_key' | 'model_not_found' | 'network_error' | 'invalid_output'
  summary?: string
}

export interface ProviderCredentialStatus {
  provider: 'openai'
  configured: boolean
  redactedValue?: string
}

export interface DesktopModelSettingsSnapshot {
  bindings: DesktopModelBindings
  credentialStatus: ProviderCredentialStatus
  connectionTest: DesktopModelConnectionTestRecord
}

interface NarrativeDesktopModelSettingsBridge {
  getModelSettingsSnapshot?: () => Promise<DesktopModelSettingsSnapshot>
  saveProviderCredential?: (input: { provider: 'openai'; secret: string }) => Promise<ProviderCredentialStatus>
  deleteProviderCredential?: (provider: 'openai') => Promise<ProviderCredentialStatus>
  updateModelBinding?: (input: {
    role: DesktopModelBindingRole
    binding: DesktopModelBinding
  }) => Promise<DesktopModelBindings>
  testModelSettings?: () => Promise<DesktopModelConnectionTestRecord>
}

declare global {
  interface Window {
    narrativeDesktop?: NarrativeDesktopModelSettingsBridge
  }
}

export interface ModelSettingsController {
  supported: boolean
  open: boolean
  setOpen: (open: boolean) => void
  snapshot: DesktopModelSettingsSnapshot | null
  loading: boolean
  saving: boolean
  testing: boolean
  error: string | null
  refreshSnapshot: () => Promise<void>
  saveOpenAiCredential: (secret: string) => Promise<void>
  deleteOpenAiCredential: () => Promise<void>
  updateBinding: (role: DesktopModelBindingRole, binding: DesktopModelBinding) => Promise<void>
  testConnection: () => Promise<DesktopModelConnectionTestRecord | null>
}

const ModelSettingsContext = createContext<ModelSettingsController | null>(null)

function getDesktopBridge() {
  return typeof window === 'undefined' ? undefined : window.narrativeDesktop
}

function isModelSettingsBridgeAvailable(bridge: NarrativeDesktopModelSettingsBridge | undefined) {
  return Boolean(
    bridge?.getModelSettingsSnapshot
      && bridge.saveProviderCredential
      && bridge.deleteProviderCredential
      && bridge.updateModelBinding
      && bridge.testModelSettings,
  )
}

function createFixtureSnapshot(): DesktopModelSettingsSnapshot {
  return {
    bindings: {
      continuityReviewer: { provider: 'fixture' },
      planner: { provider: 'fixture' },
      sceneProseWriter: { provider: 'fixture' },
      sceneRevision: { provider: 'fixture' },
      summary: { provider: 'fixture' },
    },
    connectionTest: {
      status: 'never',
    },
    credentialStatus: {
      configured: false,
      provider: 'openai',
    },
  }
}

function useModelSettingsControllerState(): ModelSettingsController {
  const bridge = getDesktopBridge()
  const supported = isModelSettingsBridgeAvailable(bridge)
  const [open, setOpen] = useState(false)
  const [snapshot, setSnapshot] = useState<DesktopModelSettingsSnapshot | null>(null)
  const [loading, setLoading] = useState(supported)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refreshSnapshot() {
    if (!supported || !bridge?.getModelSettingsSnapshot) {
      setSnapshot(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      setSnapshot(await bridge.getModelSettingsSnapshot())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError))
    } finally {
      setLoading(false)
    }
  }

  async function saveOpenAiCredential(secret: string) {
    if (!supported || !bridge?.saveProviderCredential) {
      return
    }

    setSaving(true)
    setError(null)
    try {
      await bridge.saveProviderCredential({
        provider: 'openai',
        secret,
      })
      await refreshSnapshot()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError))
    } finally {
      setSaving(false)
    }
  }

  async function deleteOpenAiCredential() {
    if (!supported || !bridge?.deleteProviderCredential) {
      return
    }

    setSaving(true)
    setError(null)
    try {
      await bridge.deleteProviderCredential('openai')
      await refreshSnapshot()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : String(deleteError))
    } finally {
      setSaving(false)
    }
  }

  async function updateBinding(role: DesktopModelBindingRole, binding: DesktopModelBinding) {
    if (!supported || !bridge?.updateModelBinding) {
      return
    }

    setSaving(true)
    setError(null)
    try {
      await bridge.updateModelBinding({
        binding,
        role,
      })
      await refreshSnapshot()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : String(updateError))
    } finally {
      setSaving(false)
    }
  }

  async function testConnection() {
    if (!supported || !bridge?.testModelSettings) {
      return null
    }

    setTesting(true)
    setError(null)
    try {
      const result = await bridge.testModelSettings()
      setSnapshot((currentSnapshot) => currentSnapshot
        ? {
            ...currentSnapshot,
            connectionTest: result,
          }
        : {
            ...createFixtureSnapshot(),
            connectionTest: result,
          })
      return result
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : String(testError))
      return null
    } finally {
      setTesting(false)
    }
  }

  useEffect(() => {
    void refreshSnapshot()
  }, [supported])

  return {
    supported,
    open,
    setOpen,
    snapshot,
    loading,
    saving,
    testing,
    error,
    refreshSnapshot,
    saveOpenAiCredential,
    deleteOpenAiCredential,
    updateBinding,
    testConnection,
  }
}

export function ModelSettingsProvider({ children }: PropsWithChildren) {
  const controller = useModelSettingsControllerState()

  return <ModelSettingsContext.Provider value={controller}>{children}</ModelSettingsContext.Provider>
}

export function useOptionalModelSettingsController() {
  return useContext(ModelSettingsContext)
}

export function useDesktopModelSettingsSnapshot() {
  const controller = useOptionalModelSettingsController()
  const [fallbackSnapshot, setFallbackSnapshot] = useState<DesktopModelSettingsSnapshot | null>(null)

  useEffect(() => {
    if (controller || fallbackSnapshot) {
      return
    }

    const bridge = getDesktopBridge()
    if (!bridge?.getModelSettingsSnapshot) {
      return
    }

    let cancelled = false
    void bridge.getModelSettingsSnapshot().then((snapshot) => {
      if (!cancelled) {
        setFallbackSnapshot(snapshot)
      }
    }).catch(() => {})

    return () => {
      cancelled = true
    }
  }, [controller, fallbackSnapshot])

  return controller?.snapshot ?? fallbackSnapshot
}
