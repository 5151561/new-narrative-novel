import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { createDesktopRuntimeConfig, createLocalApiProcessConfig } from './runtime-config.js'

describe('createLocalApiProcessConfig', () => {
  it('creates the desktop-local runtime config with the selected project identity and expected API URLs', () => {
    expect(createDesktopRuntimeConfig(4888, {
      currentProject: {
        projectId: 'local-project-alpha',
        projectTitle: 'Local Alpha',
      },
    })).toEqual({
      apiBaseUrl: 'http://127.0.0.1:4888/api',
      apiHealthUrl: 'http://127.0.0.1:4888/api/health',
      port: 4888,
      projectId: 'local-project-alpha',
      projectTitle: 'Local Alpha',
      runtimeMode: 'desktop-local',
    })
  })

  it('spawns the API server through the local tsx executable instead of a pnpm wrapper', () => {
    const config = createLocalApiProcessConfig({
      currentProject: {
        projectId: 'local-project-alpha',
        projectRoot: '/repo/projects/local-alpha',
        projectTitle: 'Local Alpha',
      },
      env: {
        NARRATIVE_PROJECT_STATE_FILE: '/legacy/prototype-state.json',
        PATH: '/usr/bin',
      },
      port: 4888,
      workspaceRoot: '/repo',
    })

    expect(config.command).toBe(path.resolve('/repo/packages/api/node_modules/.bin/tsx'))
    expect(config.args).toEqual(['src/server.ts'])
    expect(config.cwd).toBe(path.resolve('/repo/packages/api'))
    expect(config.env).toMatchObject({
      HOST: '127.0.0.1',
      NARRATIVE_PROJECT_ARTIFACT_DIR: path.resolve('/repo/projects/local-alpha/.narrative/artifacts'),
      NARRATIVE_PROJECT_ID: 'local-project-alpha',
      NARRATIVE_PROJECT_ROOT: '/repo/projects/local-alpha',
      NARRATIVE_PROJECT_STORE_FILE: path.resolve('/repo/projects/local-alpha/.narrative/project-store.json'),
      NARRATIVE_PROJECT_TITLE: 'Local Alpha',
      NARRATIVE_RUNTIME: 'desktop-local',
      PATH: '/usr/bin',
      PORT: '4888',
    })
    expect(config.env.NARRATIVE_PROJECT_STATE_FILE).toBeUndefined()
  })
})
