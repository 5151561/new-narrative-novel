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

  it('creates an openai-compatible legacy fallback for all supported roles when a global openai config is present', () => {
    expect(createModelBindingsFromLegacyConfig({
      modelProvider: 'openai',
      openAiApiKey: 'sk-secret-value',
      openAiModel: 'gpt-5.4',
    })).toEqual({
      continuityReviewer: {
        apiKey: 'sk-secret-value',
        baseUrl: 'https://api.openai.com/v1',
        modelId: 'gpt-5.4',
        provider: 'openai-compatible',
        providerId: 'openai-default',
        providerLabel: 'OpenAI',
      },
      planner: {
        apiKey: 'sk-secret-value',
        baseUrl: 'https://api.openai.com/v1',
        modelId: 'gpt-5.4',
        provider: 'openai-compatible',
        providerId: 'openai-default',
        providerLabel: 'OpenAI',
      },
      sceneProseWriter: {
        apiKey: 'sk-secret-value',
        baseUrl: 'https://api.openai.com/v1',
        modelId: 'gpt-5.4',
        provider: 'openai-compatible',
        providerId: 'openai-default',
        providerLabel: 'OpenAI',
      },
      sceneRevision: {
        apiKey: 'sk-secret-value',
        baseUrl: 'https://api.openai.com/v1',
        modelId: 'gpt-5.4',
        provider: 'openai-compatible',
        providerId: 'openai-default',
        providerLabel: 'OpenAI',
      },
      summary: {
        apiKey: 'sk-secret-value',
        baseUrl: 'https://api.openai.com/v1',
        modelId: 'gpt-5.4',
        provider: 'openai-compatible',
        providerId: 'openai-default',
        providerLabel: 'OpenAI',
      },
    })
  })

  it('serializes configured bindings with provider metadata and redacted credential status only', () => {
    const serialized = serializeModelBindings({
      ...DEFAULT_MODEL_BINDINGS,
      planner: {
        apiKey: 'sk-secret-value',
        baseUrl: 'https://api.deepseek.com/v1',
        modelId: 'deepseek-chat',
        provider: 'openai-compatible',
        providerId: 'deepseek',
        providerLabel: 'DeepSeek',
      },
    })

    expect(serialized.planner).toEqual({
      baseUrl: 'https://api.deepseek.com/v1',
      credentialStatus: {
        configured: true,
        redactedValue: 'sk-...alue',
      },
      modelId: 'deepseek-chat',
      provider: 'openai-compatible',
      providerId: 'deepseek',
      providerLabel: 'DeepSeek',
    })
    expect(JSON.stringify(serialized)).not.toContain('sk-secret-value')
  })

  it('resolves normalized role-specific bindings ahead of the legacy global fallback', () => {
    expect(resolveModelBindingForRole({
      modelBindings: {
        ...createModelBindingsFromLegacyConfig({
          modelProvider: 'openai',
          openAiApiKey: 'sk-global-value',
          openAiModel: 'gpt-5.4',
        }),
        sceneRevision: {
          apiKey: 'sk-revision-value',
          baseUrl: 'https://api.deepseek.com/v1',
          modelId: 'deepseek-reasoner',
          provider: 'openai-compatible',
          providerId: 'deepseek',
          providerLabel: 'DeepSeek',
        },
      },
      modelProvider: 'openai',
      openAiApiKey: 'sk-global-value',
      openAiModel: 'gpt-5.4',
    }, 'sceneRevision')).toEqual({
      apiKey: 'sk-revision-value',
      baseUrl: 'https://api.deepseek.com/v1',
      modelId: 'deepseek-reasoner',
      provider: 'openai-compatible',
      providerId: 'deepseek',
      providerLabel: 'DeepSeek',
    })
  })
})
