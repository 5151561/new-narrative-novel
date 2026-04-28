import { describe, expect, it, vi } from 'vitest'

import { DEFAULT_MODEL_BINDINGS } from './model-binding.js'
import {
  ModelGatewayExecutionError,
  ModelGatewayMissingConfigError,
} from './modelGatewayErrors.js'
import { createScenePlannerFixtureProvider } from './scenePlannerFixtureProvider.js'
import { createScenePlannerGateway } from './scenePlannerGateway.js'

function createRequest(overrides?: Partial<{
  sceneId: string
  instructions: string
  input: string
}>) {
  return {
    sceneId: 'scene-midnight-platform',
    instructions: 'Return scene-planning proposals only.',
    input: 'Context packet for Midnight Platform.',
    ...overrides,
  }
}

describe('createScenePlannerGateway', () => {
  it('returns deterministic fixture output and compact provenance when provider=fixture', async () => {
    const gateway = createScenePlannerGateway(
      {
        modelProvider: 'fixture',
      },
      {
        fixtureProvider: createScenePlannerFixtureProvider(),
      },
    )

    await expect(gateway.generate(createRequest())).resolves.toEqual({
      output: expect.objectContaining({
        proposals: expect.any(Array),
      }),
      provenance: {
        provider: 'fixture',
        modelId: 'fixture-scene-planner',
      },
    })
  })

  it('rejects with missing-config when provider=openai-compatible but model config is incomplete', async () => {
    const openAiProviderFactory = vi.fn()

    const gateway = createScenePlannerGateway(
      {
        modelBindings: {
          ...DEFAULT_MODEL_BINDINGS,
          planner: {
            baseUrl: 'https://api.deepseek.com/v1',
            provider: 'openai-compatible',
            providerId: 'deepseek',
            providerLabel: 'DeepSeek',
          },
        },
        modelProvider: 'openai-compatible',
      },
      {
        fixtureProvider: createScenePlannerFixtureProvider(),
        openAiProviderFactory,
      },
    )

    await expect(gateway.generate(createRequest())).rejects.toEqual(new ModelGatewayMissingConfigError({
      provider: 'openai-compatible',
      role: 'planner',
    }))
    expect(openAiProviderFactory).not.toHaveBeenCalled()
  })

  it('uses the configured provider when config is complete and the structured output is valid', async () => {
    const openAiProvider = {
      generate: vi.fn().mockResolvedValue({
        proposals: [
          {
            title: 'Tighten the bargain turn',
            summary: 'Escalate the witness pressure before the ledger opens.',
            changeKind: 'action',
            riskLabel: 'Editor check recommended',
          },
        ],
      }),
    }

    const gateway = createScenePlannerGateway(
      {
        modelBindings: {
          ...DEFAULT_MODEL_BINDINGS,
          planner: {
            apiKey: 'sk-test',
            baseUrl: 'https://api.deepseek.com/v1',
            modelId: 'deepseek-chat',
            provider: 'openai-compatible',
            providerId: 'deepseek',
            providerLabel: 'DeepSeek',
          },
        },
        modelProvider: 'openai-compatible',
      },
      {
        fixtureProvider: createScenePlannerFixtureProvider(),
        openAiProvider,
      },
    )

    await expect(gateway.generate(createRequest())).resolves.toEqual({
      output: {
        proposals: [
          {
            title: 'Tighten the bargain turn',
            summary: 'Escalate the witness pressure before the ledger opens.',
            changeKind: 'action',
            riskLabel: 'Editor check recommended',
          },
        ],
      },
      provenance: {
        provider: 'openai-compatible',
        providerId: 'deepseek',
        providerLabel: 'DeepSeek',
        modelId: 'deepseek-chat',
      },
    })
    expect(openAiProvider.generate).toHaveBeenCalledWith(createRequest())
  })

  it('prefers the planner role binding over the legacy global openai model fields', async () => {
    const openAiProviderFactory = vi.fn(() => ({
      generate: vi.fn().mockResolvedValue({
        proposals: [
          {
            title: 'Bind the planner role explicitly',
            summary: 'The planner should use the planner-specific model binding.',
            changeKind: 'action',
            riskLabel: 'Low continuity risk',
          },
        ],
      }),
    }))

    const gateway = createScenePlannerGateway(
      {
        modelBindings: {
          ...DEFAULT_MODEL_BINDINGS,
          planner: {
            apiKey: 'sk-planner-value',
            baseUrl: 'https://api.deepseek.com/v1',
            modelId: 'deepseek-chat',
            provider: 'openai-compatible',
            providerId: 'deepseek',
            providerLabel: 'DeepSeek',
          },
        },
        modelProvider: 'openai-compatible',
        openAiApiKey: 'sk-global-value',
        openAiModel: 'gpt-5.4',
      },
      {
        fixtureProvider: createScenePlannerFixtureProvider(),
        openAiProviderFactory,
      },
    )

    const result = await gateway.generate(createRequest())

    expect(openAiProviderFactory).toHaveBeenCalledWith({
      apiKey: 'sk-planner-value',
      baseUrl: 'https://api.deepseek.com/v1',
      modelId: 'deepseek-chat',
    })
    expect(result.provenance).toEqual({
      modelId: 'deepseek-chat',
      provider: 'openai-compatible',
      providerId: 'deepseek',
      providerLabel: 'DeepSeek',
    })
  })

  it('rejects with provider_error when the configured provider throws', async () => {
    const gateway = createScenePlannerGateway(
      {
        modelBindings: {
          ...DEFAULT_MODEL_BINDINGS,
          planner: {
            apiKey: 'sk-test',
            baseUrl: 'https://api.deepseek.com/v1',
            modelId: 'deepseek-chat',
            provider: 'openai-compatible',
            providerId: 'deepseek',
            providerLabel: 'DeepSeek',
          },
        },
        modelProvider: 'openai-compatible',
      },
      {
        fixtureProvider: createScenePlannerFixtureProvider(),
        openAiProvider: {
          generate: vi.fn().mockRejectedValue(new Error('upstream failed')),
        },
      },
    )

    await expect(gateway.generate(createRequest())).rejects.toMatchObject({
      name: ModelGatewayExecutionError.name,
      failureClass: 'provider_error',
      modelId: 'deepseek-chat',
      provider: 'openai-compatible',
      role: 'planner',
    })
  })

  it('rejects with invalid_output when the configured provider returns data outside the planner schema', async () => {
    const gateway = createScenePlannerGateway(
      {
        modelBindings: {
          ...DEFAULT_MODEL_BINDINGS,
          planner: {
            apiKey: 'sk-test',
            baseUrl: 'https://api.deepseek.com/v1',
            modelId: 'deepseek-chat',
            provider: 'openai-compatible',
            providerId: 'deepseek',
            providerLabel: 'DeepSeek',
          },
        },
        modelProvider: 'openai-compatible',
      },
      {
        fixtureProvider: createScenePlannerFixtureProvider(),
        openAiProvider: {
          generate: vi.fn().mockResolvedValue({
            rawPrompt: 'do not leak this',
          }),
        },
      },
    )

    await expect(gateway.generate(createRequest())).rejects.toMatchObject({
      name: ModelGatewayExecutionError.name,
      failureClass: 'invalid_output',
      modelId: 'deepseek-chat',
      provider: 'openai-compatible',
      role: 'planner',
    })
  })
})
