import { describe, expect, it, vi } from 'vitest'

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

  it('falls back to fixture with missing-config when provider=openai but model config is incomplete', async () => {
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

    const result = await gateway.generate(createRequest())

    expect(openAiProviderFactory).not.toHaveBeenCalled()
    expect(result.provenance).toEqual({
      provider: 'fixture',
      modelId: 'fixture-scene-planner',
      fallbackReason: 'missing-config',
    })
    expect(result.output.proposals).toHaveLength(2)
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

  it('falls back to fixture with provider-error when the openai provider throws', async () => {
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

    const result = await gateway.generate(createRequest())

    expect(result.provenance).toEqual({
      provider: 'fixture',
      modelId: 'fixture-scene-planner',
      fallbackReason: 'provider-error',
    })
    expect(result.output.proposals[0]?.title).toBe('Anchor the arrival beat')
  })

  it('falls back to fixture with invalid-output when the openai provider returns data outside the planner schema', async () => {
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

    const result = await gateway.generate(createRequest())

    expect(result).toEqual({
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
        fallbackReason: 'invalid-output',
      },
    })
  })
})
