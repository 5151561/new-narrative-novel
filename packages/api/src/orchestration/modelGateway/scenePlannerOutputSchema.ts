import { Ajv, type ErrorObject } from 'ajv'

import type { ProposalChangeKind } from '../../contracts/api-records.js'

export interface ScenePlannerOutputVariant {
  label: string
  summary: string
  rationale: string
  tradeoffLabel?: string
  riskLabel?: string
}

export interface ScenePlannerOutputProposal {
  title: string
  summary: string
  changeKind: ProposalChangeKind
  riskLabel: string
  variants?: ScenePlannerOutputVariant[]
}

export interface ScenePlannerOutput {
  proposals: ScenePlannerOutputProposal[]
}

const proposalChangeKinds = ['action', 'reveal', 'state-change', 'continuity-note'] as const satisfies readonly ProposalChangeKind[]

const nonEmptyTrimmedStringSchema = {
  type: 'string',
  minLength: 1,
  pattern: '\\S',
} as const

const openAiStringSchema = {
  type: 'string',
} as const

const nullableOpenAiStringSchema = {
  anyOf: [
    openAiStringSchema,
    { type: 'null' },
  ],
} as const

const plannerVariantSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['label', 'summary', 'rationale'],
  properties: {
    label: nonEmptyTrimmedStringSchema,
    summary: nonEmptyTrimmedStringSchema,
    rationale: nonEmptyTrimmedStringSchema,
    tradeoffLabel: nonEmptyTrimmedStringSchema,
    riskLabel: nonEmptyTrimmedStringSchema,
  },
} as const

const plannerOpenAiVariantSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['label', 'summary', 'rationale', 'tradeoffLabel', 'riskLabel'],
  properties: {
    label: openAiStringSchema,
    summary: openAiStringSchema,
    rationale: openAiStringSchema,
    tradeoffLabel: nullableOpenAiStringSchema,
    riskLabel: nullableOpenAiStringSchema,
  },
} as const

const plannerProposalSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'summary', 'changeKind', 'riskLabel'],
  properties: {
    title: nonEmptyTrimmedStringSchema,
    summary: nonEmptyTrimmedStringSchema,
    changeKind: {
      type: 'string',
      enum: [...proposalChangeKinds],
    },
    riskLabel: nonEmptyTrimmedStringSchema,
    variants: {
      type: 'array',
      items: plannerVariantSchema,
    },
  },
} as const

const plannerOpenAiProposalSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'summary', 'changeKind', 'riskLabel', 'variants'],
  properties: {
    title: openAiStringSchema,
    summary: openAiStringSchema,
    changeKind: {
      type: 'string',
      enum: [...proposalChangeKinds],
    },
    riskLabel: openAiStringSchema,
    variants: {
      anyOf: [
        { type: 'null' },
        {
          type: 'array',
          items: plannerOpenAiVariantSchema,
        },
      ],
    },
  },
} as const

export const scenePlannerOutputSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['proposals'],
  properties: {
    proposals: {
      type: 'array',
      minItems: 1,
      items: plannerProposalSchema,
    },
  },
} as const

export const scenePlannerOpenAiOutputSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['proposals'],
  properties: {
    proposals: {
      type: 'array',
      minItems: 1,
      items: plannerOpenAiProposalSchema,
    },
  },
} as const

const ajv = new Ajv({
  allErrors: true,
  strict: true,
})

const validateScenePlannerOutputPayload = ajv.compile(scenePlannerOutputSchema)

export function validateScenePlannerOutput(input: unknown): input is ScenePlannerOutput {
  return validateScenePlannerOutputPayload(input) as boolean
}

export function parseScenePlannerOutput(input: unknown): ScenePlannerOutput {
  if (!validateScenePlannerOutputPayload(input)) {
    throw new Error(formatAjvErrors(validateScenePlannerOutputPayload.errors))
  }

  return normalizeScenePlannerOutput(input as ScenePlannerOutput)
}

export function normalizeScenePlannerOpenAiOutput(input: unknown): unknown {
  if (!isRecord(input) || !Array.isArray(input.proposals)) {
    return input
  }

  return {
    ...input,
    proposals: input.proposals.map((proposal) => {
      if (!isRecord(proposal)) {
        return proposal
      }

      const normalizedProposal = { ...proposal }
      if (normalizedProposal.variants === null) {
        delete normalizedProposal.variants
        return normalizedProposal
      }

      if (Array.isArray(normalizedProposal.variants)) {
        normalizedProposal.variants = normalizedProposal.variants.map((variant) => {
          if (!isRecord(variant)) {
            return variant
          }

          const normalizedVariant = { ...variant }
          if (normalizedVariant.tradeoffLabel === null) {
            delete normalizedVariant.tradeoffLabel
          }
          if (normalizedVariant.riskLabel === null) {
            delete normalizedVariant.riskLabel
          }

          return normalizedVariant
        })
      }

      return normalizedProposal
    }),
  }
}

function normalizeScenePlannerOutput(input: ScenePlannerOutput): ScenePlannerOutput {
  return {
    proposals: input.proposals.map((proposal) => ({
      title: proposal.title.trim(),
      summary: proposal.summary.trim(),
      changeKind: proposal.changeKind,
      riskLabel: proposal.riskLabel.trim(),
      ...(proposal.variants
        ? {
            variants: proposal.variants.map((variant) => ({
              label: variant.label.trim(),
              summary: variant.summary.trim(),
              rationale: variant.rationale.trim(),
              ...(variant.tradeoffLabel ? { tradeoffLabel: variant.tradeoffLabel.trim() } : {}),
              ...(variant.riskLabel ? { riskLabel: variant.riskLabel.trim() } : {}),
            })),
          }
        : {}),
    })),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function formatAjvErrors(errors: ErrorObject[] | null | undefined) {
  if (!errors?.length) {
    return 'Scene planner output is invalid.'
  }

  return errors
    .map((error) => {
      const path = formatErrorPath(error)
      return `${path} ${error.message ?? 'is invalid'}`
    })
    .join('; ')
}

function formatErrorPath(error: ErrorObject) {
  if (error.keyword === 'required') {
    const missingProperty = String((error.params as { missingProperty: string }).missingProperty)
    return `${error.instancePath || '/'}${error.instancePath ? '/' : ''}${missingProperty}`
  }

  if (error.keyword === 'additionalProperties') {
    const additionalProperty = String((error.params as { additionalProperty: string }).additionalProperty)
    return `${error.instancePath || '/'}${error.instancePath ? '/' : ''}${additionalProperty}`
  }

  return error.instancePath || '/'
}
