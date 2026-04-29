import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createProjectWithDialog,
  openProjectWithDialog,
  readExistingProjectSession,
  readOrInitializeProjectSession,
} from './project-picker.js'

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
  it('initializes a v1 manifest with a local project id, store metadata, and bootstrap source when missing', async () => {
    const projectRoot = createTempProjectRoot('project-picker-init')

    await expect(readOrInitializeProjectSession(projectRoot, {
      createProjectId: () => 'local-project-alpha',
      now: () => '2026-04-28T00:00:00.000Z',
    })).resolves.toEqual({
      projectId: 'local-project-alpha',
      projectMode: 'real-project',
      runtimeKind: 'real-local-project',
      projectRoot,
      projectTitle: path.basename(projectRoot),
    })
    expect(JSON.parse(readFileSync(path.join(projectRoot, 'narrative.project.json'), 'utf8'))).toEqual({
      bootstrap: {
        source: 'real-project-template-v1',
      },
      createdAt: '2026-04-28T00:00:00.000Z',
      projectId: 'local-project-alpha',
      schemaVersion: 1,
      store: {
        artifactDir: '.narrative/artifacts',
        dataFile: '.narrative/project-store.json',
        schemaVersion: 1,
      },
      title: path.basename(projectRoot),
      updatedAt: '2026-04-28T00:00:00.000Z',
    })
    expect(existsSync(path.join(projectRoot, '.narrative'))).toBe(true)
    expect(existsSync(path.join(projectRoot, '.narrative', 'artifacts'))).toBe(true)
    expect(readFileSync(path.join(projectRoot, 'narrative.project.json'), 'utf8')).toContain('"schemaVersion": 1')
  })

  it('preserves an existing non-fixture project id and title instead of rewriting them to the prototype fixture id', async () => {
    const projectRoot = createTempProjectRoot('project-picker-existing')
    writeFileSync(path.join(projectRoot, 'narrative.project.json'), JSON.stringify({
      bootstrap: {
        source: 'signal-arc-demo-template-v1',
      },
      createdAt: '2026-04-27T00:00:00.000Z',
      projectId: 'local-existing-project',
      schemaVersion: 1,
      store: {
        artifactDir: '.narrative/artifacts',
        dataFile: '.narrative/project-store.json',
        schemaVersion: 1,
      },
      title: 'Existing Local Project',
      updatedAt: '2026-04-27T00:00:00.000Z',
    }))

    await expect(readOrInitializeProjectSession(projectRoot, {
      createProjectId: () => 'local-project-alpha',
      now: () => '2026-04-28T00:00:00.000Z',
    })).resolves.toEqual({
      projectId: 'local-existing-project',
      projectMode: 'real-project',
      runtimeKind: 'real-local-project',
      projectRoot,
      projectTitle: 'Existing Local Project',
    })
    expect(JSON.parse(readFileSync(path.join(projectRoot, 'narrative.project.json'), 'utf8'))).toEqual({
      bootstrap: {
        source: 'signal-arc-demo-template-v1',
      },
      createdAt: '2026-04-27T00:00:00.000Z',
      projectId: 'local-existing-project',
      schemaVersion: 1,
      store: {
        artifactDir: '.narrative/artifacts',
        dataFile: '.narrative/project-store.json',
        schemaVersion: 1,
      },
      title: 'Existing Local Project',
      updatedAt: '2026-04-27T00:00:00.000Z',
    })
  })

  it('backfills missing manifest fields while preserving the current project identity and title', async () => {
    const projectRoot = createTempProjectRoot('project-picker-backfill')
    writeFileSync(path.join(projectRoot, 'narrative.project.json'), JSON.stringify({
      createdAt: '2026-04-27T00:00:00.000Z',
      projectId: 'local-project-beta',
      schemaVersion: 1,
      title: 'Prototype Folder',
    }))

    const session = await readOrInitializeProjectSession(projectRoot, {
      now: () => '2026-04-28T00:00:00.000Z',
    })

    expect(session).toEqual({
      projectId: 'local-project-beta',
      projectMode: 'real-project',
      runtimeKind: 'real-local-project',
      projectRoot,
      projectTitle: 'Prototype Folder',
    })
    expect(JSON.parse(readFileSync(path.join(projectRoot, 'narrative.project.json'), 'utf8'))).toEqual({
      bootstrap: {
        source: 'real-project-template-v1',
      },
      createdAt: '2026-04-27T00:00:00.000Z',
      projectId: 'local-project-beta',
      schemaVersion: 1,
      store: {
        artifactDir: '.narrative/artifacts',
        dataFile: '.narrative/project-store.json',
        schemaVersion: 1,
      },
      title: 'Prototype Folder',
      updatedAt: '2026-04-28T00:00:00.000Z',
    })
    expect(existsSync(path.join(projectRoot, '.narrative'))).toBe(true)
    expect(existsSync(path.join(projectRoot, '.narrative', 'artifacts'))).toBe(true)
  })

  it('refuses to downgrade an unsupported future manifest schema and leaves the manifest untouched', async () => {
    const projectRoot = createTempProjectRoot('project-picker-future-schema')
    const manifestPath = path.join(projectRoot, 'narrative.project.json')
    const originalManifest = `${JSON.stringify({
      createdAt: '2026-04-27T00:00:00.000Z',
      projectId: 'local-project-future',
      schemaVersion: 2,
      title: 'Future Schema Project',
      updatedAt: '2026-04-27T00:00:00.000Z',
    }, null, 2)}\n`
    writeFileSync(manifestPath, originalManifest, 'utf8')

    await expect(readOrInitializeProjectSession(projectRoot, {
      createProjectId: () => 'local-project-alpha',
      now: () => '2026-04-28T00:00:00.000Z',
    })).rejects.toThrow('Unsupported narrative project schemaVersion')
    expect(readFileSync(manifestPath, 'utf8')).toBe(originalManifest)
  })
})

describe('readExistingProjectSession', () => {
  it('restores the selected-project session from an existing narrative manifest without replacing its identity', async () => {
    const projectRoot = createTempProjectRoot('project-picker-restore-existing')
    writeFileSync(path.join(projectRoot, 'narrative.project.json'), JSON.stringify({
      bootstrap: {
        source: 'signal-arc-demo-template-v1',
      },
      createdAt: '2026-04-27T00:00:00.000Z',
      projectId: 'local-existing-project',
      schemaVersion: 1,
      store: {
        artifactDir: '.narrative/artifacts',
        dataFile: '.narrative/project-store.json',
        schemaVersion: 1,
      },
      title: 'Existing Local Project',
      updatedAt: '2026-04-27T00:00:00.000Z',
    }))

    await expect(readExistingProjectSession(projectRoot)).resolves.toEqual({
      projectId: 'local-existing-project',
      projectMode: 'real-project',
      runtimeKind: 'real-local-project',
      projectRoot,
      projectTitle: 'Existing Local Project',
    })
  })

  it('rejects a missing project root instead of silently recreating a deleted recent project', async () => {
    const missingProjectRoot = path.join(createTempProjectRoot('project-picker-deleted-root'), 'deleted')

    await expect(readExistingProjectSession(missingProjectRoot)).rejects.toThrow(
      `Narrative project root does not exist: ${missingProjectRoot}`,
    )
    expect(existsSync(missingProjectRoot)).toBe(false)
  })
})

describe('openProjectWithDialog', () => {
  it('uses a native directory dialog before reading project metadata', async () => {
    const projectRoot = createTempProjectRoot('project-picker-dialog')
    writeFileSync(path.join(projectRoot, 'narrative.project.json'), JSON.stringify({
      bootstrap: {
        source: 'signal-arc-demo-template-v1',
      },
      createdAt: '2026-04-28T00:00:00.000Z',
      projectId: 'local-project-dialog',
      schemaVersion: 1,
      store: {
        artifactDir: '.narrative/artifacts',
        dataFile: '.narrative/project-store.json',
        schemaVersion: 1,
      },
      title: 'Opened Through Dialog',
      updatedAt: '2026-04-28T00:00:00.000Z',
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
      projectId: 'local-project-dialog',
      projectMode: 'real-project',
      runtimeKind: 'real-local-project',
      projectRoot,
      projectTitle: 'Opened Through Dialog',
    })
    expect(showOpenDialog).toHaveBeenCalledWith({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Open Project',
    })
  })
})

describe('createProjectWithDialog', () => {
  it('initializes the selected directory through the shared project-session reader', async () => {
    const projectRoot = createTempProjectRoot('project-picker-create')
    const showOpenDialog = vi.fn(async () => ({
      canceled: false,
      filePaths: [projectRoot],
    }))
    const readProjectSession = vi.fn(async (selectedRoot: string) => ({
      projectId: 'local-project-created',
      projectMode: 'real-project' as const,
      runtimeKind: 'real-local-project' as const,
      projectRoot: selectedRoot,
      projectTitle: 'Created Through Dialog',
    }))

    const session = await createProjectWithDialog({
      dialog: {
        showOpenDialog,
      },
      readProjectSession,
    })

    expect(session).toEqual({
      projectId: 'local-project-created',
      projectMode: 'real-project',
      runtimeKind: 'real-local-project',
      projectRoot,
      projectTitle: 'Created Through Dialog',
    })
    expect(showOpenDialog).toHaveBeenCalledWith({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Create Project',
    })
    expect(readProjectSession).toHaveBeenCalledWith(projectRoot)
  })
})
