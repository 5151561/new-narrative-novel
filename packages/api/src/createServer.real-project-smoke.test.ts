import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { signalArcBookId, signalArcChapterIds } from '@narrative-novel/fixture-seed'

import { createTestServer, withTestServer } from './test/support/test-server.js'

describe('real-project smoke test (fixture-backed)', () => {
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
    const directory = await mkdtemp(path.join(tmpdir(), 'narrative-api-smoke-test-'))
    tempDirectories.push(directory)

    return {
      projectStoreFilePath: path.join(directory, 'local-project-store.json'),
      projectArtifactDirPath: path.join(directory, 'artifacts'),
    }
  }

  it('runs the full project lifecycle: project info, book structure, chapter structure, scene workspace, scene setup patch, and markdown export', async () => {
    const { projectStoreFilePath, projectArtifactDirPath } = await createProjectStorePaths()
    const server = createTestServer({
      projectStoreFilePath,
      projectArtifactDirPath,
      configOverrides: {
        currentProject: {
          projectId: 'book-signal-arc',
          projectMode: 'demo-fixture',
          projectRoot: '/tmp/narrative-api-smoke-test-project',
          projectTitle: 'Signal Arc',
        },
        modelProvider: 'fixture',
      },
    })

    try {
      await server.app.ready()

      // 1. Verify current project
      const currentProjectResponse = await server.app.inject({
        method: 'GET',
        url: '/api/current-project',
      })
      expect(currentProjectResponse.statusCode).toBe(200)
      expect(currentProjectResponse.json()).toMatchObject({
        projectId: 'book-signal-arc',
        projectMode: 'demo-fixture',
        runtimeKind: 'fixture-demo',
        projectTitle: 'Signal Arc',
      })

      // 2. Get the book structure
      const bookResponse = await server.app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/books/${signalArcBookId}/structure`,
      })
      expect(bookResponse.statusCode).toBe(200)
      const book = bookResponse.json()
      expect(book).toMatchObject({
        bookId: signalArcBookId,
        title: { en: 'Signal Arc' },
      })
      expect(book.chapterIds.length).toBeGreaterThan(0)

      // 3. Get chapter structure for the first chapter
      const firstChapterId = signalArcChapterIds[0]!
      const chapterResponse = await server.app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/chapters/${firstChapterId}/structure`,
      })
      expect(chapterResponse.statusCode).toBe(200)
      const chapter = chapterResponse.json()
      expect(chapter).toMatchObject({
        chapterId: firstChapterId,
      })
      expect(chapter.title.en).toBeTruthy()
      expect(chapter.scenes.length).toBeGreaterThan(0)

      const firstSceneId = chapter.scenes[0].id

      // 4. Get scene workspace
      const workspaceResponse = await server.app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/scenes/${firstSceneId}/workspace`,
      })
      expect(workspaceResponse.statusCode).toBe(200)
      expect(workspaceResponse.json()).toMatchObject({
        id: firstSceneId,
        chapterId: firstChapterId,
      })

      // 5. Get scene setup, then edit it
      const setupResponse = await server.app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/scenes/${firstSceneId}/setup`,
      })
      expect(setupResponse.statusCode).toBe(200)
      const originalSetup = setupResponse.json()
      expect(originalSetup).toMatchObject({
        sceneId: firstSceneId,
      })

      const patchedSetup = {
        ...originalSetup,
        identity: {
          ...originalSetup.identity,
          title: 'Smoke Test: Midnight Platform (Modified)',
          summary: 'Updated via real-project smoke test.',
        },
      }

      const patchResponse = await server.app.inject({
        method: 'PATCH',
        url: `/api/projects/book-signal-arc/scenes/${firstSceneId}/setup`,
        payload: patchedSetup,
      })
      expect(patchResponse.statusCode).toBe(204)

      // Verify the setup was updated
      const updatedSetupResponse = await server.app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/scenes/${firstSceneId}/setup`,
      })
      expect(updatedSetupResponse.statusCode).toBe(200)
      expect(updatedSetupResponse.json()).toMatchObject({
        sceneId: firstSceneId,
        identity: {
          title: 'Smoke Test: Midnight Platform (Modified)',
          summary: 'Updated via real-project smoke test.',
        },
      })

      // 6. Export markdown and verify it contains the book/chapter/scene titles
      const bookTitle = book.title.en
      const chapterTitle = chapter.title.en

      const artifactResponse = await server.app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/books/${signalArcBookId}/export-artifacts`,
        payload: {
          bookId: signalArcBookId,
          exportProfileId: 'export-epub-manuscript',
          checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
          format: 'markdown',
          filename: 'smoke-test-export.md',
          mimeType: 'text/markdown',
          title: 'Smoke Test Export',
          summary: 'Generated by the real-project smoke test.',
          content: `# ${bookTitle}\n\n## ${chapterTitle}\n\n### Midnight Platform (Modified)\n\nThis is a smoke test export.`,
          sourceSignature: 'smoke-test:real-project',
          chapterCount: 1,
          sceneCount: 1,
          wordCount: 10,
          readinessSnapshot: {
            status: 'ready',
            blockerCount: 0,
            warningCount: 0,
            infoCount: 0,
          },
          reviewGateSnapshot: {
            openBlockerCount: 0,
            checkedFixCount: 0,
            blockedFixCount: 0,
            staleFixCount: 0,
          },
        },
      })
      expect(artifactResponse.statusCode).toBe(200)
      const artifact = artifactResponse.json()
      expect(artifact.content).toContain(bookTitle)
      expect(artifact.content).toContain(chapterTitle)
      expect(artifact.content).toContain('Midnight Platform')
    } finally {
      await server.app.close()
    }
  })

  it('exports a project via the export-zip endpoint', async () => {
    await withTestServer(async ({ app }) => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/export-zip',
      })
      expect(response.statusCode).toBe(200)
      expect(response.headers['content-type']).toContain('application/json')
      expect(response.headers['content-disposition']).toContain('attachment')
      expect(response.headers['content-disposition']).toContain('project-export-book-signal-arc')

      const exportData = response.json()
      expect(exportData).toMatchObject({
        kind: 'narrative-project-export',
        schemaVersion: 1,
        projectId: 'book-signal-arc',
        manifest: {
          projectTitle: 'Signal Arc',
        },
      })

      // Verify the README is included
      expect(exportData.readme).toBeTruthy()
      expect(exportData.readme).toContain('Narrative Novel Project Backup')
      expect(exportData.readme).toContain('Raw OpenAI API keys')
      expect(exportData.readme).toContain('.narrative/ directory')

      // Verify store data is sanitized (no raw secrets)
      const storeJson = JSON.stringify(exportData.store)
      expect(storeJson).not.toContain('sk-')
      expect(storeJson).not.toContain('rawSecret')

      // Verify manifest has book info
      expect(exportData.manifest.books).toHaveProperty('book-signal-arc')
      expect(exportData.manifest.books['book-signal-arc'].title).toBe('Signal Arc')
      expect(exportData.manifest.books['book-signal-arc'].chapterCount).toBeGreaterThan(0)
    })
  })

  it('returns 500 for export-zip of an unknown project', async () => {
    await withTestServer(async ({ app }) => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/projects/nonexistent-project/export-zip',
      })
      expect(response.statusCode).toBe(500)
    })
  })
})
