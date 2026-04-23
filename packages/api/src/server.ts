import { createServer } from './createServer.js'

const { app, config } = createServer()

try {
  await app.listen({
    host: config.host,
    port: config.port,
  })
  app.log.info(`Fixture API server listening on ${config.host}:${config.port}`)
} catch (error) {
  app.log.error(error)
  process.exitCode = 1
}
