import { access, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import {
  LOCAL_PROJECT_STORE_KIND,
  LOCAL_PROJECT_STORE_SCHEMA_VERSION,
  LOCAL_PROJECT_STORE_TEMPLATE_VERSION,
  createLocalProjectStorePersistence,
} from './project-state-persistence.js'

describe('localProjectStorePersistence', () => {
  const tempDirectories = [] as string[]

  afterEach(async () => {
    await Promise.all(
      tempDirectories.splice(0).map((directory) => rm(directory, {
        recursive: true,
        force: true,
      })),
    )
  })

  async function createTempStorePaths() {
    const directory = await mkdtemp(path.join(tmpdir(), 'local-project-store-persistence-'))
    tempDirectories.push(directory)

    return {
      directory,
      filePath: path.join(directory, '.narrative', 'local-project-store.json'),
      artifactDirPath: path.join(directory, '.narrative', 'artifacts'),
    }
  }

  async function createPersistence() {
    const paths = await createTempStorePaths()

    return {
      ...paths,
      persistence: createLocalProjectStorePersistence({
        filePath: paths.filePath,
        artifactDirPath: paths.artifactDirPath,
        apiBaseUrl: 'http://127.0.0.1:4174/api',
        projectId: 'book-signal-arc',
        projectTitle: 'Desktop Local Prototype',
      }),
    }
  }

  async function createPersistenceWithPaths(paths: Awaited<ReturnType<typeof createTempStorePaths>>) {
    return createLocalProjectStorePersistence({
      filePath: paths.filePath,
      artifactDirPath: paths.artifactDirPath,
      apiBaseUrl: 'http://127.0.0.1:4174/api',
      projectId: 'book-signal-arc',
      projectTitle: 'Desktop Local Prototype',
      now: () => '2026-04-28T00:00:00.000Z',
    })
  }

  async function writeStoreFile(filePath: string, contents: string) {
    await mkdir(path.dirname(filePath), { recursive: true })
    await writeFile(filePath, contents, 'utf8')
  }

  it('creates the template store file and artifact directory when the store is missing', async () => {
    const { filePath, artifactDirPath, persistence } = await createPersistence()

    const record = await persistence.load()

    expect(record).toMatchObject({
      schemaVersion: LOCAL_PROJECT_STORE_SCHEMA_VERSION,
      storeKind: LOCAL_PROJECT_STORE_KIND,
      templateVersion: LOCAL_PROJECT_STORE_TEMPLATE_VERSION,
      project: {
        projectId: 'book-signal-arc',
        projectTitle: 'Desktop Local Prototype',
        data: {
          runtimeInfo: {
            projectId: 'book-signal-arc',
            projectTitle: 'Desktop Local Prototype',
            runtimeKind: 'real-local-project',
            source: 'api',
            status: 'healthy',
            summary: 'Connected to local project store v1.',
            versionLabel: 'local-project-store-v1',
          },
        },
      },
    })
    await expect(access(filePath)).resolves.toBeUndefined()
    await expect(access(artifactDirPath)).resolves.toBeUndefined()
  })

  it('throws a stable error when the local project store file contains invalid JSON', async () => {
    const { filePath, persistence } = await createPersistence()
    await writeStoreFile(filePath, '{"schemaVersion": 1,')

    await expect(persistence.load()).rejects.toThrow(`Local project store is invalid: ${filePath}`)
  })

  it('rejects an unsupported schemaVersion', async () => {
    const { filePath, persistence } = await createPersistence()
    await writeStoreFile(filePath, JSON.stringify({
      schemaVersion: 999,
      storeKind: LOCAL_PROJECT_STORE_KIND,
      templateVersion: LOCAL_PROJECT_STORE_TEMPLATE_VERSION,
      project: {
        projectId: 'book-signal-arc',
        projectTitle: 'Desktop Local Prototype',
        createdAt: '2026-04-28T00:00:00.000Z',
        updatedAt: '2026-04-28T00:00:00.000Z',
        data: {
          runtimeInfo: {
            projectId: 'book-signal-arc',
            projectTitle: 'Desktop Local Prototype',
            runtimeKind: 'real-local-project',
            source: 'api',
            status: 'healthy',
            summary: 'Connected to local project store v1.',
            versionLabel: 'local-project-store-v1',
            capabilities: {
              read: true,
              write: true,
              runEvents: true,
              runEventPolling: true,
              runEventStream: false,
              reviewDecisions: true,
              contextPacketRefs: true,
              proposalSetRefs: true,
            },
          },
          books: {},
          manuscriptCheckpoints: {},
          exportProfiles: {},
          exportArtifacts: {},
          experimentBranches: {},
          chapters: {},
          assets: {},
          reviewDecisions: {},
          reviewFixActions: {},
          scenes: {},
        },
      },
    }))

    await expect(persistence.load()).rejects.toThrow('Unsupported local project store schemaVersion')
  })

  it('refuses to migrate an unsupported future schema and leaves the original store file intact', async () => {
    const paths = await createTempStorePaths()
    const persistence = await createPersistenceWithPaths(paths)
    const originalContents = `${JSON.stringify({
      schemaVersion: 2,
      seedVersion: 'prototype-fixture-seed-v2',
      projects: {},
    }, null, 2)}\n`
    await writeStoreFile(paths.filePath, originalContents)

    await expect(persistence.load()).rejects.toThrow('Unsupported local project store schemaVersion')
    await expect(readFile(paths.filePath, 'utf8')).resolves.toBe(originalContents)
  })

  it('writes an automatic backup before migrating a supported legacy overlay to the v1 local project store', async () => {
    const paths = await createTempStorePaths()
    const persistence = await createPersistenceWithPaths(paths)
    const originalContents = `${JSON.stringify({
      schemaVersion: 1,
      seedVersion: 'prototype-fixture-seed-v1',
      projects: {
        'book-signal-arc': {
          updatedAt: '2026-04-27T12:00:00.000Z',
          reviewDecisions: {
            'book-signal-arc': [
              {
                issueId: 'compare-delta-scene-midnight-platform',
                issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
                status: 'reviewed',
                note: 'Migrated decision note.',
              },
            ],
          },
        },
      },
    }, null, 2)}\n`
    await writeStoreFile(paths.filePath, originalContents)

    const migrated = await persistence.load()
    const backups = await readdir(path.join(paths.directory, '.narrative', 'backups'))

    expect(backups).toHaveLength(1)
    expect(JSON.parse(await readFile(path.join(paths.directory, '.narrative', 'backups', backups[0]!), 'utf8'))).toMatchObject({
      kind: 'narrative-project-backup',
      manifest: {
        content: null,
        relativePath: 'narrative.project.json',
      },
      store: {
        content: originalContents,
      },
    })
    expect(migrated).toMatchObject({
      schemaVersion: LOCAL_PROJECT_STORE_SCHEMA_VERSION,
      storeKind: LOCAL_PROJECT_STORE_KIND,
      templateVersion: LOCAL_PROJECT_STORE_TEMPLATE_VERSION,
      project: {
        projectId: 'book-signal-arc',
        projectTitle: 'Desktop Local Prototype',
        updatedAt: '2026-04-27T12:00:00.000Z',
        data: {
          reviewDecisions: {
            'book-signal-arc': [
              {
                issueId: 'compare-delta-scene-midnight-platform',
                note: 'Migrated decision note.',
              },
            ],
          },
        },
      },
    })
  })

  it('rejects an unsupported store kind', async () => {
    const { filePath, persistence } = await createPersistence()
    await writeStoreFile(filePath, JSON.stringify({
      schemaVersion: LOCAL_PROJECT_STORE_SCHEMA_VERSION,
      storeKind: 'prototype-overlay',
      templateVersion: LOCAL_PROJECT_STORE_TEMPLATE_VERSION,
      project: {
        projectId: 'book-signal-arc',
        projectTitle: 'Desktop Local Prototype',
        createdAt: '2026-04-28T00:00:00.000Z',
        updatedAt: '2026-04-28T00:00:00.000Z',
        data: {
          runtimeInfo: {
            projectId: 'book-signal-arc',
            projectTitle: 'Desktop Local Prototype',
            runtimeKind: 'real-local-project',
            source: 'api',
            status: 'healthy',
            summary: 'Connected to local project store v1.',
            versionLabel: 'local-project-store-v1',
            capabilities: {
              read: true,
              write: true,
              runEvents: true,
              runEventPolling: true,
              runEventStream: false,
              reviewDecisions: true,
              contextPacketRefs: true,
              proposalSetRefs: true,
            },
          },
          books: {},
          manuscriptCheckpoints: {},
          exportProfiles: {},
          exportArtifacts: {},
          experimentBranches: {},
          chapters: {},
          assets: {},
          reviewDecisions: {},
          reviewFixActions: {},
          scenes: {},
        },
      },
    }))

    await expect(persistence.load()).rejects.toThrow('Unsupported local project store kind')
  })

  it('rejects a store whose projectId mismatches the selected current project', async () => {
    const { filePath, persistence } = await createPersistence()
    await writeStoreFile(filePath, JSON.stringify({
      schemaVersion: LOCAL_PROJECT_STORE_SCHEMA_VERSION,
      storeKind: LOCAL_PROJECT_STORE_KIND,
      templateVersion: LOCAL_PROJECT_STORE_TEMPLATE_VERSION,
      project: {
        projectId: 'project-artifact-a',
        projectTitle: 'Wrong Project',
        createdAt: '2026-04-28T00:00:00.000Z',
        updatedAt: '2026-04-28T00:00:00.000Z',
        data: {
          runtimeInfo: {
            projectId: 'project-artifact-a',
            projectTitle: 'Wrong Project',
            runtimeKind: 'real-local-project',
            source: 'api',
            status: 'healthy',
            summary: 'Connected to local project store v1.',
            versionLabel: 'local-project-store-v1',
            capabilities: {
              read: true,
              write: true,
              runEvents: true,
              runEventPolling: true,
              runEventStream: false,
              reviewDecisions: true,
              contextPacketRefs: true,
              proposalSetRefs: true,
            },
          },
          books: {},
          manuscriptCheckpoints: {},
          exportProfiles: {},
          exportArtifacts: {},
          experimentBranches: {},
          chapters: {},
          assets: {},
          reviewDecisions: {},
          reviewFixActions: {},
          scenes: {},
        },
      },
    }))

    await expect(persistence.load()).rejects.toThrow(
      'Local project store projectId mismatch: expected book-signal-arc but found project-artifact-a',
    )
  })

  it('saves a deep-cloned project snapshot and updates the project updatedAt timestamp', async () => {
    const { filePath, persistence } = await createPersistence()
    const initial = await persistence.load()
    const data = initial.project.data
    const previousUpdatedAt = initial.project.updatedAt

    data.runtimeInfo.summary = 'Persisted runtime summary.'
    data.scenes['scene-midnight-platform'].prose.proseDraft = 'Persisted prose.'

    await persistence.save({
      data,
      runStore: {
        runStates: [
          {
            sequence: 3,
            run: {
              id: 'run-scene-midnight-platform-003',
            },
          },
        ],
        sceneSequences: {
          'scene-midnight-platform': 3,
        },
      },
    })

    data.runtimeInfo.summary = 'Mutated after save.'
    data.scenes['scene-midnight-platform'].prose.proseDraft = 'Mutated after save.'

    const reloaded = await persistence.load()
    expect(reloaded.project.updatedAt).not.toBe(previousUpdatedAt)
    expect(reloaded.project.data.runtimeInfo.summary).toBe('Persisted runtime summary.')
    expect(reloaded.project.data.scenes['scene-midnight-platform'].prose.proseDraft).toBe('Persisted prose.')
    expect(reloaded.runStore).toEqual({
      runStates: [
        {
          sequence: 3,
          run: {
            id: 'run-scene-midnight-platform-003',
          },
        },
      ],
      sceneSequences: {
        'scene-midnight-platform': 3,
      },
    })

    const savedRecord = JSON.parse(await readFile(filePath, 'utf8'))
    expect(savedRecord.project.data.runtimeInfo.summary).toBe('Persisted runtime summary.')
  })

  it('keeps the previous file byte-for-byte intact when the atomic rename step fails', async () => {
    const paths = await createTempStorePaths()
    const bootstrapPersistence = createLocalProjectStorePersistence({
      filePath: paths.filePath,
      artifactDirPath: paths.artifactDirPath,
      apiBaseUrl: 'http://127.0.0.1:4174/api',
      projectId: 'book-signal-arc',
      projectTitle: 'Desktop Local Prototype',
    })
    const original = await bootstrapPersistence.load()
    const originalBytes = await readFile(paths.filePath, 'utf8')

    const persistence = createLocalProjectStorePersistence({
      filePath: paths.filePath,
      artifactDirPath: paths.artifactDirPath,
      apiBaseUrl: 'http://127.0.0.1:4174/api',
      projectId: 'book-signal-arc',
      projectTitle: 'Desktop Local Prototype',
      fileSystem: {
        readFile,
        writeFile,
        mkdir,
        async rename() {
          throw new Error('simulated rename failure')
        },
      },
    })

    await expect(persistence.save({
      data: {
        ...original.project.data,
        runtimeInfo: {
          ...original.project.data.runtimeInfo,
          summary: 'This save should fail.',
        },
      },
    })).rejects.toThrow('simulated rename failure')

    await expect(readFile(paths.filePath, 'utf8')).resolves.toBe(originalBytes)
    expect(original.project.data.runtimeInfo.summary).toBe('Connected to local project store v1.')
  })

  it('resets the store to a fresh template with the same selected project identity', async () => {
    const { persistence } = await createPersistence()
    const initial = await persistence.load()

    await persistence.save({
      data: {
        ...initial.project.data,
        runtimeInfo: {
          ...initial.project.data.runtimeInfo,
          summary: 'Dirty runtime summary.',
        },
      },
      runStore: {
        runStates: [
          {
            sequence: 5,
            run: {
              id: 'run-scene-midnight-platform-005',
            },
          },
        ],
        sceneSequences: {
          'scene-midnight-platform': 5,
        },
      },
    })

    const resetRecord = await persistence.reset()

    expect(resetRecord).toMatchObject({
      schemaVersion: LOCAL_PROJECT_STORE_SCHEMA_VERSION,
      storeKind: LOCAL_PROJECT_STORE_KIND,
      templateVersion: LOCAL_PROJECT_STORE_TEMPLATE_VERSION,
      project: {
        projectId: 'book-signal-arc',
        projectTitle: 'Desktop Local Prototype',
        data: {
          runtimeInfo: {
            summary: 'Connected to local project store v1.',
          },
      },
      },
    })
    expect(resetRecord).not.toHaveProperty('runStore')
  })
})
