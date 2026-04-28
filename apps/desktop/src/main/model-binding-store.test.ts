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
  it('persists role-specific model bindings under the selected project narrative directory', async () => {
    const projectRoot = createProjectRoot()
    const store = new ModelBindingStore()

    await expect(store.readBindings(projectRoot)).resolves.toEqual(DEFAULT_DESKTOP_MODEL_BINDINGS)

    await expect(store.updateBinding(projectRoot, {
      binding: {
        modelId: 'gpt-5.4',
        provider: 'openai',
      },
      role: 'planner',
    })).resolves.toEqual({
      continuityReviewer: {
        provider: 'fixture',
      },
      planner: {
        modelId: 'gpt-5.4',
        provider: 'openai',
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

    await expect(restored.readBindings(projectRoot)).resolves.toEqual({
      continuityReviewer: {
        provider: 'fixture',
      },
      planner: {
        modelId: 'gpt-5.4',
        provider: 'openai',
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

    await expect(
      readFile(path.join(projectRoot, '.narrative', 'model-bindings.json'), 'utf8'),
    ).resolves.toContain('"planner"')
  })

  it('persists the last sanitized connection test result and resets it when bindings change', async () => {
    const projectRoot = createProjectRoot()
    const store = new ModelBindingStore()

    await expect(store.writeConnectionTest(projectRoot, {
      errorCode: 'invalid_key',
      status: 'failed',
      summary: 'OpenAI rejected the configured API key.',
    })).resolves.toEqual({
      errorCode: 'invalid_key',
      status: 'failed',
      summary: 'OpenAI rejected the configured API key.',
    })

    await expect(store.readModelSettingsRecord(projectRoot)).resolves.toEqual({
      bindings: DEFAULT_DESKTOP_MODEL_BINDINGS,
      connectionTest: {
        errorCode: 'invalid_key',
        status: 'failed',
        summary: 'OpenAI rejected the configured API key.',
      },
    })

    await expect(store.updateBinding(projectRoot, {
      binding: {
        modelId: 'gpt-5.4',
        provider: 'openai',
      },
      role: 'planner',
    })).resolves.toEqual({
      continuityReviewer: {
        provider: 'fixture',
      },
      planner: {
        modelId: 'gpt-5.4',
        provider: 'openai',
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
          provider: 'openai',
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
    })
  })
})
