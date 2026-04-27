import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { createDesktopRuntimeConfig, createLocalApiProcessConfig } from './runtime-config.js'

describe('createLocalApiProcessConfig', () => {
  it('creates the desktop-local runtime config with the expected API and health URLs', () => {
    expect(createDesktopRuntimeConfig(4888)).toEqual({
      apiBaseUrl: 'http://127.0.0.1:4888/api',
      apiHealthUrl: 'http://127.0.0.1:4888/api/health',
      port: 4888,
      runtimeMode: 'desktop-local',
    })
  })

  it('spawns the API server through the local tsx executable instead of a pnpm wrapper', () => {
    const config = createLocalApiProcessConfig({
      env: {
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
      NARRATIVE_RUNTIME: 'desktop-local',
      PATH: '/usr/bin',
      PORT: '4888',
    })
  })
})
