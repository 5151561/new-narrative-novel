import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { createDesktopRuntimeConfig, createLocalApiProcessConfig } from './runtime-config.js'

describe('createLocalApiProcessConfig', () => {
  it('creates the desktop-local runtime config with the selected project identity and expected API URLs', () => {
    expect(createDesktopRuntimeConfig(4888, {
      currentProject: {
        projectId: 'local-project-alpha',
        projectMode: 'real-project',
        projectTitle: 'Local Alpha',
      },
    })).toEqual({
      apiBaseUrl: 'http://127.0.0.1:4888/api',
      apiHealthUrl: 'http://127.0.0.1:4888/api/health',
      port: 4888,
      projectId: 'local-project-alpha',
      projectMode: 'real-project',
      projectTitle: 'Local Alpha',
      runtimeMode: 'desktop-local',
    })
  })

  it('spawns the API server through the local tsx executable instead of a pnpm wrapper', () => {
    const config = createLocalApiProcessConfig({
      currentProject: {
        projectId: 'local-project-alpha',
        projectMode: 'real-project',
        projectRoot: '/repo/projects/local-alpha',
        projectTitle: 'Local Alpha',
      },
      env: {
        NARRATIVE_PROJECT_STATE_FILE: '/legacy/prototype-state.json',
        PATH: '/usr/bin',
      },
      modelBindings: {
        continuityReviewer: {
          provider: 'fixture',
        },
        planner: {
          modelId: 'gpt-5.4',
          provider: 'openai',
        },
        sceneProseWriter: {
          modelId: 'gpt-5.4',
          provider: 'openai',
        },
        sceneRevision: {
          modelId: 'gpt-5.4-mini',
          provider: 'openai',
        },
        summary: {
          provider: 'fixture',
        },
      },
      port: 4888,
      providerCredentials: {
        openai: 'sk-secret-value',
      },
      workspaceRoot: '/repo',
    })

    expect(config.command).toBe(path.resolve('/repo/packages/api/node_modules/.bin/tsx'))
    expect(config.args).toEqual(['src/server.ts'])
    expect(config.cwd).toBe(path.resolve('/repo/packages/api'))
    expect(config.env).toMatchObject({
      HOST: '127.0.0.1',
      NARRATIVE_PROJECT_ARTIFACT_DIR: path.resolve('/repo/projects/local-alpha/.narrative/artifacts'),
      NARRATIVE_PROJECT_ID: 'local-project-alpha',
      NARRATIVE_PROJECT_MODE: 'real-project',
      NARRATIVE_PROJECT_ROOT: '/repo/projects/local-alpha',
      NARRATIVE_PROJECT_STORE_FILE: path.resolve('/repo/projects/local-alpha/.narrative/project-store.json'),
      NARRATIVE_PROJECT_TITLE: 'Local Alpha',
      NARRATIVE_MODEL_PROVIDER: 'fixture',
      NARRATIVE_PLANNER_MODEL_PROVIDER: 'openai',
      NARRATIVE_PLANNER_OPENAI_API_KEY: 'sk-secret-value',
      NARRATIVE_PLANNER_OPENAI_MODEL: 'gpt-5.4',
      NARRATIVE_RUNTIME: 'desktop-local',
      NARRATIVE_SCENE_PROSE_WRITER_MODEL_PROVIDER: 'openai',
      NARRATIVE_SCENE_PROSE_WRITER_OPENAI_API_KEY: 'sk-secret-value',
      NARRATIVE_SCENE_PROSE_WRITER_OPENAI_MODEL: 'gpt-5.4',
      NARRATIVE_SCENE_REVISION_MODEL_PROVIDER: 'openai',
      NARRATIVE_SCENE_REVISION_OPENAI_API_KEY: 'sk-secret-value',
      NARRATIVE_SCENE_REVISION_OPENAI_MODEL: 'gpt-5.4-mini',
      NARRATIVE_SUMMARY_MODEL_PROVIDER: 'fixture',
      NARRATIVE_CONTINUITY_REVIEWER_MODEL_PROVIDER: 'fixture',
      PATH: '/usr/bin',
      PORT: '4888',
    })
    expect(config.env.NARRATIVE_PROJECT_STATE_FILE).toBeUndefined()
    expect(config.env.OPENAI_API_KEY).toBeUndefined()
    expect(config.env.NARRATIVE_OPENAI_MODEL).toBeUndefined()
  })
})
