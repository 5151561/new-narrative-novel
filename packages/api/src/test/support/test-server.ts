import { createServer } from '../../createServer.js'

export function createTestServer() {
  return createServer({
    config: {
      host: '127.0.0.1',
      port: 4174,
      apiBasePath: '/api',
      apiBaseUrl: 'http://127.0.0.1:4174/api',
      corsOrigin: true,
    },
  })
}

export async function withTestServer(
  run: (server: ReturnType<typeof createTestServer>) => Promise<void> | void,
) {
  const server = createTestServer()

  try {
    await run(server)
  } finally {
    await server.app.close()
  }
}
