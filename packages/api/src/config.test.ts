import { fileURLToPath } from 'node:url'

import { afterEach, describe, expect, it } from 'vitest'

import { getApiServerConfig } from './config.js'

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
    process.env.NARRATIVE_PROJECT_TITLE = 'Desktop Local Prototype'

    expect(getApiServerConfig()).toMatchObject({
      currentProject: {
        projectId: 'book-signal-arc',
        projectRoot: '/tmp/local-project',
        projectTitle: 'Desktop Local Prototype',
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
      modelProvider: 'openai',
      openAiModel: 'gpt-5.4',
      openAiApiKey: 'sk-test',
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

  it('rejects an unsupported NARRATIVE_MODEL_PROVIDER value', () => {
    process.env.NARRATIVE_MODEL_PROVIDER = 'anthropic'

    expect(() => getApiServerConfig()).toThrowError(
      'NARRATIVE_MODEL_PROVIDER must be one of: fixture, openai',
    )
  })
})
