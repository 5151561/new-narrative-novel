import { describe, expect, it, vi } from 'vitest'

import { requestOpenAiCompatibleJsonText } from './openai-compatible-json-client.js'

describe('requestOpenAiCompatibleJsonText', () => {
  it('calls chat completions with baseURL and strict json_schema response format', async () => {
    const create = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: '{"ok":"yes"}',
          },
        },
      ],
    })

    await expect(requestOpenAiCompatibleJsonText({
      apiKey: 'sk-test',
      baseUrl: 'https://api.deepseek.com/v1',
      client: {
        chat: {
          completions: {
            create,
          },
        },
      },
      input: 'Connectivity check.',
      instructions: 'Return only valid JSON.',
      modelId: 'deepseek-chat',
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['ok'],
        properties: {
          ok: {
            type: 'string',
            enum: ['yes'],
          },
        },
      },
      schemaName: 'model_connection_test',
    })).resolves.toBe('{"ok":"yes"}')

    expect(create).toHaveBeenCalledWith({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'Return only valid JSON.' },
        { role: 'user', content: 'Connectivity check.' },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'model_connection_test',
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['ok'],
            properties: {
              ok: {
                type: 'string',
                enum: ['yes'],
              },
            },
          },
          strict: true,
        },
      },
    })
  })

  it('extracts text content from structured assistant content parts', async () => {
    await expect(requestOpenAiCompatibleJsonText({
      apiKey: 'sk-test',
      baseUrl: 'https://api.deepseek.com/v1',
      client: {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: [
                      {
                        type: 'text',
                        text: '{"ok":"yes"}',
                      },
                    ],
                  },
                },
              ],
            }),
          },
        },
      },
      input: 'Connectivity check.',
      instructions: 'Return only valid JSON.',
      modelId: 'deepseek-chat',
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['ok'],
        properties: {
          ok: {
            type: 'string',
            enum: ['yes'],
          },
        },
      },
      schemaName: 'model_connection_test',
    })).resolves.toBe('{"ok":"yes"}')
  })

  it('fails without echoing credentials when the assistant message has no text content', async () => {
    await expect(requestOpenAiCompatibleJsonText({
      apiKey: 'sk-secret-value',
      baseUrl: 'https://api.deepseek.com/v1',
      client: {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: [],
                  },
                },
              ],
            }),
          },
        },
      },
      input: 'Connectivity check.',
      instructions: 'Return only valid JSON.',
      modelId: 'deepseek-chat',
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['ok'],
        properties: {
          ok: {
            type: 'string',
            enum: ['yes'],
          },
        },
      },
      schemaName: 'model_connection_test',
    })).rejects.toThrowError('OpenAI-compatible provider returned no assistant JSON content.')
  })
})
