import OpenAI from 'openai'

import type { ApiServerConfig } from '../../config.js'
import { MODEL_BINDING_ROLES, resolveModelBindingForRole, type ModelBindings } from './model-binding.js'

export type ModelConnectionTestStatus = 'never' | 'passed' | 'failed'
export type ModelConnectionTestErrorCode =
  | 'missing_key'
  | 'invalid_key'
  | 'model_not_found'
  | 'network_error'
  | 'invalid_output'

export interface ModelConnectionTestRecord {
  status: ModelConnectionTestStatus
  errorCode?: ModelConnectionTestErrorCode
  summary?: string
}

export interface ModelConnectionTestClientLike {
  responses: {
    create(request: {
      model: string
      instructions: string
      input: string
      text: {
        format: {
          name: string
          type: 'json_schema'
          strict: boolean
          schema: {
            type: 'object'
            additionalProperties: false
            required: ['ok']
            properties: {
              ok: {
                type: 'string'
                enum: ['yes']
              }
            }
          }
        }
      }
    }): Promise<{
      output_text: string
    }>
  }
}

export interface RunModelConnectionTestOptions extends Pick<ApiServerConfig, 'modelBindings'> {
  client?: ModelConnectionTestClientLike
}

const connectionTestSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['ok'],
  properties: {
    ok: {
      type: 'string',
      enum: ['yes'],
    },
  },
} as const

export async function runModelConnectionTest(
  options: RunModelConnectionTestOptions,
): Promise<ModelConnectionTestRecord> {
  const openAiBindings = getOpenAiBindings(options.modelBindings)
  if (openAiBindings.length === 0) {
    return {
      status: 'passed',
      summary: 'All model roles are explicitly configured to use fixture providers.',
    }
  }

  for (const binding of openAiBindings) {
    if (!binding.apiKey) {
      return {
        errorCode: 'missing_key',
        status: 'failed',
        summary: 'OpenAI API key is missing for one or more configured model roles.',
      }
    }

    if (!binding.modelId) {
      return {
        errorCode: 'model_not_found',
        status: 'failed',
        summary: 'One or more configured OpenAI models were not found.',
      }
    }

    const result = await runSingleBindingConnectionTest({
      apiKey: binding.apiKey,
      client: options.client,
      modelId: binding.modelId,
    })
    if (result.status === 'failed') {
      return result
    }
  }

  return {
    status: 'passed',
    summary: 'OpenAI connection test passed for the configured model roles.',
  }
}

function getOpenAiBindings(modelBindings?: ModelBindings) {
  return MODEL_BINDING_ROLES.map((role) => resolveModelBindingForRole({ modelBindings }, role)).filter((binding) => {
    return binding.provider === 'openai'
  })
}

async function runSingleBindingConnectionTest({
  apiKey,
  client,
  modelId,
}: {
  apiKey: string
  client?: ModelConnectionTestClientLike
  modelId: string
}): Promise<ModelConnectionTestRecord> {
  const resolvedClient = client ?? new OpenAI({
    apiKey,
  })

  let outputText: string
  try {
    const response = await resolvedClient.responses.create({
      model: modelId,
      instructions: 'Return {"ok":"yes"} and nothing else.',
      input: 'Connectivity check only.',
      text: {
        format: {
          name: 'model_connection_test',
          type: 'json_schema',
          strict: true,
          schema: connectionTestSchema,
        },
      },
    })
    outputText = response.output_text.trim()
  } catch (error) {
    return sanitizeOpenAiConnectionError(error)
  }

  try {
    const parsed = JSON.parse(outputText) as unknown
    if (
      !parsed
      || typeof parsed !== 'object'
      || (parsed as { ok?: unknown }).ok !== 'yes'
    ) {
      throw new Error('invalid output')
    }

    return {
      status: 'passed',
    }
  } catch {
    return {
      errorCode: 'invalid_output',
      status: 'failed',
      summary: 'OpenAI returned an invalid connection-test response.',
    }
  }
}

function sanitizeOpenAiConnectionError(error: unknown): ModelConnectionTestRecord {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  const status = typeof error === 'object' && error && 'status' in error ? (error as { status?: number }).status : undefined

  if (message.includes('api key') || status === 401 || message.includes('incorrect api key')) {
    return {
      errorCode: 'invalid_key',
      status: 'failed',
      summary: 'OpenAI rejected the configured API key.',
    }
  }

  if (status === 404 || message.includes('model') && message.includes('not exist')) {
    return {
      errorCode: 'model_not_found',
      status: 'failed',
      summary: 'One or more configured OpenAI models were not found.',
    }
  }

  return {
    errorCode: 'network_error',
    status: 'failed',
    summary: 'OpenAI connection test failed before the response could be validated.',
  }
}
