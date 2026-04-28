export type ModelBindingRole =
  | 'planner'
  | 'sceneProseWriter'
  | 'sceneRevision'
  | 'continuityReviewer'
  | 'summary'

export type ModelBindingProvider = 'fixture' | 'openai'

export interface ResolvedModelBinding {
  provider: ModelBindingProvider
  modelId?: string
  apiKey?: string
}

export type ModelBindings = Record<ModelBindingRole, ResolvedModelBinding>

export interface LegacyModelConfig {
  modelProvider?: ModelBindingProvider
  openAiModel?: string
  openAiApiKey?: string
  modelBindings?: Partial<Record<ModelBindingRole, ResolvedModelBinding>>
}

export const MODEL_BINDING_ROLES: ModelBindingRole[] = [
  'planner',
  'sceneProseWriter',
  'sceneRevision',
  'continuityReviewer',
  'summary',
]

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

function normalizeResolvedModelBinding(binding: ResolvedModelBinding): ResolvedModelBinding {
  if (binding.provider !== 'openai') {
    return {
      provider: 'fixture',
    }
  }

  return {
    apiKey: normalizeOptionalString(binding.apiKey),
    modelId: normalizeOptionalString(binding.modelId),
    provider: 'openai',
  }
}

function redactSecret(secret: string): string {
  if (secret.length <= 7) {
    return `${secret.slice(0, Math.min(3, secret.length))}...`
  }

  return `${secret.slice(0, 3)}...${secret.slice(-4)}`
}

export function createModelBindingsFromLegacyConfig(config: Pick<LegacyModelConfig, 'modelProvider' | 'openAiModel' | 'openAiApiKey'>): ModelBindings {
  if (config.modelProvider !== 'openai') {
    return { ...DEFAULT_MODEL_BINDINGS }
  }

  const openAiBinding = normalizeResolvedModelBinding({
    apiKey: config.openAiApiKey,
    modelId: config.openAiModel,
    provider: 'openai',
  })

  return MODEL_BINDING_ROLES.reduce<ModelBindings>((result, role) => {
    result[role] = { ...openAiBinding }
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
    if (!binding || binding.provider !== 'openai') {
      result[role] = {
        provider: 'fixture',
      }
      return result
    }

    const apiKey = normalizeOptionalString(binding.apiKey)
    result[role] = {
      credentialStatus: {
        configured: Boolean(apiKey),
        ...(apiKey ? { redactedValue: redactSecret(apiKey) } : {}),
      },
      ...(binding.modelId ? { modelId: binding.modelId } : {}),
      provider: 'openai',
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
