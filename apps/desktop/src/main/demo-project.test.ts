import { mkdtempSync, readFileSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { readOrCreateDemoProjectSession } from './demo-project.js'

const tempDirectories: string[] = []

function createUserDataPath() {
  const directory = mkdtempSync(path.join(tmpdir(), 'demo-project-'))
  tempDirectories.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(tempDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })))
})

describe('readOrCreateDemoProjectSession', () => {
  it('creates the dedicated Signal Arc demo session inside Electron userData with a stable identity', async () => {
    const userDataPath = createUserDataPath()

    const session = await readOrCreateDemoProjectSession({
      now: () => '2026-04-28T00:00:00.000Z',
      userDataPath,
    })

    expect(session).toEqual({
      projectId: 'book-signal-arc',
      projectMode: 'demo-fixture',
      projectRoot: path.join(userDataPath, 'demo-projects', 'book-signal-arc'),
      projectTitle: 'Signal Arc Demo',
    })

    expect(JSON.parse(readFileSync(path.join(session.projectRoot, 'narrative.project.json'), 'utf8'))).toEqual({
      bootstrap: {
        source: 'signal-arc-demo-template-v1',
      },
      createdAt: '2026-04-28T00:00:00.000Z',
      projectId: 'book-signal-arc',
      schemaVersion: 1,
      store: {
        artifactDir: '.narrative/artifacts',
        dataFile: '.narrative/project-store.json',
        schemaVersion: 1,
      },
      title: 'Signal Arc Demo',
      updatedAt: '2026-04-28T00:00:00.000Z',
    })
  })

  it('reuses the existing dedicated demo session path instead of drifting back to the repo workspace root', async () => {
    const userDataPath = createUserDataPath()

    const firstSession = await readOrCreateDemoProjectSession({
      now: () => '2026-04-28T00:00:00.000Z',
      userDataPath,
    })
    const secondSession = await readOrCreateDemoProjectSession({
      now: () => '2026-04-29T00:00:00.000Z',
      userDataPath,
    })

    expect(secondSession).toEqual(firstSession)
    expect(secondSession.projectRoot).toBe(path.join(userDataPath, 'demo-projects', 'book-signal-arc'))
  })
})
