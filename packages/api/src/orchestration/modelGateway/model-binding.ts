export type ModelBindingRole =
  | 'planner'
  | 'sceneProseWriter'
  | 'sceneRevision'
  | 'continuityReviewer'
  | 'summary'

export type ModelBindingProvider = 'fixture' | 'openai-compatible'

export interface OpenAiCompatibleProviderProfile {
  id: string
  label: string
  baseUrl: string
}

export interface ApiRuntimeOpenAiCompatibleProviderProfile extends OpenAiCompatibleProviderProfile {
  apiKey?: string
}

export type ModelBindingInput =
  | {
      provider: 'fixture'
    }
  | {
      provider: 'openai-compatible'
      providerId: string
      modelId: string
    }
  | {
      provider: 'openai'
      modelId?: string
      apiKey?: string
    }

export interface ApiRuntimeModelSettingsPayload {
  providers: ApiRuntimeOpenAiCompatibleProviderProfile[]
  bindings: Record<ModelBindingRole, ModelBindingInput>
}

export type ResolvedModelBinding =
  | {
      provider: 'fixture'
    }
  | {
      provider: 'openai-compatible'
      providerId: string
      providerLabel: string
      baseUrl: string
      apiKey?: string
      modelId?: string
    }

export type ModelBindings = Record<ModelBindingRole, ResolvedModelBinding>

export interface LegacyModelConfig {
  modelProvider?: ModelBindingProvider | 'openai'
  openAiModel?: string
  openAiApiKey?: string
  modelBindings?: Partial<Record<ModelBindingRole, ResolvedModelBinding | ModelBindingInput>>
}

export const MODEL_BINDING_ROLES: ModelBindingRole[] = [
  'planner',
  'sceneProseWriter',
  'sceneRevision',
  'continuityReviewer',
  'summary',
]

export const DEFAULT_OPENAI_COMPATIBLE_PROVIDER_PROFILE: OpenAiCompatibleProviderProfile = {
  baseUrl: 'https://api.openai.com/v1',
  id: 'openai-default',
  label: 'OpenAI',
}

export const DEFAULT_MODEL_BINDINGS: ModelBindings = {
  continuityReviewer: {
    provider: 'fixture',
  },
  planner: {
    provider: 'fixture',
  },
  sceneProseWriter: {
    provider: 'fixture',
  },
  sceneRevision: {
    provider: 'fixture',
  },
  summary: {
    provider: 'fixture',
  },
}

function normalizeOptionalString(value?: string): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function redactSecret(secret: string): string {
  if (secret.length <= 7) {
    return `${secret.slice(0, Math.min(3, secret.length))}...`
  }

  return `${secret.slice(0, 3)}...${secret.slice(-4)}`
}

function createResolvedOpenAiCompatibleBinding({
  apiKey,
  baseUrl = DEFAULT_OPENAI_COMPATIBLE_PROVIDER_PROFILE.baseUrl,
  modelId,
  providerId = DEFAULT_OPENAI_COMPATIBLE_PROVIDER_PROFILE.id,
  providerLabel = DEFAULT_OPENAI_COMPATIBLE_PROVIDER_PROFILE.label,
}: {
  providerId?: string
  providerLabel?: string
  baseUrl?: string
  apiKey?: string
  modelId?: string
}): ResolvedModelBinding {
  return {
    ...(normalizeOptionalString(apiKey) ? { apiKey: normalizeOptionalString(apiKey) } : {}),
    baseUrl: normalizeOptionalString(baseUrl) ?? DEFAULT_OPENAI_COMPATIBLE_PROVIDER_PROFILE.baseUrl,
    ...(normalizeOptionalString(modelId) ? { modelId: normalizeOptionalString(modelId) } : {}),
    provider: 'openai-compatible',
    providerId: normalizeOptionalString(providerId) ?? DEFAULT_OPENAI_COMPATIBLE_PROVIDER_PROFILE.id,
    providerLabel: normalizeOptionalString(providerLabel) ?? DEFAULT_OPENAI_COMPATIBLE_PROVIDER_PROFILE.label,
  }
}

function normalizeResolvedModelBinding(binding: ResolvedModelBinding | ModelBindingInput): ResolvedModelBinding {
  if (binding.provider === 'fixture') {
    return {
      provider: 'fixture',
    }
  }

  if (binding.provider === 'openai') {
    return createResolvedOpenAiCompatibleBinding({
      apiKey: binding.apiKey,
      modelId: binding.modelId,
    })
  }

  if ('providerLabel' in binding && 'baseUrl' in binding) {
    return createResolvedOpenAiCompatibleBinding({
      apiKey: binding.apiKey,
      baseUrl: binding.baseUrl,
      modelId: binding.modelId,
      providerId: binding.providerId,
      providerLabel: binding.providerLabel,
    })
  }

  return createResolvedOpenAiCompatibleBinding({
    modelId: binding.modelId,
    providerId: binding.providerId,
  })
}

export function createModelBindingsFromLegacyConfig(config: Pick<LegacyModelConfig, 'modelProvider' | 'openAiModel' | 'openAiApiKey'>): ModelBindings {
  if (config.modelProvider !== 'openai' && config.modelProvider !== 'openai-compatible') {
    return { ...DEFAULT_MODEL_BINDINGS }
  }

  const openAiBinding = createResolvedOpenAiCompatibleBinding({
    apiKey: config.openAiApiKey,
    modelId: config.openAiModel,
  })

  return MODEL_BINDING_ROLES.reduce<ModelBindings>((result, role) => {
    result[role] = { ...openAiBinding }
    return result
  }, { ...DEFAULT_MODEL_BINDINGS })
}

export function resolveModelBindingsFromRuntimeSettings(settings: ApiRuntimeModelSettingsPayload): ModelBindings {
  const providerMap = new Map(
    settings.providers.map((provider) => [provider.id, provider] as const),
  )

  return MODEL_BINDING_ROLES.reduce<ModelBindings>((result, role) => {
    const binding = settings.bindings[role]
    if (!binding || binding.provider === 'fixture') {
      result[role] = { provider: 'fixture' }
      return result
    }

    if (binding.provider === 'openai') {
      result[role] = createResolvedOpenAiCompatibleBinding({
        apiKey: binding.apiKey,
        modelId: binding.modelId,
      })
      return result
    }

    const providerId = normalizeOptionalString(binding.providerId)
    if (!providerId) {
      throw new Error(`Model binding for ${role} is missing providerId.`)
    }

    const provider = providerMap.get(providerId)
    if (!provider) {
      throw new Error(`Model binding for ${role} references unknown provider ${providerId}.`)
    }

    result[role] = createResolvedOpenAiCompatibleBinding({
      apiKey: provider.apiKey,
      baseUrl: provider.baseUrl,
      modelId: binding.modelId,
      providerId: provider.id,
      providerLabel: provider.label,
    })
    return result
  }, { ...DEFAULT_MODEL_BINDINGS })
}

export function resolveModelBindingForRole(config: LegacyModelConfig, role: ModelBindingRole): ResolvedModelBinding {
  const roleBinding = config.modelBindings?.[role]
  if (roleBinding) {
    return normalizeResolvedModelBinding(roleBinding)
  }

  return createModelBindingsFromLegacyConfig(config)[role]
}

export function serializeModelBindings(bindings: Partial<Record<ModelBindingRole, ResolvedModelBinding>>) {
  return MODEL_BINDING_ROLES.reduce<Record<ModelBindingRole, unknown>>((result, role) => {
    const binding = bindings[role]
    if (!binding || binding.provider !== 'openai-compatible') {
      result[role] = {
        provider: 'fixture',
      }
      return result
    }

    const apiKey = normalizeOptionalString(binding.apiKey)
    result[role] = {
      baseUrl: binding.baseUrl,
      credentialStatus: {
        configured: Boolean(apiKey),
        ...(apiKey ? { redactedValue: redactSecret(apiKey) } : {}),
      },
      ...(binding.modelId ? { modelId: binding.modelId } : {}),
      provider: 'openai-compatible',
      providerId: binding.providerId,
      providerLabel: binding.providerLabel,
    }
    return result
  }, {
    continuityReviewer: {
      provider: 'fixture',
    },
    planner: {
      provider: 'fixture',
    },
    sceneProseWriter: {
      provider: 'fixture',
    },
    sceneRevision: {
      provider: 'fixture',
    },
    summary: {
      provider: 'fixture',
    },
  })
}
