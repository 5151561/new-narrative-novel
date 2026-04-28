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
      openAiApiKey: undefined,
      openAiModel: undefined,
      projectStoreFilePath: defaultProjectStoreFilePath,
      projectArtifactDirPath: fileURLToPath(
        new URL('../../../.narrative/artifacts', import.meta.url),
      ),
    })
  })

  it('prefers NARRATIVE_PROJECT_STORE_FILE when present and derives the default artifact directory from it', () => {
    process.env.NARRATIVE_PROJECT_STORE_FILE = '/tmp/narrative/custom-store.json'

    expect(getApiServerConfig()).toMatchObject({
      projectStoreFilePath: '/tmp/narrative/custom-store.json',
      projectArtifactDirPath: '/tmp/narrative/artifacts',
    })
  })

  it('falls back to the legacy NARRATIVE_PROJECT_STATE_FILE when the new store env is unset', () => {
    process.env.NARRATIVE_PROJECT_STATE_FILE = '/tmp/narrative/legacy-store.json'

    expect(getApiServerConfig()).toMatchObject({
      projectStoreFilePath: '/tmp/narrative/legacy-store.json',
      projectArtifactDirPath: '/tmp/narrative/artifacts',
    })
  })

  it('prefers an explicit artifact directory env over the derived sibling directory', () => {
    process.env.NARRATIVE_PROJECT_STORE_FILE = '/tmp/narrative/custom-store.json'
    process.env.NARRATIVE_PROJECT_ARTIFACT_DIR = '/tmp/narrative/custom-artifacts'

    expect(getApiServerConfig()).toMatchObject({
      projectStoreFilePath: '/tmp/narrative/custom-store.json',
      projectArtifactDirPath: '/tmp/narrative/custom-artifacts',
    })
  })

  it('reads selected desktop project bootstrap metadata when present', () => {
    process.env.NARRATIVE_PROJECT_ROOT = '/tmp/local-project'
    process.env.NARRATIVE_PROJECT_ID = 'book-signal-arc'
    process.env.NARRATIVE_PROJECT_MODE = 'demo-fixture'
    process.env.NARRATIVE_PROJECT_TITLE = 'Desktop Local Prototype'

    expect(getApiServerConfig()).toMatchObject({
      currentProject: {
        projectId: 'book-signal-arc',
        projectMode: 'demo-fixture',
        projectRoot: '/tmp/local-project',
        projectTitle: 'Desktop Local Prototype',
      },
    })
  })

  it('defaults real-project sessions to openai bindings instead of implicit fixture fallback', () => {
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
      modelProvider: 'openai',
      modelBindings: {
        continuityReviewer: {
          provider: 'openai',
        },
        planner: {
          provider: 'openai',
        },
        sceneProseWriter: {
          provider: 'openai',
        },
        sceneRevision: {
          provider: 'openai',
        },
        summary: {
          provider: 'openai',
        },
      },
      openAiApiKey: undefined,
      openAiModel: undefined,
    })
  })

  it('ignores a global fixture override for real-project sessions unless roles opt into fixture explicitly', () => {
    process.env.NARRATIVE_PROJECT_ROOT = '/tmp/local-project'
    process.env.NARRATIVE_PROJECT_ID = 'book-signal-arc'
    process.env.NARRATIVE_PROJECT_MODE = 'real-project'
    process.env.NARRATIVE_PROJECT_TITLE = 'Signal Arc Desktop'
    process.env.NARRATIVE_MODEL_PROVIDER = 'fixture'
    process.env.NARRATIVE_PLANNER_MODEL_PROVIDER = 'fixture'

    expect(getApiServerConfig()).toMatchObject({
      currentProject: {
        projectMode: 'real-project',
      },
      modelProvider: 'openai',
      modelBindings: {
        continuityReviewer: {
          provider: 'openai',
        },
        planner: {
          provider: 'fixture',
        },
        sceneProseWriter: {
          provider: 'openai',
        },
        sceneRevision: {
          provider: 'openai',
        },
        summary: {
          provider: 'openai',
        },
      },
    })
  })

  it('rejects a PORT value that is not a full integer string', () => {
    process.env.PORT = '12abc'

    expect(() => getApiServerConfig()).toThrowError('PORT must be a full integer string between 0 and 65535')
  })

  it('rejects a PORT value outside the valid port range', () => {
    process.env.PORT = '70000'

    expect(() => getApiServerConfig()).toThrowError('PORT must be a full integer string between 0 and 65535')
  })

  it('reads OpenAI planner config only when provider=openai', () => {
    process.env.NARRATIVE_MODEL_PROVIDER = 'openai'
    process.env.NARRATIVE_OPENAI_MODEL = 'gpt-5.4'
    process.env.OPENAI_API_KEY = 'sk-test'

    expect(getApiServerConfig()).toMatchObject({
      modelBindings: {
        continuityReviewer: {
          apiKey: 'sk-test',
          modelId: 'gpt-5.4',
          provider: 'openai',
        },
        planner: {
          apiKey: 'sk-test',
          modelId: 'gpt-5.4',
          provider: 'openai',
        },
        sceneProseWriter: {
          apiKey: 'sk-test',
          modelId: 'gpt-5.4',
          provider: 'openai',
        },
        sceneRevision: {
          apiKey: 'sk-test',
          modelId: 'gpt-5.4',
          provider: 'openai',
        },
        summary: {
          apiKey: 'sk-test',
          modelId: 'gpt-5.4',
          provider: 'openai',
        },
      },
      modelProvider: 'openai',
      openAiModel: 'gpt-5.4',
      openAiApiKey: 'sk-test',
    })
  })

  it('parses role-specific binding env overrides on top of the legacy global openai fallback', () => {
    process.env.NARRATIVE_MODEL_PROVIDER = 'openai'
    process.env.NARRATIVE_OPENAI_MODEL = 'gpt-5.4'
    process.env.OPENAI_API_KEY = 'sk-global-value'
    process.env.NARRATIVE_SCENE_REVISION_OPENAI_MODEL = 'gpt-5.4-mini'
    process.env.NARRATIVE_SCENE_REVISION_OPENAI_API_KEY = 'sk-revision-value'
    process.env.NARRATIVE_PLANNER_MODEL_PROVIDER = 'fixture'

    expect(getApiServerConfig().modelBindings).toEqual({
      continuityReviewer: {
        apiKey: 'sk-global-value',
        modelId: 'gpt-5.4',
        provider: 'openai',
      },
      planner: {
        provider: 'fixture',
      },
      sceneProseWriter: {
        apiKey: 'sk-global-value',
        modelId: 'gpt-5.4',
        provider: 'openai',
      },
      sceneRevision: {
        apiKey: 'sk-revision-value',
        modelId: 'gpt-5.4-mini',
        provider: 'openai',
      },
      summary: {
        apiKey: 'sk-global-value',
        modelId: 'gpt-5.4',
        provider: 'openai',
      },
    })
  })

  it('ignores OpenAI env when provider stays on fixture', () => {
    process.env.NARRATIVE_OPENAI_MODEL = 'gpt-5.4'
    process.env.OPENAI_API_KEY = 'sk-test'

    expect(getApiServerConfig()).toMatchObject({
      modelProvider: 'fixture',
      openAiModel: undefined,
      openAiApiKey: undefined,
    })
  })

  it('does not throw when provider=openai but model and key are missing for runtime fallback', () => {
    process.env.NARRATIVE_MODEL_PROVIDER = 'openai'

    expect(() => getApiServerConfig()).not.toThrow()
    expect(getApiServerConfig()).toMatchObject({
      modelProvider: 'openai',
      openAiModel: undefined,
      openAiApiKey: undefined,
    })
  })

  it('serializes model bindings without leaking raw secrets', () => {
    process.env.NARRATIVE_MODEL_PROVIDER = 'openai'
    process.env.NARRATIVE_OPENAI_MODEL = 'gpt-5.4'
    process.env.OPENAI_API_KEY = 'sk-secret-value'

    const serialized = serializeModelBindings(getApiServerConfig().modelBindings ?? {})

    expect(serialized.planner).toEqual({
      credentialStatus: {
        configured: true,
        redactedValue: 'sk-...alue',
      },
      modelId: 'gpt-5.4',
      provider: 'openai',
    })
    expect(JSON.stringify(serialized)).not.toContain('sk-secret-value')
  })

  it('rejects an unsupported NARRATIVE_MODEL_PROVIDER value', () => {
    process.env.NARRATIVE_MODEL_PROVIDER = 'anthropic'

    expect(() => getApiServerConfig()).toThrowError(
      'NARRATIVE_MODEL_PROVIDER must be one of: fixture, openai',
    )
  })
})
