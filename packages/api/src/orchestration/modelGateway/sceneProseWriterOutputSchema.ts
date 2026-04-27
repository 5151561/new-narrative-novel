import { Ajv, type ErrorObject } from 'ajv'

import type { LocalizedTextRecord, RunArtifactAssetKind, RunArtifactRelatedAssetRecord } from '../../contracts/api-records.js'

export interface SceneProseWriterOutput {
  body: LocalizedTextRecord
  excerpt: LocalizedTextRecord
  diffSummary: string
  wordCount: number
  relatedAssets: RunArtifactRelatedAssetRecord[]
}

const assetKinds = ['character', 'location', 'rule'] as const satisfies readonly RunArtifactAssetKind[]

const nonEmptyTrimmedStringSchema = {
  type: 'string',
  minLength: 1,
  pattern: '\\S',
} as const

const localizedTextSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['en', 'zh-CN'],
  properties: {
    en: nonEmptyTrimmedStringSchema,
    'zh-CN': nonEmptyTrimmedStringSchema,
  },
} as const

const relatedAssetSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['assetId', 'kind', 'label'],
  properties: {
    assetId: nonEmptyTrimmedStringSchema,
    kind: {
      type: 'string',
      enum: [...assetKinds],
    },
    label: localizedTextSchema,
  },
} as const

export const sceneProseWriterOpenAiOutputSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['body', 'excerpt', 'diffSummary', 'relatedAssets'],
  properties: {
    body: localizedTextSchema,
    excerpt: localizedTextSchema,
    diffSummary: nonEmptyTrimmedStringSchema,
    relatedAssets: {
      type: 'array',
      minItems: 1,
      items: relatedAssetSchema,
    },
  },
} as const

const ajv = new Ajv({
  allErrors: true,
  strict: true,
})

const validateSceneProseWriterOutputPayload = ajv.compile(sceneProseWriterOpenAiOutputSchema)

export function validateSceneProseWriterOutput(input: unknown): input is SceneProseWriterOutput {
  return validateSceneProseWriterOutputPayload(input) as boolean
}

export function parseSceneProseWriterOutput(input: unknown): SceneProseWriterOutput {
  const payload = stripDerivedWordCount(input)

  if (!validateSceneProseWriterOutputPayload(payload)) {
    throw new Error(formatAjvErrors(validateSceneProseWriterOutputPayload.errors))
  }

  const normalized = normalizeSceneProseWriterOutput(payload as Omit<SceneProseWriterOutput, 'wordCount'>)
  return {
    ...normalized,
    wordCount: countWords(normalized.body.en),
  }
}

function stripDerivedWordCount(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return input
  }

  const candidate = input as Record<string, unknown>
  if (!('wordCount' in candidate)) {
    return input
  }

  const { wordCount: _wordCount, ...rest } = candidate
  return rest
}

function normalizeSceneProseWriterOutput(input: Omit<SceneProseWriterOutput, 'wordCount'>) {
  return {
    body: normalizeLocalizedText(input.body),
    excerpt: normalizeLocalizedText(input.excerpt),
    diffSummary: input.diffSummary.trim(),
    relatedAssets: input.relatedAssets.map((asset) => ({
      assetId: asset.assetId.trim(),
      kind: asset.kind,
      label: normalizeLocalizedText(asset.label),
    })),
  }
}

function normalizeLocalizedText(input: LocalizedTextRecord): LocalizedTextRecord {
  return {
    en: input.en.trim(),
    'zh-CN': input['zh-CN'].trim(),
  }
}

function countWords(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length
}

function formatAjvErrors(errors: ErrorObject[] | null | undefined) {
  if (!errors?.length) {
    return 'Scene prose writer output is invalid.'
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
