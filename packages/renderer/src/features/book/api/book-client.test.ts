import { describe, expect, it } from 'vitest'

import {
  buildMockBookExportArtifact,
  getMockBookExportArtifacts,
  resetMockBookExportArtifactDb,
} from './mock-book-export-artifact-db'
import { createBookClient } from './book-client'

function createBuildInput(format: 'markdown' | 'plain_text' = 'markdown') {
  return {
    bookId: 'book-signal-arc',
    exportProfileId: 'profile-editorial-md',
    format,
    filename: format === 'markdown' ? 'signal-arc.md' : 'signal-arc.txt',
    mimeType: format === 'markdown' ? 'text/markdown' : 'text/plain',
    title: 'Signal Arc',
    summary: 'Artifact summary',
    content: format === 'markdown' ? '# Signal Arc' : 'Signal Arc',
    sourceSignature: `source-${format}`,
    chapterCount: 1,
    sceneCount: 1,
    wordCount: 88,
    readinessSnapshot: {
      status: 'ready' as const,
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
  }
}

describe('book export artifact data layer', () => {
  it('builds deterministic artifact ids and returns latest artifacts first', () => {
    resetMockBookExportArtifactDb()

    const first = buildMockBookExportArtifact(createBuildInput('markdown'))
    const second = buildMockBookExportArtifact(createBuildInput('plain_text'))

    expect(first.id).toBe('book-export-artifact-book-signal-arc-profile-editorial-md-markdown-1')
    expect(second.id).toBe('book-export-artifact-book-signal-arc-profile-editorial-md-plain_text-2')
    expect(getMockBookExportArtifacts({ bookId: 'book-signal-arc' }).map((artifact) => artifact.id)).toEqual([
      second.id,
      first.id,
    ])
  })

  it('resets artifact records and deterministic sequence', () => {
    resetMockBookExportArtifactDb()
    buildMockBookExportArtifact(createBuildInput('markdown'))

    resetMockBookExportArtifactDb()
    const rebuilt = buildMockBookExportArtifact(createBuildInput('markdown'))

    expect(rebuilt.id).toBe('book-export-artifact-book-signal-arc-profile-editorial-md-markdown-1')
    expect(getMockBookExportArtifacts({ bookId: 'missing-book' })).toEqual([])
  })

  it('clones inputs and outputs so callers cannot mutate the mock db', () => {
    resetMockBookExportArtifactDb()
    const input = createBuildInput('markdown')
    const artifact = buildMockBookExportArtifact(input)

    input.content = 'Mutated input'
    artifact.content = 'Mutated output'

    expect(getMockBookExportArtifacts({ bookId: 'book-signal-arc' })[0]).toMatchObject({
      content: '# Signal Arc',
    })
  })

  it('filters artifacts by export profile and checkpoint', () => {
    resetMockBookExportArtifactDb()
    buildMockBookExportArtifact(createBuildInput('markdown'))
    buildMockBookExportArtifact({
      ...createBuildInput('plain_text'),
      exportProfileId: 'profile-copyedit-text',
      checkpointId: 'checkpoint-1',
    })

    expect(
      getMockBookExportArtifacts({
        bookId: 'book-signal-arc',
        exportProfileId: 'profile-copyedit-text',
        checkpointId: 'checkpoint-1',
      }).map((artifact) => artifact.exportProfileId),
    ).toEqual(['profile-copyedit-text'])
    expect(getMockBookExportArtifacts({ bookId: 'book-signal-arc', checkpointId: 'checkpoint-1' })).toHaveLength(1)
    expect(getMockBookExportArtifacts({ bookId: 'book-signal-arc' })).toHaveLength(1)
  })

  it('exposes cloned artifact reads and build writes through the book client', async () => {
    resetMockBookExportArtifactDb()
    const client = createBookClient()

    await client.buildBookExportArtifact(createBuildInput('markdown'))
    const firstRead = await client.getBookExportArtifacts({ bookId: 'book-signal-arc' })
    firstRead[0]!.content = 'Mutated locally'
    const secondRead = await client.getBookExportArtifacts({ bookId: 'book-signal-arc' })

    expect(secondRead[0]).toMatchObject({
      content: '# Signal Arc',
    })
  })
})
