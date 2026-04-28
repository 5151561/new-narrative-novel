import { access, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { createTestServer } from './test/support/test-server.js'

async function expectSceneLatestRunToResolve(
  inject: (options: { method: string; url: string }) => Promise<{ statusCode: number; json(): any }>,
  projectId: string,
  sceneId: string,
) {
  const sceneResponse = await inject({
    method: 'GET',
    url: `/api/projects/${projectId}/scenes/${sceneId}/workspace`,
  })
  expect(sceneResponse.statusCode).toBe(200)

  const scene = sceneResponse.json() as { latestRunId?: string }
  if (!scene.latestRunId) {
    expect(scene).not.toHaveProperty('latestRunId')
    return
  }

  const runResponse = await inject({
    method: 'GET',
    url: `/api/projects/${projectId}/runs/${scene.latestRunId}`,
  })
  expect(runResponse.statusCode).toBe(200)
  expect(runResponse.json()).toMatchObject({
    id: scene.latestRunId,
  })
}

describe('fixture API server selected local project store', () => {
  const tempDirectories = [] as string[]

  afterEach(async () => {
    await Promise.all(
      tempDirectories.splice(0).map((directory) => rm(directory, {
        recursive: true,
        force: true,
      })),
    )
  })

  async function createProjectStorePaths() {
    const directory = await mkdtemp(path.join(tmpdir(), 'narrative-api-local-project-store-'))
    tempDirectories.push(directory)

    return {
      projectStoreFilePath: path.join(directory, 'local-project-store.json'),
      projectArtifactDirPath: path.join(directory, 'artifacts'),
    }
  }

  it('bootstraps, persists, and resets a selected non-fixture local project store across fresh servers', async () => {
    const { projectStoreFilePath, projectArtifactDirPath } = await createProjectStorePaths()
    const serverOptions = {
      projectStoreFilePath,
      projectArtifactDirPath,
      configOverrides: {
        currentProject: {
          projectId: 'local-project-alpha',
          projectMode: 'real-project',
          projectRoot: '/tmp/local-project-alpha',
          projectTitle: 'Local Project Alpha',
        },
      },
    } as const
    const firstServer = createTestServer(serverOptions)

    try {
      const [currentProjectResponse, runtimeInfoResponse, bookResponse, chapterResponse, sceneResponse] = await Promise.all([
        firstServer.app.inject({
          method: 'GET',
          url: '/api/current-project',
        }),
        firstServer.app.inject({
          method: 'GET',
          url: '/api/projects/local-project-alpha/runtime-info',
        }),
        firstServer.app.inject({
          method: 'GET',
          url: '/api/projects/local-project-alpha/books/book-signal-arc/structure',
        }),
        firstServer.app.inject({
          method: 'GET',
          url: '/api/projects/local-project-alpha/chapters/chapter-signals-in-rain/structure',
        }),
        firstServer.app.inject({
          method: 'GET',
          url: '/api/projects/local-project-alpha/scenes/scene-midnight-platform/workspace',
        }),
      ])

      expect(currentProjectResponse.statusCode).toBe(200)
      expect(currentProjectResponse.json()).toEqual({
        projectId: 'local-project-alpha',
        projectMode: 'real-project',
        runtimeKind: 'real-local-project',
        projectTitle: 'Local Project Alpha',
      })

      expect(runtimeInfoResponse.statusCode).toBe(200)
      expect(runtimeInfoResponse.json()).toMatchObject({
        projectId: 'local-project-alpha',
        projectTitle: 'Local Project Alpha',
        source: 'api',
        status: 'healthy',
        versionLabel: 'local-project-store-v1',
      })

      expect(bookResponse.statusCode).toBe(200)
      expect(bookResponse.json()).toMatchObject({
        bookId: 'book-signal-arc',
        chapterIds: ['chapter-signals-in-rain', 'chapter-open-water-signals'],
      })

      expect(chapterResponse.statusCode).toBe(200)
      expect(chapterResponse.json().scenes).toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: 'scene-midnight-platform',
          order: 1,
        }),
      ]))

      expect(sceneResponse.statusCode).toBe(200)
      expect(sceneResponse.json()).toMatchObject({
        id: 'scene-midnight-platform',
        chapterId: 'chapter-signals-in-rain',
      })

      await expectSceneLatestRunToResolve(
        firstServer.app.inject.bind(firstServer.app),
        'local-project-alpha',
        'scene-midnight-platform',
      )

      const startResponse = await firstServer.app.inject({
        method: 'POST',
        url: '/api/projects/local-project-alpha/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'rewrite',
          note: 'Persist accepted local project prose across restart.',
        },
      })
      expect(startResponse.statusCode).toBe(200)

      const reviewResponse = await firstServer.app.inject({
        method: 'POST',
        url: `/api/projects/local-project-alpha/runs/${startResponse.json().id}/review-decisions`,
        payload: {
          reviewId: startResponse.json().pendingReviewId,
          decision: 'accept',
        },
      })
      expect(reviewResponse.statusCode).toBe(200)
    } finally {
      await firstServer.app.close()
    }

    const secondServer = createTestServer(serverOptions)

    try {
      const [proseResponse, chapterResponse, assemblyResponse, runtimeInfoResponse] = await Promise.all([
        secondServer.app.inject({
          method: 'GET',
          url: '/api/projects/local-project-alpha/scenes/scene-midnight-platform/prose',
        }),
        secondServer.app.inject({
          method: 'GET',
          url: '/api/projects/local-project-alpha/chapters/chapter-signals-in-rain/structure',
        }),
        secondServer.app.inject({
          method: 'GET',
          url: '/api/projects/local-project-alpha/books/book-signal-arc/draft-assembly',
        }),
        secondServer.app.inject({
          method: 'GET',
          url: '/api/projects/local-project-alpha/runtime-info',
        }),
      ])

      expect(runtimeInfoResponse.statusCode).toBe(200)
      expect(runtimeInfoResponse.json()).toMatchObject({
        projectId: 'local-project-alpha',
        projectTitle: 'Local Project Alpha',
        versionLabel: 'local-project-store-v1',
      })

      expect(proseResponse.statusCode).toBe(200)
      expect(proseResponse.json()).toMatchObject({
        sceneId: 'scene-midnight-platform',
        proseDraft: expect.stringContaining('Midnight Platform opens from the accepted run artifact'),
        traceSummary: {
          sourcePatchId: 'canon-patch-scene-midnight-platform-001',
        },
      })

      expect(chapterResponse.statusCode).toBe(200)
      expect(chapterResponse.json().scenes.find((scene: { id: string }) => scene.id === 'scene-midnight-platform')).toMatchObject({
        id: 'scene-midnight-platform',
        proseStatusLabel: {
          en: 'Updated',
          'zh-CN': '已更新',
        },
      })

      expect(assemblyResponse.statusCode).toBe(200)
      const assemblyScene = assemblyResponse
        .json()
        .chapters
        .flatMap((chapter: { scenes: Array<{ sceneId: string; proseDraft?: string }> }) => chapter.scenes)
        .find((scene: { sceneId: string }) => scene.sceneId === 'scene-midnight-platform')
      expect(assemblyScene).toMatchObject({
        sceneId: 'scene-midnight-platform',
        proseDraft: expect.stringContaining('Midnight Platform opens from the accepted run artifact'),
      })

      const resetResponse = await secondServer.app.inject({
        method: 'POST',
        url: '/api/projects/local-project-alpha/runtime/reset',
      })
      expect(resetResponse.statusCode).toBe(204)

      const [currentProjectAfterReset, runtimeInfoAfterReset, proseAfterReset] = await Promise.all([
        secondServer.app.inject({
          method: 'GET',
          url: '/api/current-project',
        }),
        secondServer.app.inject({
          method: 'GET',
          url: '/api/projects/local-project-alpha/runtime-info',
        }),
        secondServer.app.inject({
          method: 'GET',
          url: '/api/projects/local-project-alpha/scenes/scene-midnight-platform/prose',
        }),
      ])

      expect(currentProjectAfterReset.statusCode).toBe(200)
      expect(currentProjectAfterReset.json()).toEqual({
        projectId: 'local-project-alpha',
        projectMode: 'real-project',
        runtimeKind: 'real-local-project',
        projectTitle: 'Local Project Alpha',
      })

      expect(runtimeInfoAfterReset.statusCode).toBe(200)
      expect(runtimeInfoAfterReset.json()).toMatchObject({
        projectId: 'local-project-alpha',
        projectTitle: 'Local Project Alpha',
        summary: 'Connected to local project store v1.',
      })

      expect(proseAfterReset.statusCode).toBe(200)
      expect(proseAfterReset.json()).toMatchObject({
        sceneId: 'scene-midnight-platform',
        statusLabel: 'Draft ready for review',
        traceSummary: {
          sourcePatchId: 'patch-midnight-platform-001',
        },
      })

      await expectSceneLatestRunToResolve(
        secondServer.app.inject.bind(secondServer.app),
        'local-project-alpha',
        'scene-midnight-platform',
      )
    } finally {
      await secondServer.app.close()
    }
  })

  it('does not write a local project store when fixture mode has no selected current project', async () => {
    const { projectStoreFilePath, projectArtifactDirPath } = await createProjectStorePaths()
    const server = createTestServer({
      projectStoreFilePath,
      projectArtifactDirPath,
      configOverrides: {
        currentProject: undefined,
      },
    })

    try {
      const response = await server.app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/runtime-info',
      })
      expect(response.statusCode).toBe(200)
    } finally {
      await server.app.close()
    }

    await expect(access(projectStoreFilePath)).rejects.toMatchObject({
      code: 'ENOENT',
    })
  })
})
