import { access, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { signalArcBookId, signalArcChapterIds, signalArcCanonicalSceneIds } from '@narrative-novel/fixture-seed'

import { createTestServer } from './test/support/test-server.js'

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

  it('bootstraps a blank real project template without SignalArc fixture bleed', async () => {
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
        modelBindings: {
          continuityReviewer: { provider: 'fixture' },
          planner: { provider: 'fixture' },
          sceneProseWriter: { provider: 'fixture' },
          sceneRevision: { provider: 'fixture' },
          summary: { provider: 'fixture' },
        },
        modelProvider: 'fixture',
      },
    } as const
    const server = createTestServer(serverOptions)

    try {
      await server.app.ready()

      const [currentProjectResponse, runtimeInfoResponse] = await Promise.all([
        server.app.inject({
          method: 'GET',
          url: '/api/current-project',
        }),
        server.app.inject({
          method: 'GET',
          url: '/api/projects/local-project-alpha/runtime-info',
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
        runtimeKind: 'real-local-project',
        source: 'api',
        status: 'healthy',
        versionLabel: 'local-project-store-v1',
      })

      const bookId = 'book-local-project-alpha'
      const bookResponse = await server.app.inject({
        method: 'GET',
        url: `/api/projects/local-project-alpha/books/${bookId}/structure`,
      })
      expect(bookResponse.statusCode).toBe(200)
      expect(bookResponse.json()).toMatchObject({
        bookId,
        chapterIds: [],
      })
      expect(bookResponse.json().bookId).not.toBe(signalArcBookId)

      const signalArcBookResponse = await server.app.inject({
        method: 'GET',
        url: `/api/projects/local-project-alpha/books/${signalArcBookId}/structure`,
      })
      expect(signalArcBookResponse.statusCode).toBe(200)
      expect(signalArcBookResponse.json()).toBeNull()

      for (const chapterId of signalArcChapterIds) {
        const chapterResponse = await server.app.inject({
          method: 'GET',
          url: `/api/projects/local-project-alpha/chapters/${chapterId}/structure`,
        })
        expect(chapterResponse.statusCode).toBe(200)
        expect(chapterResponse.json()).toBeNull()
      }

      for (const sceneId of signalArcCanonicalSceneIds) {
        const sceneResponse = await server.app.inject({
          method: 'GET',
          url: `/api/projects/local-project-alpha/scenes/${sceneId}/workspace`,
        })
        expect(sceneResponse.statusCode).toBe(404)
      }

      const storeContents = await readFile(projectStoreFilePath, 'utf8')
      const storeRecord = JSON.parse(storeContents) as Record<string, unknown>
      const data = (storeRecord.project as Record<string, unknown>).data as Record<string, unknown>

      expect(data.books as Record<string, unknown>).toHaveProperty(bookId)
      expect(data.books as Record<string, unknown>).not.toHaveProperty(signalArcBookId)
      expect(data.chapters as Record<string, unknown>).toEqual({})
      expect(data.scenes as Record<string, unknown>).toEqual({})
    } finally {
      await server.app.close()
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
