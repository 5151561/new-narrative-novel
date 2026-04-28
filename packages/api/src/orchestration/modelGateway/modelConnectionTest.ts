import type { ApiServerConfig } from '../../config.js'
import {
  requestOpenAiCompatibleJsonText,
  type OpenAiCompatibleChatCompletionClientLike,
} from './openai-compatible-json-client.js'
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

export interface RunModelConnectionTestOptions extends Pick<ApiServerConfig, 'modelBindings'> {
  client?: OpenAiCompatibleChatCompletionClientLike
}

type ConnectionTestSchema = {
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

const connectionTestSchema: ConnectionTestSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['ok'],
  properties: {
    ok: {
      type: 'string',
      enum: ['yes'],
    },
  },
}

export async function runModelConnectionTest(
  options: RunModelConnectionTestOptions,
): Promise<ModelConnectionTestRecord> {
  const providerBindings = getOpenAiCompatibleBindings(options.modelBindings)
  if (providerBindings.length === 0) {
    return {
      status: 'passed',
      summary: 'All model roles are explicitly configured to use fixture providers.',
    }
  }

  const testedBindings = new Set<string>()
  for (const binding of providerBindings) {
    if (!binding.apiKey) {
      return {
        errorCode: 'missing_key',
        status: 'failed',
        summary: 'One or more configured provider credentials are missing.',
      }
    }

    if (!binding.modelId) {
      return {
        errorCode: 'model_not_found',
        status: 'failed',
        summary: 'One or more configured provider models were not found.',
      }
    }

    const dedupeKey = `${binding.providerId}::${binding.modelId}`
    if (testedBindings.has(dedupeKey)) {
      continue
    }
    testedBindings.add(dedupeKey)

    const result = await runSingleBindingConnectionTest({
      apiKey: binding.apiKey,
      baseUrl: binding.baseUrl,
      client: options.client,
      modelId: binding.modelId,
    })
    if (result.status === 'failed') {
      return result
    }
  }

  return {
    status: 'passed',
    summary: 'OpenAI-compatible connection test passed for the configured provider bindings.',
  }
}

function getOpenAiCompatibleBindings(modelBindings?: ModelBindings) {
  return MODEL_BINDING_ROLES.map((role) => resolveModelBindingForRole({ modelBindings }, role)).filter((binding) => {
    return binding.provider === 'openai-compatible'
  })
}

async function runSingleBindingConnectionTest({
  apiKey,
  baseUrl,
  client,
  modelId,
}: {
  apiKey: string
  baseUrl: string
  client?: OpenAiCompatibleChatCompletionClientLike
  modelId: string
}): Promise<ModelConnectionTestRecord> {
  try {
    const outputText = await requestOpenAiCompatibleJsonText({
      apiKey,
      baseUrl,
      client,
      input: 'Connectivity check.',
      instructions: 'Return {"ok":"yes"} and nothing else.',
      modelId,
      schema: connectionTestSchema,
      schemaName: 'model_connection_test',
    })

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
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        errorCode: 'invalid_output',
        status: 'failed',
        summary: 'The configured provider returned an invalid connection-test response.',
      }
    }

    const message = error instanceof Error ? error.message : ''
    if (message === 'invalid output') {
      return {
        errorCode: 'invalid_output',
        status: 'failed',
        summary: 'The configured provider returned an invalid connection-test response.',
      }
    }

    return sanitizeOpenAiCompatibleConnectionError(error)
  }
}

function sanitizeOpenAiCompatibleConnectionError(error: unknown): ModelConnectionTestRecord {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  const status = typeof error === 'object' && error && 'status' in error ? (error as { status?: number }).status : undefined

  if (message.includes('api key') || status === 401 || message.includes('incorrect api key')) {
    return {
      errorCode: 'invalid_key',
      status: 'failed',
      summary: 'The configured provider rejected its credential.',
    }
  }

  if (status === 404 || message.includes('model') && message.includes('not exist')) {
    return {
      errorCode: 'model_not_found',
      status: 'failed',
      summary: 'One or more configured provider models were not found.',
    }
  }

  if (message.includes('no assistant json content')) {
    return {
      errorCode: 'invalid_output',
      status: 'failed',
      summary: 'The configured provider returned an invalid connection-test response.',
    }
  }

  return {
    errorCode: 'network_error',
    status: 'failed',
    summary: 'The OpenAI-compatible connection test failed before the response could be validated.',
  }
}
