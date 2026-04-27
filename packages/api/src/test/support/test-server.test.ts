import { tmpdir } from 'node:os'

import { describe, expect, it } from 'vitest'

import { resolveDefaultProjectStateFilePath } from '../../repositories/project-state-persistence.js'

import { createTestServer } from './test-server.js'

describe('createTestServer', () => {
  it('uses an isolated temp project state file path by default', async () => {
    const firstServer = createTestServer()
    const secondServer = createTestServer()

    try {
      expect(firstServer.config.projectStateFilePath).toContain(tmpdir())
      expect(firstServer.config.projectStateFilePath).not.toBe(resolveDefaultProjectStateFilePath())
      expect(firstServer.config.projectStateFilePath).not.toBe(secondServer.config.projectStateFilePath)
    } finally {
      await firstServer.app.close()
      await secondServer.app.close()
      await firstServer.cleanupProjectStateFile?.()
      await secondServer.cleanupProjectStateFile?.()
    }
  })
})
