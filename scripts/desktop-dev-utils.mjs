import net from 'node:net'

const DEFAULT_RENDERER_DEV_PORT = 5173
const LOCAL_RENDERER_DEV_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

function normalizeListenHost(hostname) {
  return hostname === '[::1]' ? '::1' : hostname
}

function getRequestedPort(url) {
  return Number(url.port || DEFAULT_RENDERER_DEV_PORT)
}

function assertLocalRendererDevUrl(url) {
  if (!LOCAL_RENDERER_DEV_HOSTS.has(url.hostname)) {
    throw new Error(`Renderer dev URL must use a local loopback host: ${url.origin}`)
  }
}

export async function isPortAvailable(port, hostname = '127.0.0.1') {
  return new Promise((resolve) => {
    const server = net.createServer()

    server.unref()
    server.once('error', () => {
      resolve(false)
    })
    server.listen({ host: normalizeListenHost(hostname), port }, () => {
      server.close(() => {
        resolve(true)
      })
    })
  })
}

export async function resolveRendererDevServer({
  requestedUrl,
  reuseRenderer,
  strictRequestedPort,
  isPortAvailable: checkPortAvailable = isPortAvailable,
}) {
  const url = new URL(requestedUrl)
  assertLocalRendererDevUrl(url)

  if (reuseRenderer) {
    return {
      shouldStartRenderer: false,
      url: url.toString(),
    }
  }

  const requestedPort = getRequestedPort(url)

  if (await checkPortAvailable(requestedPort, url.hostname)) {
    url.port = String(requestedPort)
    return {
      shouldStartRenderer: true,
      url: url.toString(),
    }
  }

  if (strictRequestedPort) {
    throw new Error(
      `Renderer dev port ${requestedPort} is already in use. Stop that process, choose another NARRATIVE_RENDERER_DEV_URL, or set NARRATIVE_DESKTOP_REUSE_RENDERER=1 to attach to it.`,
    )
  }

  for (let port = requestedPort + 1; port <= 65_535; port += 1) {
    if (await checkPortAvailable(port, url.hostname)) {
      url.port = String(port)
      return {
        shouldStartRenderer: true,
        url: url.toString(),
      }
    }
  }

  throw new Error(`No available renderer dev port found at or above ${requestedPort}.`)
}
