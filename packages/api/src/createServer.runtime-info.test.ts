import { describe, expect, it } from 'vitest'

import { withTestServer } from './test/support/test-server.js'

describe('fixture API server runtime info surfaces', () => {
  it('serves /healthz', async () => {
    await withTestServer(async ({ app }) => {
      const response = await app.inject({
        method: 'GET',
        url: '/healthz',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ ok: true })
    })
  })

  it('returns project runtime info from the fixture repository', async () => {
    await withTestServer(async ({ app }) => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/runtime-info',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchObject({
        projectId: 'book-signal-arc',
        source: 'api',
        status: 'healthy',
        capabilities: {
          read: true,
          write: true,
          runEvents: true,
        },
      })
    })
  })
})
