import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { createProjectBackup, exportProjectArchive } from './project-backup.js'

const tempDirectories: string[] = []

function createProjectRoot() {
  const directory = mkdtempSync(path.join(tmpdir(), 'project-backup-'))
  tempDirectories.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

describe('project backup helpers', () => {
  it('writes a local backup snapshot under .narrative/backups with the original manifest and store contents', async () => {
    const projectRoot = createProjectRoot()
    const storeFilePath = path.join(projectRoot, '.narrative', 'project-store.json')
    const manifestContents = `${JSON.stringify({
      projectId: 'book-signal-arc',
      schemaVersion: 1,
      title: 'Desktop Local Prototype',
    }, null, 2)}\n`
    const storeContents = `${JSON.stringify({
      schemaVersion: 1,
      seedVersion: 'prototype-fixture-seed-v1',
      projects: {},
    }, null, 2)}\n`

    mkdirSync(path.dirname(storeFilePath), { recursive: true })
    writeFileSync(path.join(projectRoot, 'narrative.project.json'), manifestContents, 'utf8')
    writeFileSync(storeFilePath, storeContents, 'utf8')

    await createProjectBackup({
      now: () => '2026-04-28T00:00:00.000Z',
      projectRoot,
      storeFilePath,
    })

    const backups = await readdir(path.join(projectRoot, '.narrative', 'backups'))
    expect(backups).toHaveLength(1)
    expect(JSON.parse(await readFile(path.join(projectRoot, '.narrative', 'backups', backups[0]!), 'utf8'))).toEqual({
      createdAt: '2026-04-28T00:00:00.000Z',
      kind: 'narrative-project-backup',
      manifest: {
        content: manifestContents,
        relativePath: 'narrative.project.json',
      },
      projectRoot,
      schemaVersion: 1,
      store: {
        content: storeContents,
        relativePath: '.narrative/project-store.json',
      },
    })
  })

  it('writes a manual archive with manifest, store metadata, project data, and no secret-like fields', async () => {
    const projectRoot = createProjectRoot()
    const storeFilePath = path.join(projectRoot, '.narrative', 'project-store.json')
    mkdirSync(path.dirname(storeFilePath), { recursive: true })
    writeFileSync(path.join(projectRoot, 'narrative.project.json'), `${JSON.stringify({
      bootstrap: {
        source: 'signal-arc-demo-template-v1',
      },
      projectId: 'book-signal-arc',
      schemaVersion: 1,
      title: 'Desktop Local Prototype',
    }, null, 2)}\n`, 'utf8')
    writeFileSync(storeFilePath, `${JSON.stringify({
      schemaVersion: 1,
      storeKind: 'narrative-local-project-store',
      templateVersion: 'local-project-store-v1',
      project: {
        projectId: 'book-signal-arc',
        projectTitle: 'Desktop Local Prototype',
        createdAt: '2026-04-28T00:00:00.000Z',
        updatedAt: '2026-04-28T01:00:00.000Z',
        data: {
          runtimeInfo: {
            capabilities: {
              contextPacketRefs: true,
              proposalSetRefs: true,
              read: true,
              reviewDecisions: true,
              runEventPolling: true,
              runEventStream: false,
              runEvents: true,
              write: true,
            },
            projectId: 'book-signal-arc',
            projectTitle: 'Desktop Local Prototype',
            source: 'api',
            status: 'healthy',
            summary: 'Connected to local project store v1.',
            versionLabel: 'local-project-store-v1',
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
          scenes: {
            'scene-midnight-platform': {
              id: 'scene-midnight-platform',
              metadata: {
                apiKey: 'sk-api-key',
                nested: {
                  providerRawSecret: 'provider-secret',
                  secret: 'generic-secret',
                  token: 'bearer-token',
                },
              },
              modelBinding: {
                accessToken: 'access-token',
                apiKey: 'model-api-key',
                provider: 'openai',
                rawSecret: 'sk-top-secret',
              },
            },
          },
        },
      },
      runStore: {
        runStates: [],
        sceneSequences: {},
      },
    }, null, 2)}\n`, 'utf8')

    await exportProjectArchive({
      now: () => '2026-04-28T02:00:00.000Z',
      projectRoot,
      storeFilePath,
    })

    const exports = await readdir(path.join(projectRoot, '.narrative', 'exports'))
    expect(exports).toHaveLength(1)
    const archive = JSON.parse(await readFile(path.join(projectRoot, '.narrative', 'exports', exports[0]!), 'utf8'))

    expect(archive).toMatchObject({
      exportedAt: '2026-04-28T02:00:00.000Z',
      kind: 'narrative-project-archive',
      manifest: {
        projectId: 'book-signal-arc',
        schemaVersion: 1,
        title: 'Desktop Local Prototype',
      },
      storeMetadata: {
        projectId: 'book-signal-arc',
        projectTitle: 'Desktop Local Prototype',
        schemaVersion: 1,
        storeKind: 'narrative-local-project-store',
        templateVersion: 'local-project-store-v1',
        updatedAt: '2026-04-28T01:00:00.000Z',
      },
      projectData: {
        scenes: {
          'scene-midnight-platform': {
            id: 'scene-midnight-platform',
            metadata: {
              nested: {},
            },
            modelBinding: {
              provider: 'openai',
            },
          },
        },
      },
    })
    expect(JSON.stringify(archive)).not.toContain('sk-top-secret')
    expect(JSON.stringify(archive)).not.toContain('sk-api-key')
    expect(JSON.stringify(archive)).not.toContain('provider-secret')
    expect(JSON.stringify(archive)).not.toContain('generic-secret')
    expect(JSON.stringify(archive)).not.toContain('bearer-token')
    expect(JSON.stringify(archive)).not.toContain('access-token')
    expect(JSON.stringify(archive)).not.toContain('model-api-key')
    expect(JSON.stringify(archive)).not.toContain('rawSecret')
    expect(JSON.stringify(archive)).not.toContain('providerRawSecret')
    expect(JSON.stringify(archive)).not.toContain('apiKey')
    expect(JSON.stringify(archive)).not.toContain('secret')
    expect(JSON.stringify(archive)).not.toContain('token')
  })
})
