import OpenAI from 'openai'

type JsonSchemaRecord = Record<string, unknown>

type ChatCompletionMessageContentPart =
  | {
      type: 'text'
      text: string
    }
  | {
      type: string
      [key: string]: unknown
    }

export interface OpenAiCompatibleChatCompletionClientLike {
  chat: {
    completions: {
      create(request: {
        model: string
        messages: Array<{
          role: 'system' | 'user'
          content: string
        }>
        response_format: {
          type: 'json_schema'
          json_schema: {
            name: string
            strict: boolean
            schema: JsonSchemaRecord
          }
        }
      }): Promise<{
        choices?: Array<{
          message?: {
            content?: string | ChatCompletionMessageContentPart[] | null
          }
        }>
      }>
    }
  }
}

export interface RequestOpenAiCompatibleJsonTextOptions {
  apiKey: string
  baseUrl: string
  client?: OpenAiCompatibleChatCompletionClientLike
  input: string
  instructions: string
  modelId: string
  schema: JsonSchemaRecord
  schemaName: string
}

export async function requestOpenAiCompatibleJsonText(
  options: RequestOpenAiCompatibleJsonTextOptions,
) {
  const client = options.client ?? new OpenAI({
    apiKey: options.apiKey,
    baseURL: options.baseUrl,
  })

  const response = await client.chat.completions.create({
    model: options.modelId,
    messages: [
      { role: 'system', content: options.instructions },
      { role: 'user', content: options.input },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: options.schemaName,
        strict: true,
        schema: options.schema,
      },
    },
  })

  const content = response.choices?.[0]?.message?.content
  const outputText = extractAssistantText(content)?.trim()
  if (!outputText) {
    throw new Error('OpenAI-compatible provider returned no assistant JSON content.')
  }

  return outputText
}

function extractAssistantText(content?: string | ChatCompletionMessageContentPart[] | null) {
  if (typeof content === 'string') {
    return content
  }

  if (!Array.isArray(content)) {
    return undefined
  }

  return content
    .filter((part): part is Extract<ChatCompletionMessageContentPart, { type: 'text' }> => {
      return part.type === 'text' && typeof part.text === 'string'
    })
    .map((part) => part.text)
    .join('')
}
