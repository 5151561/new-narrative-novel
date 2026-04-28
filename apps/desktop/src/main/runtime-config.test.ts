import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { createDesktopRuntimeConfig, createLocalApiProcessConfig } from './runtime-config.js'

describe('createLocalApiProcessConfig', () => {
  it('creates the desktop-local runtime config with the selected project identity and expected API URLs', () => {
    expect(createDesktopRuntimeConfig(4888, {
      currentProject: {
        projectId: 'local-project-alpha',
        projectMode: 'real-project',
        runtimeKind: 'real-local-project',
        projectTitle: 'Local Alpha',
      },
    })).toEqual({
      apiBaseUrl: 'http://127.0.0.1:4888/api',
      apiHealthUrl: 'http://127.0.0.1:4888/api/health',
      port: 4888,
      projectId: 'local-project-alpha',
      projectMode: 'real-project',
      runtimeKind: 'real-local-project',
      projectTitle: 'Local Alpha',
      runtimeMode: 'desktop-local',
    })
  })

  it('spawns the API server through the local tsx executable and injects one normalized model settings json payload', () => {
    const config = createLocalApiProcessConfig({
      currentProject: {
        projectId: 'local-project-alpha',
        projectMode: 'real-project',
        projectRoot: '/repo/projects/local-alpha',
        runtimeKind: 'real-local-project',
        projectTitle: 'Local Alpha',
      },
      env: {
        NARRATIVE_MODEL_PROVIDER: 'openai',
        NARRATIVE_PLANNER_OPENAI_API_KEY: 'sk-legacy',
        NARRATIVE_PROJECT_STATE_FILE: '/legacy/prototype-state.json',
        PATH: '/usr/bin',
      },
      modelSettings: {
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
      },
      port: 4888,
      workspaceRoot: '/repo',
    })

    expect(config.command).toBe(path.resolve('/repo/packages/api/node_modules/.bin/tsx'))
    expect(config.args).toEqual(['src/server.ts'])
    expect(config.cwd).toBe(path.resolve('/repo/packages/api'))
    expect(config.env).toMatchObject({
      HOST: '127.0.0.1',
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
      NARRATIVE_PROJECT_ARTIFACT_DIR: path.resolve('/repo/projects/local-alpha/.narrative/artifacts'),
      NARRATIVE_PROJECT_ID: 'local-project-alpha',
      NARRATIVE_PROJECT_MODE: 'real-project',
      NARRATIVE_PROJECT_ROOT: '/repo/projects/local-alpha',
      NARRATIVE_PROJECT_STORE_FILE: path.resolve('/repo/projects/local-alpha/.narrative/project-store.json'),
      NARRATIVE_PROJECT_TITLE: 'Local Alpha',
      NARRATIVE_RUNTIME_KIND: 'real-local-project',
      NARRATIVE_RUNTIME: 'desktop-local',
      PATH: '/usr/bin',
      PORT: '4888',
    })
    expect(config.env.NARRATIVE_MODEL_PROVIDER).toBeUndefined()
    expect(config.env.NARRATIVE_PLANNER_OPENAI_API_KEY).toBeUndefined()
    expect(config.env.OPENAI_API_KEY).toBeUndefined()
    expect(config.env.NARRATIVE_OPENAI_MODEL).toBeUndefined()
    expect(config.env.NARRATIVE_PROJECT_STATE_FILE).toBeUndefined()
  })
})
