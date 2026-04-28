import { describe, expect, it } from 'vitest'

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

  it('sanitizes missing-key failures before calling OpenAI', async () => {
    const responsesCreate = async () => {
      throw new Error('should not be called')
    }

    await expect(runModelConnectionTest({
      client: {
        responses: {
          create: responsesCreate,
        },
      },
      modelBindings: {
        continuityReviewer: { provider: 'fixture' },
        planner: { modelId: 'gpt-5.4', provider: 'openai' },
        sceneProseWriter: { provider: 'fixture' },
        sceneRevision: { provider: 'fixture' },
        summary: { provider: 'fixture' },
      },
    })).resolves.toEqual({
      errorCode: 'missing_key',
      status: 'failed',
      summary: 'OpenAI API key is missing for one or more configured model roles.',
    })
  })

  it('returns passed when OpenAI produces the strict expected payload', async () => {
    await expect(runModelConnectionTest({
      client: {
        responses: {
          create: async () => ({
            output_text: '{"ok":"yes"}',
          }),
        },
      },
      modelBindings: {
        continuityReviewer: { provider: 'fixture' },
        planner: { apiKey: 'sk-test', modelId: 'gpt-5.4', provider: 'openai' },
        sceneProseWriter: { provider: 'fixture' },
        sceneRevision: { provider: 'fixture' },
        summary: { provider: 'fixture' },
      },
    })).resolves.toEqual({
      status: 'passed',
      summary: 'OpenAI connection test passed for the configured model roles.',
    })
  })

  it('fails when any OpenAI-bound role is missing a model id even if another role is valid', async () => {
    const create = async () => ({
      output_text: '{"ok":"yes"}',
    })

    await expect(runModelConnectionTest({
      client: {
        responses: { create },
      },
      modelBindings: {
        continuityReviewer: { provider: 'fixture' },
        planner: { apiKey: 'sk-test', modelId: 'gpt-5.4', provider: 'openai' },
        sceneProseWriter: { apiKey: 'sk-test', provider: 'openai' },
        sceneRevision: { provider: 'fixture' },
        summary: { provider: 'fixture' },
      },
    })).resolves.toEqual({
      errorCode: 'model_not_found',
      status: 'failed',
      summary: 'One or more configured OpenAI models were not found.',
    })
  })

  it('fails when any OpenAI-bound role is missing a credential even if another role is valid', async () => {
    const create = async () => ({
      output_text: '{"ok":"yes"}',
    })

    await expect(runModelConnectionTest({
      client: {
        responses: { create },
      },
      modelBindings: {
        continuityReviewer: { provider: 'fixture' },
        planner: { apiKey: 'sk-test', modelId: 'gpt-5.4', provider: 'openai' },
        sceneProseWriter: { modelId: 'gpt-5.4-mini', provider: 'openai' },
        sceneRevision: { provider: 'fixture' },
        summary: { provider: 'fixture' },
      },
    })).resolves.toEqual({
      errorCode: 'missing_key',
      status: 'failed',
      summary: 'OpenAI API key is missing for one or more configured model roles.',
    })
  })

  it('fails when a later configured OpenAI model fails even if an earlier one succeeds', async () => {
    const create = async ({ model }: { model: string }) => {
      if (model === 'gpt-5.4') {
        return {
          output_text: '{"ok":"yes"}',
        }
      }

      const error = new Error('The model `gpt-5.4-mini` does not exist.')
      ;(error as Error & { status?: number }).status = 404
      throw error
    }

    await expect(runModelConnectionTest({
      client: {
        responses: { create },
      },
      modelBindings: {
        continuityReviewer: { provider: 'fixture' },
        planner: { apiKey: 'sk-test', modelId: 'gpt-5.4', provider: 'openai' },
        sceneProseWriter: { apiKey: 'sk-test', modelId: 'gpt-5.4-mini', provider: 'openai' },
        sceneRevision: { provider: 'fixture' },
        summary: { provider: 'fixture' },
      },
    })).resolves.toEqual({
      errorCode: 'model_not_found',
      status: 'failed',
      summary: 'One or more configured OpenAI models were not found.',
    })
  })

  it('sanitizes model-not-found failures from OpenAI errors', async () => {
    await expect(runModelConnectionTest({
      client: {
        responses: {
          create: async () => {
            const error = new Error('The model `gpt-does-not-exist` does not exist.')
            ;(error as Error & { status?: number }).status = 404
            throw error
          },
        },
      },
      modelBindings: {
        continuityReviewer: { provider: 'fixture' },
        planner: { apiKey: 'sk-test', modelId: 'gpt-does-not-exist', provider: 'openai' },
        sceneProseWriter: { provider: 'fixture' },
        sceneRevision: { provider: 'fixture' },
        summary: { provider: 'fixture' },
      },
    })).resolves.toEqual({
      errorCode: 'model_not_found',
      status: 'failed',
      summary: 'One or more configured OpenAI models were not found.',
    })
  })

  it('sanitizes invalid structured output without leaking raw payloads', async () => {
    await expect(runModelConnectionTest({
      client: {
        responses: {
          create: async () => ({
            output_text: '{"ok":"no"}',
          }),
        },
      },
      modelBindings: {
        continuityReviewer: { provider: 'fixture' },
        planner: { apiKey: 'sk-test', modelId: 'gpt-5.4', provider: 'openai' },
        sceneProseWriter: { provider: 'fixture' },
        sceneRevision: { provider: 'fixture' },
        summary: { provider: 'fixture' },
      },
    })).resolves.toEqual({
      errorCode: 'invalid_output',
      status: 'failed',
      summary: 'OpenAI returned an invalid connection-test response.',
    })
  })
})
