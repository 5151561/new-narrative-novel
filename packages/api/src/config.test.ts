import { fileURLToPath } from 'node:url'

import { afterEach, describe, expect, it } from 'vitest'

import { getApiServerConfig } from './config.js'
import { serializeModelBindings } from './orchestration/modelGateway/model-binding.js'

const originalEnv = { ...process.env }
const defaultProjectStoreFilePath = fileURLToPath(
  new URL('../../../.narrative/local-project-store.json', import.meta.url),
)

describe('getApiServerConfig', () => {
  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('defaults the local project store paths to the workspace .narrative directory', () => {
    expect(getApiServerConfig()).toMatchObject({
      modelBindings: {
        continuityReviewer: {
          provider: 'fixture',
        },
        planner: {
          provider: 'fixture',
        },
        sceneProseWriter: {
          provider: 'fixture',
        },
        sceneRevision: {
          provider: 'fixture',
        },
        summary: {
          provider: 'fixture',
        },
      },
      modelProvider: 'fixture',
      projectStoreFilePath: defaultProjectStoreFilePath,
      projectArtifactDirPath: fileURLToPath(
        new URL('../../../.narrative/artifacts', import.meta.url),
      ),
    })
  })

  it('parses NARRATIVE_MODEL_SETTINGS_JSON before legacy provider envs', () => {
    process.env.NARRATIVE_MODEL_PROVIDER = 'openai'
    process.env.NARRATIVE_OPENAI_MODEL = 'gpt-legacy'
    process.env.OPENAI_API_KEY = 'sk-legacy'
    process.env.NARRATIVE_MODEL_SETTINGS_JSON = JSON.stringify({
      bindings: {
        continuityReviewer: { provider: 'fixture' },
        planner: {
          modelId: 'deepseek-chat',
          provider: 'openai-compatible',
          providerId: 'deepseek',
        },
        sceneProseWriter: {
          modelId: 'deepseek-chat',
          provider: 'openai-compatible',
          providerId: 'deepseek',
        },
        sceneRevision: { provider: 'fixture' },
        summary: { provider: 'fixture' },
      },
      providers: [
        {
          apiKey: 'sk-deepseek',
          baseUrl: 'https://api.deepseek.com/v1',
          id: 'deepseek',
          label: 'DeepSeek',
        },
      ],
    })

    expect(getApiServerConfig()).toMatchObject({
      modelBindings: {
        continuityReviewer: {
          provider: 'fixture',
        },
        planner: {
          apiKey: 'sk-deepseek',
          baseUrl: 'https://api.deepseek.com/v1',
          modelId: 'deepseek-chat',
          provider: 'openai-compatible',
          providerId: 'deepseek',
          providerLabel: 'DeepSeek',
        },
        sceneProseWriter: {
          apiKey: 'sk-deepseek',
          baseUrl: 'https://api.deepseek.com/v1',
          modelId: 'deepseek-chat',
          provider: 'openai-compatible',
          providerId: 'deepseek',
          providerLabel: 'DeepSeek',
        },
      },
      modelProvider: 'openai-compatible',
    })
  })

  it('defaults real-project sessions to the synthesized openai-compatible provider instead of implicit fixture fallback', () => {
    process.env.NARRATIVE_PROJECT_ROOT = '/tmp/local-project'
    process.env.NARRATIVE_PROJECT_ID = 'book-signal-arc'
    process.env.NARRATIVE_PROJECT_MODE = 'real-project'
    process.env.NARRATIVE_PROJECT_TITLE = 'Signal Arc Desktop'

    expect(getApiServerConfig()).toMatchObject({
      currentProject: {
        projectId: 'book-signal-arc',
        projectMode: 'real-project',
        projectRoot: '/tmp/local-project',
        projectTitle: 'Signal Arc Desktop',
      },
      modelProvider: 'openai-compatible',
      modelBindings: {
        continuityReviewer: {
          provider: 'openai-compatible',
          providerId: 'openai-default',
          providerLabel: 'OpenAI',
          baseUrl: 'https://api.openai.com/v1',
        },
        planner: {
          provider: 'openai-compatible',
          providerId: 'openai-default',
          providerLabel: 'OpenAI',
          baseUrl: 'https://api.openai.com/v1',
        },
        sceneProseWriter: {
          provider: 'openai-compatible',
          providerId: 'openai-default',
          providerLabel: 'OpenAI',
          baseUrl: 'https://api.openai.com/v1',
        },
        sceneRevision: {
          provider: 'openai-compatible',
          providerId: 'openai-default',
          providerLabel: 'OpenAI',
          baseUrl: 'https://api.openai.com/v1',
        },
        summary: {
          provider: 'openai-compatible',
          providerId: 'openai-default',
          providerLabel: 'OpenAI',
          baseUrl: 'https://api.openai.com/v1',
        },
      },
    })
  })

  it('keeps the legacy openai env migration path by synthesizing the default provider profile', () => {
    process.env.NARRATIVE_MODEL_PROVIDER = 'openai'
    process.env.NARRATIVE_OPENAI_MODEL = 'gpt-5.4'
    process.env.OPENAI_API_KEY = 'sk-test'

    expect(getApiServerConfig()).toMatchObject({
      modelBindings: {
        continuityReviewer: {
          apiKey: 'sk-test',
          baseUrl: 'https://api.openai.com/v1',
          modelId: 'gpt-5.4',
          provider: 'openai-compatible',
          providerId: 'openai-default',
          providerLabel: 'OpenAI',
        },
        planner: {
          apiKey: 'sk-test',
          baseUrl: 'https://api.openai.com/v1',
          modelId: 'gpt-5.4',
          provider: 'openai-compatible',
          providerId: 'openai-default',
          providerLabel: 'OpenAI',
        },
      },
      modelProvider: 'openai-compatible',
    })
  })

  it('serializes normalized model bindings without leaking raw secrets', () => {
    process.env.NARRATIVE_MODEL_SETTINGS_JSON = JSON.stringify({
      bindings: {
        continuityReviewer: { provider: 'fixture' },
        planner: {
          modelId: 'deepseek-chat',
          provider: 'openai-compatible',
          providerId: 'deepseek',
        },
        sceneProseWriter: { provider: 'fixture' },
        sceneRevision: { provider: 'fixture' },
        summary: { provider: 'fixture' },
      },
      providers: [
        {
          apiKey: 'sk-secret-value',
          baseUrl: 'https://api.deepseek.com/v1',
          id: 'deepseek',
          label: 'DeepSeek',
        },
      ],
    })

    const serialized = serializeModelBindings(getApiServerConfig().modelBindings ?? {})

    expect(serialized.planner).toEqual({
      baseUrl: 'https://api.deepseek.com/v1',
      credentialStatus: {
        configured: true,
        redactedValue: 'sk-...alue',
      },
      modelId: 'deepseek-chat',
      provider: 'openai-compatible',
      providerId: 'deepseek',
      providerLabel: 'DeepSeek',
    })
    expect(JSON.stringify(serialized)).not.toContain('sk-secret-value')
  })
})
