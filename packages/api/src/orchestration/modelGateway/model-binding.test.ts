import { describe, expect, it } from 'vitest'

import {
  DEFAULT_MODEL_BINDINGS,
  createModelBindingsFromLegacyConfig,
  resolveModelBindingForRole,
  serializeModelBindings,
} from './model-binding.js'

describe('model bindings', () => {
  it('defaults every known gateway role to fixture bindings', () => {
    expect(DEFAULT_MODEL_BINDINGS).toEqual({
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
  })

  it('creates openai legacy fallback bindings for all supported roles when a global openai config is present', () => {
    expect(createModelBindingsFromLegacyConfig({
      modelProvider: 'openai',
      openAiApiKey: 'sk-secret-value',
      openAiModel: 'gpt-5.4',
    })).toEqual({
      continuityReviewer: {
        apiKey: 'sk-secret-value',
        modelId: 'gpt-5.4',
        provider: 'openai',
      },
      planner: {
        apiKey: 'sk-secret-value',
        modelId: 'gpt-5.4',
        provider: 'openai',
      },
      sceneProseWriter: {
        apiKey: 'sk-secret-value',
        modelId: 'gpt-5.4',
        provider: 'openai',
      },
      sceneRevision: {
        apiKey: 'sk-secret-value',
        modelId: 'gpt-5.4',
        provider: 'openai',
      },
      summary: {
        apiKey: 'sk-secret-value',
        modelId: 'gpt-5.4',
        provider: 'openai',
      },
    })
  })

  it('serializes configured bindings with redacted credential status only', () => {
    const serialized = serializeModelBindings({
      ...DEFAULT_MODEL_BINDINGS,
      planner: {
        apiKey: 'sk-secret-value',
        modelId: 'gpt-5.4',
        provider: 'openai',
      },
    })

    expect(serialized.planner).toEqual({
      credentialStatus: {
        configured: true,
        redactedValue: 'sk-...alue',
      },
      modelId: 'gpt-5.4',
      provider: 'openai',
    })
    expect(JSON.stringify(serialized)).not.toContain('sk-secret-value')
  })

  it('resolves role-specific bindings ahead of the legacy global openai fallback', () => {
    expect(resolveModelBindingForRole({
      modelBindings: {
        ...createModelBindingsFromLegacyConfig({
          modelProvider: 'openai',
          openAiApiKey: 'sk-global-value',
          openAiModel: 'gpt-5.4',
        }),
        sceneRevision: {
          apiKey: 'sk-revision-value',
          modelId: 'gpt-5.4-mini',
          provider: 'openai',
        },
      },
      modelProvider: 'openai',
      openAiApiKey: 'sk-global-value',
      openAiModel: 'gpt-5.4',
    }, 'sceneRevision')).toEqual({
      apiKey: 'sk-revision-value',
      modelId: 'gpt-5.4-mini',
      provider: 'openai',
    })
  })
})
