import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { LocalApiSupervisor, type LocalApiChildProcess, type LocalApiSpawnConfig } from './local-api-supervisor.js'

class FakeLocalApiChild extends EventEmitter implements LocalApiChildProcess {
  stdout = new PassThrough()
  stderr = new PassThrough()
  killed = false

  kill(): boolean {
    this.killed = true
    return true
  }
}

function okResponse() {
  return {
    ok: true,
    status: 200,
  } as Response
}

afterEach(() => {
  vi.useRealTimers()
})

describe('LocalApiSupervisor', () => {
  it('spawns the API process with one normalized model settings payload and marks it ready after health succeeds', async () => {
    const child = new FakeLocalApiChild()
    const restartedChild = new FakeLocalApiChild()
    const children = [child, restartedChild]
    const spawnConfigs: LocalApiSpawnConfig[] = []
    const fetch = vi.fn(async () => okResponse())
    const supervisor = new LocalApiSupervisor({
      fetch,
      findAvailablePort: async () => 4888,
      getModelSettings: async () => ({
        bindings: {
          continuityReviewer: {
            provider: 'fixture',
          },
          planner: {
            modelId: 'gpt-5.4',
            provider: 'openai-compatible',
            providerId: 'openai-default',
          },
          sceneProseWriter: {
            modelId: 'deepseek-chat',
            provider: 'openai-compatible',
            providerId: 'deepseek',
          },
          sceneRevision: {
            provider: 'fixture',
          },
          summary: {
            provider: 'fixture',
          },
        },
        providers: [
          {
            baseUrl: 'https://api.openai.com/v1',
            id: 'openai-default',
            label: 'OpenAI',
          },
          {
            baseUrl: 'https://api.deepseek.com/v1',
            id: 'deepseek',
            label: 'DeepSeek',
          },
        ],
      }),
      getProviderCredential: async (providerId) => {
        if (providerId === 'openai-default') {
          return 'sk-openai'
        }

        if (providerId === 'deepseek') {
          return 'sk-deepseek'
        }

        return null
      },
      getCurrentProject: () => ({
        projectId: 'local-project-alpha',
        projectMode: 'real-project',
        projectRoot: '/tmp/local-project',
        projectTitle: 'Desktop Local Project',
      }),
      sleep: async () => {},
      spawnLocalApi: (config) => {
        spawnConfigs.push(config)
        const nextChild = children.shift()
        if (!nextChild) {
          throw new Error('unexpected extra local API spawn')
        }

        return nextChild
      },
    })

    const snapshot = await supervisor.start()
    child.stdout.write('api ready\n')

    expect(snapshot.status).toBe('ready')
    expect(spawnConfigs).toHaveLength(1)
    expect(spawnConfigs[0]?.env).toMatchObject({
      NARRATIVE_MODEL_SETTINGS_JSON: JSON.stringify({
        bindings: {
          continuityReviewer: {
            provider: 'fixture',
          },
          planner: {
            modelId: 'gpt-5.4',
            provider: 'openai-compatible',
            providerId: 'openai-default',
          },
          sceneProseWriter: {
            modelId: 'deepseek-chat',
            provider: 'openai-compatible',
            providerId: 'deepseek',
          },
          sceneRevision: {
            provider: 'fixture',
          },
          summary: {
            provider: 'fixture',
          },
        },
        providers: [
          {
            apiKey: 'sk-openai',
            baseUrl: 'https://api.openai.com/v1',
            id: 'openai-default',
            label: 'OpenAI',
          },
          {
            apiKey: 'sk-deepseek',
            baseUrl: 'https://api.deepseek.com/v1',
            id: 'deepseek',
            label: 'DeepSeek',
          },
        ],
      }),
      NARRATIVE_PROJECT_ID: 'local-project-alpha',
      NARRATIVE_RUNTIME: 'desktop-local',
      PORT: '4888',
    })
    expect(spawnConfigs[0]?.env.NARRATIVE_PLANNER_OPENAI_API_KEY).toBeUndefined()
    expect(spawnConfigs[0]?.env.OPENAI_API_KEY).toBeUndefined()
    await expect(supervisor.restart()).resolves.toMatchObject({
      runtimeConfig: {
        projectId: 'local-project-alpha',
      },
      status: 'ready',
    })
    expect(child.killed).toBe(true)
  })
})
