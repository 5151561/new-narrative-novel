import assert from 'node:assert/strict'
import test from 'node:test'

import { createDesktopDevElectronEnv, getRendererBuildArgs, resolveRendererDevServer } from './desktop-dev-utils.mjs'

test('desktop dev starts an owned renderer server on the next free port by default', async () => {
  const result = await resolveRendererDevServer({
    isPortAvailable: async (port) => port !== 5173,
    requestedUrl: 'http://127.0.0.1:5173',
    reuseRenderer: false,
    strictRequestedPort: false,
  })

  assert.deepEqual(result, {
    shouldStartRenderer: true,
    url: 'http://127.0.0.1:5174/',
  })
})

test('desktop dev reuses an existing renderer only when explicitly requested', async () => {
  const result = await resolveRendererDevServer({
    isPortAvailable: async () => false,
    requestedUrl: 'http://127.0.0.1:5173',
    reuseRenderer: true,
    strictRequestedPort: false,
  })

  assert.deepEqual(result, {
    shouldStartRenderer: false,
    url: 'http://127.0.0.1:5173/',
  })
})

test('desktop dev fails instead of changing an explicit renderer URL when its port is busy', async () => {
  await assert.rejects(
    () =>
      resolveRendererDevServer({
        isPortAvailable: async () => false,
        requestedUrl: 'http://127.0.0.1:4188',
        reuseRenderer: false,
        strictRequestedPort: true,
      }),
    /Renderer dev port 4188 is already in use/,
  )
})

test('desktop dev defaults Electron to the freshly rebuilt renderer dist', () => {
  const env = createDesktopDevElectronEnv(
    {
      NARRATIVE_DESKTOP_LOAD_PROD: '0',
      NARRATIVE_RENDERER_DEV_URL: 'http://127.0.0.1:5173/',
      PATH: '/tmp/bin',
    },
    {
      useLiveRenderer: false,
    },
  )

  assert.equal(env.NARRATIVE_DESKTOP_LOAD_PROD, '1')
  assert.equal(env.NARRATIVE_RENDERER_DEV_URL, undefined)
  assert.equal(env.PATH, '/tmp/bin')
})

test('desktop dev can still opt into the live renderer dev server explicitly', () => {
  const env = createDesktopDevElectronEnv(
    {
      NARRATIVE_DESKTOP_LOAD_PROD: '1',
      PATH: '/tmp/bin',
    },
    {
      rendererDevUrl: 'http://127.0.0.1:5174/',
      useLiveRenderer: true,
    },
  )

  assert.equal(env.NARRATIVE_DESKTOP_LOAD_PROD, '0')
  assert.equal(env.NARRATIVE_RENDERER_DEV_URL, 'http://127.0.0.1:5174/')
  assert.equal(env.PATH, '/tmp/bin')
})

test('desktop dev rebuilds renderer assets without blocking on unrelated typecheck errors', () => {
  assert.deepEqual(getRendererBuildArgs(), ['--filter', '@narrative-novel/renderer', 'exec', 'vite', 'build'])
})
