import { describe, expect, it } from 'vitest'

import {
  scenePlannerOpenAiOutputSchema,
  parseScenePlannerOutput,
  scenePlannerOutputSchema,
} from './scenePlannerOutputSchema.js'

function containsKeyword(value: unknown, keyword: string): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => containsKeyword(item, keyword))
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return Object.entries(record).some(([key, nested]) => key === keyword || containsKeyword(nested, keyword))
  }

  return false
}

function createValidOutput() {
  return {
    proposals: [
      {
        title: '  Anchor the arrival beat  ',
        summary: '  Open on Midnight Platform before introducing any new reveal.  ',
        changeKind: 'action',
        riskLabel: '  Low continuity risk  ',
        variants: [
          {
            label: '  Arrival-first  ',
            summary: '  Keep Midnight Platform grounded before the reveal escalates.  ',
            rationale: '  Preserves continuity while still moving the scene forward.  ',
            tradeoffLabel: '  Slower escalation  ',
            riskLabel: '  Low continuity risk  ',
          },
        ],
      },
    ],
  }
}

describe('scenePlannerOutputSchema', () => {
  it('exports a strict json schema contract for planner proposals', () => {
    expect(scenePlannerOutputSchema).toMatchObject({
      additionalProperties: false,
      required: ['proposals'],
      properties: {
        proposals: {
          type: 'array',
          minItems: 1,
        },
      },
    })
  })

  it('exports an OpenAI strict-compatible schema with required object properties and nullable optional semantics', () => {
    expect(scenePlannerOpenAiOutputSchema).toMatchObject({
      additionalProperties: false,
      required: ['proposals'],
      properties: {
        proposals: {
          items: {
            required: ['title', 'summary', 'changeKind', 'riskLabel', 'variants'],
            properties: {
              variants: {
                anyOf: [
                  { type: 'null' },
                  {
                    type: 'array',
                    items: {
                      required: ['label', 'summary', 'rationale', 'tradeoffLabel', 'riskLabel'],
                      properties: {
                        tradeoffLabel: {
                          anyOf: [
                            { type: 'string' },
                            { type: 'null' },
                          ],
                        },
                        riskLabel: {
                          anyOf: [
                            { type: 'string' },
                            { type: 'null' },
                          ],
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    })
  })

  it('does not include unsupported minLength keywords anywhere in the OpenAI wire schema', () => {
    expect(containsKeyword(scenePlannerOpenAiOutputSchema, 'minLength')).toBe(false)
  })

  it('accepts valid planner output and trims string fields', () => {
    expect(parseScenePlannerOutput(createValidOutput())).toEqual({
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
              tradeoffLabel: 'Slower escalation',
              riskLabel: 'Low continuity risk',
            },
          ],
        },
      ],
    })
  })

  it('rejects top-level extra fields', () => {
    expect(() => parseScenePlannerOutput({
      ...createValidOutput(),
      prompt: 'raw prompt should never be persisted',
    })).toThrowError(/prompt/i)
  })

  it('rejects proposal payloads with unsupported change kinds', () => {
    expect(() => parseScenePlannerOutput({
      proposals: [
        {
          title: 'Anchor the arrival beat',
          summary: 'Open on Midnight Platform before introducing any new reveal.',
          changeKind: 'intent',
          riskLabel: 'Low continuity risk',
        },
      ],
    })).toThrowError(/changeKind/i)
  })

  it('rejects empty proposal arrays', () => {
    expect(() => parseScenePlannerOutput({
      proposals: [],
    })).toThrowError(/proposals/i)
  })

  it('rejects empty and whitespace-only strings in the local parser contract', () => {
    expect(() => parseScenePlannerOutput({
      proposals: [
        {
          title: '',
          summary: 'Open on Midnight Platform before introducing any new reveal.',
          changeKind: 'action',
          riskLabel: 'Low continuity risk',
        },
      ],
    })).toThrowError(/title/i)

    expect(() => parseScenePlannerOutput({
      proposals: [
        {
          title: '   ',
          summary: 'Open on Midnight Platform before introducing any new reveal.',
          changeKind: 'action',
          riskLabel: 'Low continuity risk',
        },
      ],
    })).toThrowError(/title/i)
  })

  it('rejects variant arrays with invalid entries when present', () => {
    expect(() => parseScenePlannerOutput({
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
              tradeoffLabel: '   ',
            },
          ],
        },
      ],
    })).toThrowError(/tradeoffLabel/i)
  })

  it('rejects canonical id and localization payload fields from model output objects', () => {
    expect(() => parseScenePlannerOutput({
      proposals: [
        {
          id: 'proposal-1',
          title: 'Anchor the arrival beat',
          summary: 'Open on Midnight Platform before introducing any new reveal.',
          changeKind: 'action',
          riskLabel: 'Low continuity risk',
          variants: [
            {
              label: 'Arrival-first',
              summary: 'Keep Midnight Platform grounded before the reveal escalates.',
              rationale: 'Preserves continuity while still moving the scene forward.',
              riskLabel: {
                en: 'Low continuity risk',
                'zh-CN': '连续性风险低',
              },
            },
          ],
        },
      ],
    })).toThrowError(/id|riskLabel/i)
  })
})
