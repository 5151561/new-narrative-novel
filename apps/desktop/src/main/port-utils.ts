import net from 'node:net'

export interface FindAvailablePortOptions {
  host?: string
}

export async function findAvailablePort({ host = '127.0.0.1' }: FindAvailablePortOptions = {}): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()

    server.once('error', reject)
    server.listen(0, host, () => {
      const address = server.address()
      server.close(() => {
        if (address && typeof address === 'object') {
          resolve(address.port)
          return
        }

        reject(new Error('Unable to allocate an available local API port.'))
      })
    })
  })
}
