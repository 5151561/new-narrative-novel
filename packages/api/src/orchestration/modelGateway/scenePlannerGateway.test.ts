import { describe, expect, it, vi } from 'vitest'

import { createScenePlannerFixtureProvider } from './scenePlannerFixtureProvider.js'
import {
  ModelGatewayExecutionError,
  ModelGatewayMissingConfigError,
} from './modelGatewayErrors.js'
import { createScenePlannerGateway } from './scenePlannerGateway.js'
import { DEFAULT_MODEL_BINDINGS } from './model-binding.js'

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
      output: {
        proposals: [
          {
            title: 'Anchor the arrival beat',
            summary: 'Open on Midnight Platform before introducing any new reveal.',
            changeKind: 'action',
            riskLabel: 'Low continuity risk',
            variants: [
              {
                label: 'Arrival-first',
                summary: "Keep Midnight Platform grounded in the lead character's arrival before escalating the reveal.",
                rationale: 'Preserves continuity while still giving the scene a clear forward beat.',
                tradeoffLabel: 'Slower escalation',
                riskLabel: 'Low continuity risk',
              },
              {
                label: 'Reveal pressure',
                summary: 'Let the reveal intrude earlier while Midnight Platform is still settling.',
                rationale: 'Creates a sharper hook, but asks review to accept a faster continuity turn.',
                tradeoffLabel: 'Sharper hook',
                riskLabel: 'Higher continuity risk',
              },
            ],
          },
          {
            title: 'Stage the reveal through the setting',
            summary: 'Let the Midnight Platform setting carry the reveal instead of adding raw exposition.',
            changeKind: 'reveal',
            riskLabel: 'Editor check recommended',
          },
        ],
      },
      provenance: {
        provider: 'fixture',
        modelId: 'fixture-scene-planner',
      },
    })
  })

  it('rejects with missing-config when provider=openai but model config is incomplete', async () => {
    const openAiProviderFactory = vi.fn()

    const gateway = createScenePlannerGateway(
      {
        modelProvider: 'openai',
        openAiApiKey: 'sk-test',
      },
      {
        fixtureProvider: createScenePlannerFixtureProvider(),
        openAiProviderFactory,
      },
    )

    await expect(gateway.generate(createRequest())).rejects.toEqual(new ModelGatewayMissingConfigError({
      provider: 'openai',
      role: 'planner',
    }))
    expect(openAiProviderFactory).not.toHaveBeenCalled()
  })

  it('uses the openai provider when config is complete and the structured output is valid', async () => {
    const openAiProvider = {
      generate: vi.fn().mockResolvedValue({
        proposals: [
          {
            title: 'Tighten the bargain turn',
            summary: 'Escalate the witness pressure before the ledger opens.',
            changeKind: 'action',
            riskLabel: 'Editor check recommended',
            variants: undefined,
          },
        ],
      }),
    }

    const gateway = createScenePlannerGateway(
      {
        modelProvider: 'openai',
        openAiModel: 'gpt-5.4',
        openAiApiKey: 'sk-test',
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
        provider: 'openai',
        modelId: 'gpt-5.4',
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
            variants: undefined,
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
            modelId: 'gpt-5.4-mini',
            provider: 'openai',
          },
        },
        modelProvider: 'openai',
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
      modelId: 'gpt-5.4-mini',
    })
    expect(result.provenance).toEqual({
      modelId: 'gpt-5.4-mini',
      provider: 'openai',
    })
  })

  it('rejects with provider_error when the openai provider throws', async () => {
    const gateway = createScenePlannerGateway(
      {
        modelProvider: 'openai',
        openAiModel: 'gpt-5.4',
        openAiApiKey: 'sk-test',
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
      modelId: 'gpt-5.4',
      provider: 'openai',
      role: 'planner',
    })
  })

  it('rejects with invalid_output when the openai provider returns data outside the planner schema', async () => {
    const gateway = createScenePlannerGateway(
      {
        modelProvider: 'openai',
        openAiModel: 'gpt-5.4',
        openAiApiKey: 'sk-test',
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
      modelId: 'gpt-5.4',
      provider: 'openai',
      role: 'planner',
    })
  })
})
