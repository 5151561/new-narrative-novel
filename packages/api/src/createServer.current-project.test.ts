import { describe, expect, it } from 'vitest'

import { withTestServer } from './test/support/test-server.js'

describe('fixture API server current project bootstrap route', () => {
  it('exposes the selected desktop project session through a narrow bootstrap read', async () => {
    await withTestServer(async ({ app }) => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/current-project',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        projectId: 'book-signal-arc',
        projectMode: 'demo-fixture',
        runtimeKind: 'fixture-demo',
        projectTitle: 'Desktop Local Prototype',
      })
    }, {
      configOverrides: {
        currentProject: {
          projectId: 'book-signal-arc',
          projectMode: 'demo-fixture',
          projectRoot: '/tmp/desktop-local-prototype',
          projectTitle: 'Desktop Local Prototype',
        },
      },
    })
  })
})
