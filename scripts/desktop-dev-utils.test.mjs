import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveRendererDevServer } from './desktop-dev-utils.mjs'

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
