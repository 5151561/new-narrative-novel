import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { openProjectWithDialog, readOrInitializeProjectSession } from './project-picker.js'

const tempDirectories: string[] = []

function createTempProjectRoot(name: string) {
  const directory = mkdtempSync(path.join(tmpdir(), `${name}-`))
  tempDirectories.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

describe('readOrInitializeProjectSession', () => {
  it('keeps existing narrative.project.json title metadata while pinning prototype identity to book-signal-arc', async () => {
    const projectRoot = createTempProjectRoot('project-picker-existing')
    writeFileSync(path.join(projectRoot, 'narrative.project.json'), JSON.stringify({
      projectId: 'project-local-demo',
      schemaVersion: 1,
      title: 'Local Narrative Project',
    }))

    await expect(readOrInitializeProjectSession(projectRoot)).resolves.toEqual({
      projectId: 'book-signal-arc',
      projectRoot,
      projectTitle: 'Local Narrative Project',
    })
    expect(JSON.parse(readFileSync(path.join(projectRoot, 'narrative.project.json'), 'utf8'))).toEqual({
      projectId: 'book-signal-arc',
      schemaVersion: 1,
      title: 'Local Narrative Project',
    })
  })

  it('initializes narrative.project.json with the stable fixture-backed default project id when missing', async () => {
    const projectRoot = createTempProjectRoot('project-picker-init')
    mkdirSync(path.join(projectRoot, '.narrative'))

    const session = await readOrInitializeProjectSession(projectRoot)

    expect(session).toEqual({
      projectId: 'book-signal-arc',
      projectRoot,
      projectTitle: path.basename(projectRoot),
    })
    expect(JSON.parse(readFileSync(path.join(projectRoot, 'narrative.project.json'), 'utf8'))).toEqual({
      projectId: 'book-signal-arc',
      schemaVersion: 1,
      title: path.basename(projectRoot),
    })
  })

  it('backfills an omitted projectId to book-signal-arc without widening the bootstrap seed contract', async () => {
    const projectRoot = createTempProjectRoot('project-picker-backfill')
    writeFileSync(path.join(projectRoot, 'narrative.project.json'), JSON.stringify({
      schemaVersion: 1,
      title: 'Prototype Folder',
    }))

    const session = await readOrInitializeProjectSession(projectRoot)

    expect(session).toEqual({
      projectId: 'book-signal-arc',
      projectRoot,
      projectTitle: 'Prototype Folder',
    })
    expect(JSON.parse(readFileSync(path.join(projectRoot, 'narrative.project.json'), 'utf8'))).toEqual({
      projectId: 'book-signal-arc',
      schemaVersion: 1,
      title: 'Prototype Folder',
    })
  })
})

describe('openProjectWithDialog', () => {
  it('uses a native directory dialog before reading project metadata', async () => {
    const projectRoot = createTempProjectRoot('project-picker-dialog')
    writeFileSync(path.join(projectRoot, 'narrative.project.json'), JSON.stringify({
      projectId: 'book-signal-arc',
      schemaVersion: 1,
      title: 'Opened Through Dialog',
    }))
    const showOpenDialog = vi.fn(async () => ({
      canceled: false,
      filePaths: [projectRoot],
    }))

    const session = await openProjectWithDialog({
      dialog: {
        showOpenDialog,
      },
    })

    expect(session).toEqual({
      projectId: 'book-signal-arc',
      projectRoot,
      projectTitle: 'Opened Through Dialog',
    })
    expect(showOpenDialog).toHaveBeenCalledWith({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Open Project',
    })
  })
})
