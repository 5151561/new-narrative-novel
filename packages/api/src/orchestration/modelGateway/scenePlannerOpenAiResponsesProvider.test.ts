import { describe, expect, it, vi } from 'vitest'

import { createScenePlannerOpenAiResponsesProvider } from './scenePlannerOpenAiResponsesProvider.js'
import { scenePlannerOpenAiOutputSchema } from './scenePlannerOutputSchema.js'

function createRequest() {
  return {
    sceneId: 'scene-midnight-platform',
    instructions: 'Return scene-planning proposals only.',
    input: 'Context packet for Midnight Platform.',
  }
}

describe('createScenePlannerOpenAiResponsesProvider', () => {
  it('calls the Responses API with top-level instructions, input, and an OpenAI strict-compatible text.format schema', async () => {
    const create = vi.fn().mockResolvedValue({
      output_text: JSON.stringify({
        proposals: [
          {
            title: 'Anchor the arrival beat',
            summary: 'Open on Midnight Platform before introducing any new reveal.',
            changeKind: 'action',
            riskLabel: 'Low continuity risk',
          },
        ],
      }),
    })

    const provider = createScenePlannerOpenAiResponsesProvider({
      modelId: 'gpt-5.4',
      apiKey: 'sk-test',
      client: {
        responses: {
          create,
        },
      },
    })

    await provider.generate(createRequest())

    expect(create).toHaveBeenCalledTimes(1)
    expect(create).toHaveBeenCalledWith({
      model: 'gpt-5.4',
      instructions: 'Return scene-planning proposals only.',
      input: 'Context packet for Midnight Platform.',
      text: {
        format: {
          name: 'scene_planner_output',
          type: 'json_schema',
          strict: true,
          description: 'Structured scene planner proposal candidates.',
          schema: scenePlannerOpenAiOutputSchema,
        },
      },
    })
  })

  it('normalizes nullable strict-schema output back to the planner contract without exposing raw response envelopes', async () => {
    const provider = createScenePlannerOpenAiResponsesProvider({
      modelId: 'gpt-5.4',
      apiKey: 'sk-test',
      client: {
        responses: {
          create: vi.fn().mockResolvedValue({
            id: 'resp_123',
            output_text: JSON.stringify({
              proposals: [
                {
                  title: 'Anchor the arrival beat',
                  summary: 'Open on Midnight Platform before introducing any new reveal.',
                  changeKind: 'action',
                  riskLabel: 'Low continuity risk',
                  variants: null,
                },
              ],
            }),
          }),
        },
      },
    })

    await expect(provider.generate(createRequest())).resolves.toEqual({
      proposals: [
        {
          title: 'Anchor the arrival beat',
          summary: 'Open on Midnight Platform before introducing any new reveal.',
          changeKind: 'action',
          riskLabel: 'Low continuity risk',
        },
      ],
    })
  })

  it('returns the raw output text when the provider response is not valid json so the gateway can classify invalid output', async () => {
    const provider = createScenePlannerOpenAiResponsesProvider({
      modelId: 'gpt-5.4',
      apiKey: 'sk-test',
      client: {
        responses: {
          create: vi.fn().mockResolvedValue({
            output_text: 'not-json',
          }),
        },
      },
    })

    await expect(provider.generate(createRequest())).resolves.toBe('not-json')
  })

  it('normalizes nullable variant fields back to omitted optionals for downstream parsing', async () => {
    const provider = createScenePlannerOpenAiResponsesProvider({
      modelId: 'gpt-5.4',
      apiKey: 'sk-test',
      client: {
        responses: {
          create: vi.fn().mockResolvedValue({
            output_text: JSON.stringify({
              proposals: [
                {
                  title: 'Anchor the arrival beat',
                  summary: 'Open on Midnight Platform before introducing any new reveal.',
                  changeKind: 'action',
                  riskLabel: 'Low continuity risk',
                  variants: [
                    {
                      label: 'Arrival-first',
                      summary: 'Keep Midnight Platform grounded before the reveal escalates.',
                      rationale: 'Preserves continuity while still moving the scene forward.',
                      tradeoffLabel: null,
                      riskLabel: null,
                    },
                  ],
                },
              ],
            }),
          }),
        },
      },
    })

    await expect(provider.generate(createRequest())).resolves.toEqual({
      proposals: [
        {
          title: 'Anchor the arrival beat',
          summary: 'Open on Midnight Platform before introducing any new reveal.',
          changeKind: 'action',
          riskLabel: 'Low continuity risk',
          variants: [
            {
              label: 'Arrival-first',
              summary: 'Keep Midnight Platform grounded before the reveal escalates.',
              rationale: 'Preserves continuity while still moving the scene forward.',
            },
          ],
        },
      ],
    })
  })
})
