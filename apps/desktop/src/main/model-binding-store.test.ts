import { mkdtempSync } from 'node:fs'
import { readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { DEFAULT_DESKTOP_MODEL_BINDINGS, ModelBindingStore } from './model-binding-store.js'

const tempDirectories: string[] = []

function createProjectRoot() {
  const directory = mkdtempSync(path.join(tmpdir(), 'model-binding-store-'))
  tempDirectories.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

describe('ModelBindingStore', () => {
  it('persists provider profiles and role-specific model bindings under the selected project narrative directory', async () => {
    const projectRoot = createProjectRoot()
    const store = new ModelBindingStore()

    await expect(store.readModelSettingsRecord(projectRoot)).resolves.toEqual({
      bindings: DEFAULT_DESKTOP_MODEL_BINDINGS,
      connectionTest: {
        status: 'never',
      },
      providers: [],
    })

    await expect(store.saveProviderProfile(projectRoot, {
      baseUrl: 'https://api.deepseek.com/v1',
      id: 'deepseek',
      label: 'DeepSeek',
    })).resolves.toEqual([
      {
        baseUrl: 'https://api.deepseek.com/v1',
        id: 'deepseek',
        label: 'DeepSeek',
      },
    ])

    await expect(store.updateBinding(projectRoot, {
      binding: {
        modelId: 'deepseek-chat',
        provider: 'openai-compatible',
        providerId: 'deepseek',
      },
      role: 'planner',
    })).resolves.toEqual({
      continuityReviewer: {
        provider: 'fixture',
      },
      planner: {
        modelId: 'deepseek-chat',
        provider: 'openai-compatible',
        providerId: 'deepseek',
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
    })

    const restored = new ModelBindingStore()

    await expect(restored.readModelSettingsRecord(projectRoot)).resolves.toEqual({
      bindings: {
        continuityReviewer: {
          provider: 'fixture',
        },
        planner: {
          modelId: 'deepseek-chat',
          provider: 'openai-compatible',
          providerId: 'deepseek',
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
      connectionTest: {
        status: 'never',
      },
      providers: [
        {
          baseUrl: 'https://api.deepseek.com/v1',
          id: 'deepseek',
          label: 'DeepSeek',
        },
      ],
    })

    await expect(
      readFile(path.join(projectRoot, '.narrative', 'model-bindings.json'), 'utf8'),
    ).resolves.toContain('"providers"')
  })

  it('persists the last sanitized connection test result and resets it when providers or bindings change', async () => {
    const projectRoot = createProjectRoot()
    const store = new ModelBindingStore()

    await store.saveProviderProfile(projectRoot, {
      baseUrl: 'https://api.deepseek.com/v1',
      id: 'deepseek',
      label: 'DeepSeek',
    })
    await expect(store.writeConnectionTest(projectRoot, {
      errorCode: 'invalid_key',
      status: 'failed',
      summary: 'OpenAI rejected the configured API key.',
    })).resolves.toEqual({
      errorCode: 'invalid_key',
      status: 'failed',
      summary: 'OpenAI rejected the configured API key.',
    })

    await expect(store.updateBinding(projectRoot, {
      binding: {
        modelId: 'gpt-5.4',
        provider: 'openai-compatible',
        providerId: 'deepseek',
      },
      role: 'planner',
    })).resolves.toEqual({
      continuityReviewer: {
        provider: 'fixture',
      },
      planner: {
        modelId: 'gpt-5.4',
        provider: 'openai-compatible',
        providerId: 'deepseek',
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
    })

    await expect(store.readModelSettingsRecord(projectRoot)).resolves.toEqual({
      bindings: {
        continuityReviewer: {
          provider: 'fixture',
        },
        planner: {
          modelId: 'gpt-5.4',
          provider: 'openai-compatible',
          providerId: 'deepseek',
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
      connectionTest: {
        status: 'never',
      },
      providers: [
        {
          baseUrl: 'https://api.deepseek.com/v1',
          id: 'deepseek',
          label: 'DeepSeek',
        },
      ],
    })

    await expect(store.writeConnectionTest(projectRoot, {
      errorCode: 'invalid_key',
      status: 'failed',
      summary: 'OpenAI rejected the configured API key.',
    })).resolves.toEqual({
      errorCode: 'invalid_key',
      status: 'failed',
      summary: 'OpenAI rejected the configured API key.',
    })

    await expect(store.deleteProviderProfile(projectRoot, 'deepseek')).resolves.toEqual([])
    await expect(store.readModelSettingsRecord(projectRoot)).resolves.toEqual({
      bindings: DEFAULT_DESKTOP_MODEL_BINDINGS,
      connectionTest: {
        status: 'never',
      },
      providers: [],
    })
  })

  it('rejects reserved provider profile ids that are owned by legacy migration slots', async () => {
    const projectRoot = createProjectRoot()
    const store = new ModelBindingStore()

    await expect(store.saveProviderProfile(projectRoot, {
      baseUrl: 'https://api.openai.com/v1',
      id: 'openai',
      label: 'OpenAI Legacy',
    })).rejects.toThrow('Provider profile id openai is reserved.')

    await expect(store.saveProviderProfile(projectRoot, {
      baseUrl: 'https://api.openai.com/v1',
      id: 'openai-default',
      label: 'OpenAI Default',
    })).rejects.toThrow('Provider profile id openai-default is reserved.')
  })
})
