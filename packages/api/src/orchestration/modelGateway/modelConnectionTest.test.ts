import { describe, expect, it, vi } from 'vitest'

import { runModelConnectionTest } from './modelConnectionTest.js'

describe('runModelConnectionTest', () => {
  it('passes with an explicit fixture summary when all roles stay on fixture', async () => {
    await expect(runModelConnectionTest({
      modelBindings: {
        continuityReviewer: { provider: 'fixture' },
        planner: { provider: 'fixture' },
        sceneProseWriter: { provider: 'fixture' },
        sceneRevision: { provider: 'fixture' },
        summary: { provider: 'fixture' },
      },
    })).resolves.toEqual({
      status: 'passed',
      summary: 'All model roles are explicitly configured to use fixture providers.',
    })
  })

  it('sanitizes missing-key failures before calling the configured provider', async () => {
    const create = async () => {
      throw new Error('should not be called')
    }

    await expect(runModelConnectionTest({
      client: {
        chat: {
          completions: {
            create,
          },
        },
      },
      modelBindings: {
        continuityReviewer: { provider: 'fixture' },
        planner: {
          baseUrl: 'https://api.deepseek.com/v1',
          modelId: 'deepseek-chat',
          provider: 'openai-compatible',
          providerId: 'deepseek',
          providerLabel: 'DeepSeek',
        },
        sceneProseWriter: { provider: 'fixture' },
        sceneRevision: { provider: 'fixture' },
        summary: { provider: 'fixture' },
      },
    })).resolves.toEqual({
      errorCode: 'missing_key',
      status: 'failed',
      summary: 'One or more configured provider credentials are missing.',
    })
  })

  it('dedupes repeated provider/model checks and passes when the provider produces the strict expected payload', async () => {
    const create = vi.fn().mockResolvedValue({
      choices: [{ message: { content: '{"ok":"yes"}' } }],
    })

    await expect(runModelConnectionTest({
      client: {
        chat: {
          completions: {
            create,
          },
        },
      },
      modelBindings: {
        continuityReviewer: { provider: 'fixture' },
        planner: {
          apiKey: 'sk-test',
          baseUrl: 'https://api.deepseek.com/v1',
          modelId: 'deepseek-chat',
          provider: 'openai-compatible',
          providerId: 'deepseek',
          providerLabel: 'DeepSeek',
        },
        sceneProseWriter: {
          apiKey: 'sk-test',
          baseUrl: 'https://api.deepseek.com/v1',
          modelId: 'deepseek-chat',
          provider: 'openai-compatible',
          providerId: 'deepseek',
          providerLabel: 'DeepSeek',
        },
        sceneRevision: { provider: 'fixture' },
        summary: { provider: 'fixture' },
      },
    })).resolves.toEqual({
      status: 'passed',
      summary: 'OpenAI-compatible connection test passed for the configured provider bindings.',
    })
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('fails when any configured provider binding is missing a model id even if another role is valid', async () => {
    const create = async () => ({
      choices: [{ message: { content: '{"ok":"yes"}' } }],
    })

    await expect(runModelConnectionTest({
      client: {
        chat: {
          completions: { create },
        },
      },
      modelBindings: {
        continuityReviewer: { provider: 'fixture' },
        planner: {
          apiKey: 'sk-test',
          baseUrl: 'https://api.deepseek.com/v1',
          modelId: 'deepseek-chat',
          provider: 'openai-compatible',
          providerId: 'deepseek',
          providerLabel: 'DeepSeek',
        },
        sceneProseWriter: {
          apiKey: 'sk-test',
          baseUrl: 'https://api.deepseek.com/v1',
          provider: 'openai-compatible',
          providerId: 'deepseek',
          providerLabel: 'DeepSeek',
        },
        sceneRevision: { provider: 'fixture' },
        summary: { provider: 'fixture' },
      },
    })).resolves.toEqual({
      errorCode: 'model_not_found',
      status: 'failed',
      summary: 'One or more configured provider models were not found.',
    })
  })

  it('fails when any configured provider binding is missing a credential even if another role is valid', async () => {
    const create = async () => ({
      choices: [{ message: { content: '{"ok":"yes"}' } }],
    })

    await expect(runModelConnectionTest({
      client: {
        chat: {
          completions: { create },
        },
      },
      modelBindings: {
        continuityReviewer: { provider: 'fixture' },
        planner: {
          apiKey: 'sk-test',
          baseUrl: 'https://api.deepseek.com/v1',
          modelId: 'deepseek-chat',
          provider: 'openai-compatible',
          providerId: 'deepseek',
          providerLabel: 'DeepSeek',
        },
        sceneProseWriter: {
          baseUrl: 'https://api.deepseek.com/v1',
          modelId: 'deepseek-chat',
          provider: 'openai-compatible',
          providerId: 'deepseek',
          providerLabel: 'DeepSeek',
        },
        sceneRevision: { provider: 'fixture' },
        summary: { provider: 'fixture' },
      },
    })).resolves.toEqual({
      errorCode: 'missing_key',
      status: 'failed',
      summary: 'One or more configured provider credentials are missing.',
    })
  })

  it('fails when a later configured provider model fails even if an earlier one succeeds', async () => {
    const create = async ({ model }: { model: string }) => {
      if (model === 'deepseek-chat') {
        return {
          choices: [{ message: { content: '{"ok":"yes"}' } }],
        }
      }

      const error = new Error('The model `deepseek-reasoner` does not exist.')
      ;(error as Error & { status?: number }).status = 404
      throw error
    }

    await expect(runModelConnectionTest({
      client: {
        chat: {
          completions: { create },
        },
      },
      modelBindings: {
        continuityReviewer: { provider: 'fixture' },
        planner: {
          apiKey: 'sk-test',
          baseUrl: 'https://api.deepseek.com/v1',
          modelId: 'deepseek-chat',
          provider: 'openai-compatible',
          providerId: 'deepseek',
          providerLabel: 'DeepSeek',
        },
        sceneProseWriter: {
          apiKey: 'sk-test',
          baseUrl: 'https://api.deepseek.com/v1',
          modelId: 'deepseek-reasoner',
          provider: 'openai-compatible',
          providerId: 'deepseek',
          providerLabel: 'DeepSeek',
        },
        sceneRevision: { provider: 'fixture' },
        summary: { provider: 'fixture' },
      },
    })).resolves.toEqual({
      errorCode: 'model_not_found',
      status: 'failed',
      summary: 'One or more configured provider models were not found.',
    })
  })

  it('sanitizes model-not-found failures from upstream provider errors', async () => {
    await expect(runModelConnectionTest({
      client: {
        chat: {
          completions: {
            create: async () => {
              const error = new Error('The model `deepseek-ghost` does not exist.')
              ;(error as Error & { status?: number }).status = 404
              throw error
            },
          },
        },
      },
      modelBindings: {
        continuityReviewer: { provider: 'fixture' },
        planner: {
          apiKey: 'sk-test',
          baseUrl: 'https://api.deepseek.com/v1',
          modelId: 'deepseek-ghost',
          provider: 'openai-compatible',
          providerId: 'deepseek',
          providerLabel: 'DeepSeek',
        },
        sceneProseWriter: { provider: 'fixture' },
        sceneRevision: { provider: 'fixture' },
        summary: { provider: 'fixture' },
      },
    })).resolves.toEqual({
      errorCode: 'model_not_found',
      status: 'failed',
      summary: 'One or more configured provider models were not found.',
    })
  })

  it('sanitizes invalid structured output without leaking raw payloads', async () => {
    await expect(runModelConnectionTest({
      client: {
        chat: {
          completions: {
            create: async () => ({
              choices: [{ message: { content: '{"ok":"no"}' } }],
            }),
          },
        },
      },
      modelBindings: {
        continuityReviewer: { provider: 'fixture' },
        planner: {
          apiKey: 'sk-test',
          baseUrl: 'https://api.deepseek.com/v1',
          modelId: 'deepseek-chat',
          provider: 'openai-compatible',
          providerId: 'deepseek',
          providerLabel: 'DeepSeek',
        },
        sceneProseWriter: { provider: 'fixture' },
        sceneRevision: { provider: 'fixture' },
        summary: { provider: 'fixture' },
      },
    })).resolves.toEqual({
      errorCode: 'invalid_output',
      status: 'failed',
      summary: 'The configured provider returned an invalid connection-test response.',
    })
  })

  it('sanitizes network failures without leaking provider payloads or secrets', async () => {
    await expect(runModelConnectionTest({
      client: {
        chat: {
          completions: {
            create: async () => {
              const error = new Error('upstream 500 with sk-secret-value')
              throw error
            },
          },
        },
      },
      modelBindings: {
        continuityReviewer: { provider: 'fixture' },
        planner: {
          apiKey: 'sk-secret-value',
          baseUrl: 'https://api.deepseek.com/v1',
          modelId: 'deepseek-chat',
          provider: 'openai-compatible',
          providerId: 'deepseek',
          providerLabel: 'DeepSeek',
        },
        sceneProseWriter: { provider: 'fixture' },
        sceneRevision: { provider: 'fixture' },
        summary: { provider: 'fixture' },
      },
    })).resolves.toEqual({
      errorCode: 'network_error',
      status: 'failed',
      summary: 'The OpenAI-compatible connection test failed before the response could be validated.',
    })
  })
})
