import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import {
  PROJECT_STATE_SCHEMA_VERSION,
  PROJECT_STATE_SEED_VERSION,
  createProjectStatePersistence,
  type PersistedProjectStateOverlay,
} from './project-state-persistence.js'

describe('projectStatePersistence', () => {
  const tempDirectories = [] as string[]

  afterEach(async () => {
    await Promise.all(
      tempDirectories.splice(0).map((directory) => rm(directory, {
        recursive: true,
        force: true,
      })),
    )
  })

  async function createTempStateFilePath() {
    const directory = await mkdtemp(path.join(tmpdir(), 'project-state-persistence-'))
    tempDirectories.push(directory)
    const filePath = path.join(directory, '.narrative', 'prototype-state.json')
    await mkdir(path.dirname(filePath), { recursive: true })
    return filePath
  }

  function createOverlay(updatedAt: string): PersistedProjectStateOverlay {
    return {
      updatedAt,
      reviewDecisions: {
        'issue-1': {
          decision: 'accept',
        },
      },
      scenes: {
        'scene-midnight-platform': {
          proseStatus: 'Generated',
        },
      },
      runStore: {
        runStates: [
          {
            runId: 'run-001',
          },
        ],
        sceneSequences: {
          'scene-midnight-platform': 2,
        },
      },
    }
  }

  it('returns an empty envelope when the file is missing, invalid JSON, or has the wrong schema version', async () => {
    const filePath = await createTempStateFilePath()
    const persistence = createProjectStatePersistence({ filePath })

    await expect(persistence.load()).resolves.toEqual({
      schemaVersion: PROJECT_STATE_SCHEMA_VERSION,
      seedVersion: PROJECT_STATE_SEED_VERSION,
      projects: {},
    })

    await writeFile(filePath, '{"schemaVersion": 1,', 'utf8')
    await expect(persistence.load()).resolves.toEqual({
      schemaVersion: PROJECT_STATE_SCHEMA_VERSION,
      seedVersion: PROJECT_STATE_SEED_VERSION,
      projects: {},
    })

    await writeFile(filePath, JSON.stringify({
      schemaVersion: 999,
      seedVersion: PROJECT_STATE_SEED_VERSION,
      projects: {
        'book-signal-arc': createOverlay('2026-04-27T00:00:00.000Z'),
      },
    }), 'utf8')
    await expect(persistence.load()).resolves.toEqual({
      schemaVersion: PROJECT_STATE_SCHEMA_VERSION,
      seedVersion: PROJECT_STATE_SEED_VERSION,
      projects: {},
    })
  })

  it('ignores persisted overlays when the seed version mismatches', async () => {
    const filePath = await createTempStateFilePath()
    const persistence = createProjectStatePersistence({ filePath })

    await writeFile(filePath, JSON.stringify({
      schemaVersion: PROJECT_STATE_SCHEMA_VERSION,
      seedVersion: 'prototype-fixture-seed-v0',
      projects: {
        'book-signal-arc': createOverlay('2026-04-27T00:00:00.000Z'),
      },
    }), 'utf8')

    await expect(persistence.load()).resolves.toEqual({
      schemaVersion: PROJECT_STATE_SCHEMA_VERSION,
      seedVersion: PROJECT_STATE_SEED_VERSION,
      projects: {},
    })
  })

  it('treats a malformed persisted project overlay as invalid saved state for the whole envelope', async () => {
    const filePath = await createTempStateFilePath()
    const persistence = createProjectStatePersistence({ filePath })

    await writeFile(filePath, JSON.stringify({
      schemaVersion: PROJECT_STATE_SCHEMA_VERSION,
      seedVersion: PROJECT_STATE_SEED_VERSION,
      projects: {
        'book-signal-arc': {
          updatedAt: '2026-04-27T00:00:00.000Z',
          runStore: {
            runStates: [],
            sceneSequences: {
              'scene-midnight-platform': 'not-a-number',
            },
          },
        },
        'project-b': {
          updatedAt: '2026-04-27T01:00:00.000Z',
          exportArtifacts: {
            'artifact-1': {
              status: 'ready',
            },
          },
        },
      },
    }), 'utf8')

    await expect(persistence.load()).resolves.toEqual({
      schemaVersion: PROJECT_STATE_SCHEMA_VERSION,
      seedVersion: PROJECT_STATE_SEED_VERSION,
      projects: {},
    })
  })

  it('creates the state directory, rewrites the envelope, and strips seed-only data from saved overlays', async () => {
    const filePath = await createTempStateFilePath()
    const persistence = createProjectStatePersistence({ filePath })
    const overlay = createOverlay('2026-04-27T00:00:00.000Z')

    await persistence.saveProjectOverlay('book-signal-arc', {
      ...overlay,
      chapters: {
        'chapter-1': {
          currentSceneId: 'scene-midnight-platform',
        },
      },
      books: {
        'book-signal-arc': {
          title: 'Seed-only static data should not persist',
        },
      },
    } as PersistedProjectStateOverlay & { books: Record<string, { title: string }> })

    await persistence.saveProjectOverlay('project-b', {
      updatedAt: '2026-04-27T01:00:00.000Z',
      exportArtifacts: {
        'artifact-1': {
          status: 'ready',
        },
      },
    })

    expect(await readFile(filePath, 'utf8')).toContain('"project-b"')
    await expect(persistence.load()).resolves.toEqual({
      schemaVersion: PROJECT_STATE_SCHEMA_VERSION,
      seedVersion: PROJECT_STATE_SEED_VERSION,
      projects: {
        'book-signal-arc': {
          ...overlay,
          chapters: {
            'chapter-1': {
              currentSceneId: 'scene-midnight-platform',
            },
          },
        },
        'project-b': {
          updatedAt: '2026-04-27T01:00:00.000Z',
          exportArtifacts: {
            'artifact-1': {
              status: 'ready',
            },
          },
        },
      },
    })

    const savedEnvelope = JSON.parse(await readFile(filePath, 'utf8'))
    expect(savedEnvelope.projects['book-signal-arc']).not.toHaveProperty('books')
  })

  it('keeps the last committed target file intact when atomic rename fails', async () => {
    const filePath = await createTempStateFilePath()
    const originalEnvelope = {
      schemaVersion: PROJECT_STATE_SCHEMA_VERSION,
      seedVersion: PROJECT_STATE_SEED_VERSION,
      projects: {
        'book-signal-arc': createOverlay('2026-04-27T00:00:00.000Z'),
      },
    }
    await writeFile(filePath, `${JSON.stringify(originalEnvelope, null, 2)}\n`, 'utf8')

    const persistence = createProjectStatePersistence({
      filePath,
      fileSystem: {
        mkdir,
        readFile,
        writeFile,
        async rename() {
          throw new Error('simulated rename failure')
        },
      },
    })

    await expect(persistence.saveProjectOverlay('project-b', {
      updatedAt: '2026-04-27T01:00:00.000Z',
      scenes: {
        'scene-midnight-platform': {
          proseStatus: 'Generated',
        },
      },
    })).rejects.toThrow('simulated rename failure')

    await expect(readFile(filePath, 'utf8')).resolves.toBe(`${JSON.stringify(originalEnvelope, null, 2)}\n`)
  })

  it('clears one project overlay without deleting other project overlays', async () => {
    const filePath = await createTempStateFilePath()
    const persistence = createProjectStatePersistence({ filePath })

    await persistence.saveProjectOverlay('book-signal-arc', createOverlay('2026-04-27T00:00:00.000Z'))
    await persistence.saveProjectOverlay('project-b', {
      updatedAt: '2026-04-27T01:00:00.000Z',
      reviewFixActions: {
        'issue-1': {
          status: 'open',
        },
      },
    })

    await persistence.clearProjectOverlay('book-signal-arc')

    await expect(persistence.load()).resolves.toEqual({
      schemaVersion: PROJECT_STATE_SCHEMA_VERSION,
      seedVersion: PROJECT_STATE_SEED_VERSION,
      projects: {
        'project-b': {
          updatedAt: '2026-04-27T01:00:00.000Z',
          reviewFixActions: {
            'issue-1': {
              status: 'open',
            },
          },
        },
      },
    })
  })
})
