import { describe, expect, it, vi } from 'vitest'

import { DEFAULT_MODEL_BINDINGS } from './model-binding.js'
import {
  ModelGatewayBindingNotAllowedError,
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
        fallbackUsed: false,
        provider: 'fixture',
        modelId: 'fixture-scene-planner',
        projectMode: 'demo-fixture',
      },
    })
  })

  it('rejects real-project fixture planner bindings before generation starts', async () => {
    const gateway = createScenePlannerGateway({
      currentProject: {
        projectId: 'local-project-alpha',
        projectMode: 'real-project',
        projectRoot: '/tmp/local-project-alpha',
        projectTitle: 'Local Project Alpha',
      },
      modelProvider: 'fixture',
    })

    await expect(gateway.generate(createRequest())).rejects.toEqual(new ModelGatewayBindingNotAllowedError({
      projectMode: 'real-project',
      role: 'planner',
    }))
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
      projectMode: 'demo-fixture',
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
        fallbackUsed: false,
        provider: 'openai-compatible',
        providerId: 'deepseek',
        providerLabel: 'DeepSeek',
        modelId: 'deepseek-chat',
        projectMode: 'demo-fixture',
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
      fallbackUsed: false,
      modelId: 'deepseek-chat',
      provider: 'openai-compatible',
      providerId: 'deepseek',
      providerLabel: 'DeepSeek',
      projectMode: 'demo-fixture',
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
      fallbackUsed: false,
      provider: 'openai-compatible',
      projectMode: 'demo-fixture',
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
      fallbackUsed: false,
      modelId: 'deepseek-chat',
      provider: 'openai-compatible',
      projectMode: 'demo-fixture',
      role: 'planner',
    })
  })
})
