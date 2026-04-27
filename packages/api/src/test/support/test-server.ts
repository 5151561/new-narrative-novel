import { mkdtempSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { createServer } from '../../createServer.js'

interface CreateTestServerOptions {
  projectStateFilePath?: string
}

function createIsolatedProjectStateFilePath() {
  const directory = mkdtempSync(path.join(tmpdir(), 'narrative-api-test-'))

  return {
    directory,
    filePath: path.join(directory, 'prototype-state.json'),
  }
}

export function createTestServer(options: CreateTestServerOptions = {}) {
  const isolatedState = options.projectStateFilePath ? null : createIsolatedProjectStateFilePath()
  const server = createServer({
    config: {
      host: '127.0.0.1',
      port: 4174,
      apiBasePath: '/api',
      apiBaseUrl: 'http://127.0.0.1:4174/api',
      corsOrigin: true,
      projectStateFilePath: options.projectStateFilePath ?? isolatedState!.filePath,
    },
  })

  return {
    ...server,
    async cleanupProjectStateFile() {
      if (!isolatedState) {
        return
      }

      await rm(isolatedState.directory, {
        recursive: true,
        force: true,
      })
    },
  }
}

export async function withTestServer(
  run: (server: ReturnType<typeof createTestServer>) => Promise<void> | void,
  options?: CreateTestServerOptions,
) {
  const server = createTestServer(options)

  try {
    await run(server)
  } finally {
    await server.app.close()
    await server.cleanupProjectStateFile()
  }
}
