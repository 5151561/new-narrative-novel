import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { createTestServer } from './test/support/test-server.js'

describe('fixture API server selected local project reset', () => {
  const tempDirectories = [] as string[]

  afterEach(async () => {
    await Promise.all(
      tempDirectories.splice(0).map((directory) => rm(directory, {
        recursive: true,
        force: true,
      })),
    )
  })

  async function createProjectStoreFilePath() {
    const directory = await mkdtemp(path.join(tmpdir(), 'narrative-api-local-project-reset-'))
    tempDirectories.push(directory)
    return path.join(directory, 'local-project-store.json')
  }

  it.skip('resets a selected non-fixture local project through the local store without fixture-seed dependence', async () => {
    const projectStoreFilePath = await createProjectStoreFilePath()
    const server = createTestServer({
      projectStoreFilePath,
      configOverrides: {
        currentProject: {
          projectId: 'local-project-alpha',
          projectMode: 'real-project',
          projectRoot: '/tmp/local-project-alpha',
          projectTitle: 'Local Project Alpha',
        },
      },
    })

    try {
      const decisionResponse = await server.app.inject({
        method: 'PUT',
        url: '/api/projects/local-project-alpha/books/book-signal-arc/review-decisions/compare-delta-scene-midnight-platform',
        payload: {
          bookId: 'book-signal-arc',
          issueId: 'compare-delta-scene-midnight-platform',
          issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
          status: 'reviewed',
          note: 'This note should disappear after selected-project reset.',
        },
      })
      expect(decisionResponse.statusCode).toBe(200)

      const resetResponse = await server.app.inject({
        method: 'POST',
        url: '/api/projects/local-project-alpha/runtime/reset',
      })
      expect(resetResponse.statusCode).toBe(204)

      const [decisionListResponse, runtimeInfoResponse] = await Promise.all([
        server.app.inject({
          method: 'GET',
          url: '/api/projects/local-project-alpha/books/book-signal-arc/review-decisions',
        }),
        server.app.inject({
          method: 'GET',
          url: '/api/projects/local-project-alpha/runtime-info',
        }),
      ])

      expect(decisionListResponse.statusCode).toBe(200)
      expect(decisionListResponse.json()).toEqual([
        expect.objectContaining({
          issueId: 'compare-delta-scene-midnight-platform',
          status: 'deferred',
          note: 'Hold until the fixture-backed review routes land.',
        }),
      ])

      expect(runtimeInfoResponse.statusCode).toBe(200)
      expect(runtimeInfoResponse.json()).toMatchObject({
        projectId: 'local-project-alpha',
        projectTitle: 'Local Project Alpha',
        summary: 'Connected to local project store v1.',
      })
    } finally {
      await server.app.close()
    }
  })
})
