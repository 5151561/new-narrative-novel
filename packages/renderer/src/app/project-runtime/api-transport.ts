export type ApiQueryValue = string | number | boolean | null | undefined

export interface ApiRequestOptions<TBody = unknown> {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  query?: Record<string, ApiQueryValue>
  body?: TBody
  signal?: AbortSignal
}

export interface ApiTransport {
  requestJson<TResponse, TBody = unknown>(options: ApiRequestOptions<TBody>): Promise<TResponse>
}

export class ApiRequestError extends Error {
  status: number
  code?: string
  detail?: unknown

  constructor({
    status,
    message,
    code,
    detail,
  }: {
    status: number
    message: string
    code?: string
    detail?: unknown
  }) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
    this.detail = detail
  }
}

interface CreateApiTransportOptions {
  baseUrl?: string
  fetch?: typeof fetch
}

function buildUrl(path: string, query?: Record<string, ApiQueryValue>, baseUrl?: string) {
  const url = baseUrl ? new URL(path, baseUrl) : new URL(path, 'http://localhost')

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null) {
      continue
    }

    url.searchParams.set(key, String(value))
  }

  if (baseUrl) {
    return url.toString()
  }

  return `${url.pathname}${url.search}`
}

function parseJsonText(text: string, status: number) {
  try {
    return JSON.parse(text)
  } catch {
    throw new ApiRequestError({
      status,
      message: 'Malformed JSON response',
      detail: text,
    })
  }
}

function tryParseJsonText(text: string) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export function createApiTransport({
  baseUrl = '',
  fetch: fetchImpl = globalThis.fetch.bind(globalThis),
}: CreateApiTransportOptions = {}): ApiTransport {
  return {
    async requestJson<TResponse, TBody = unknown>({
      method,
      path,
      query,
      body,
      signal,
    }: ApiRequestOptions<TBody>): Promise<TResponse> {
      const response = await fetchImpl(buildUrl(path, query, baseUrl), {
        method,
        signal,
        headers: body === undefined
          ? {
              Accept: 'application/json',
            }
          : {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
        body: body === undefined ? undefined : JSON.stringify(body),
      })

      const text = await response.text()

      if (!response.ok) {
        const payload = text.trim() === '' ? null : tryParseJsonText(text)
        const payloadMessage =
          payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
            ? payload.message
            : undefined
        const payloadCode =
          payload && typeof payload === 'object' && 'code' in payload && typeof payload.code === 'string'
            ? payload.code
            : undefined
        const payloadDetail = payload && typeof payload === 'object' && 'detail' in payload ? payload.detail : text || undefined

        throw new ApiRequestError({
          status: response.status,
          message: payloadMessage ?? response.statusText ?? `Request failed with status ${response.status}`,
          code: payloadCode,
          detail: payloadDetail,
        })
      }

      if (response.status === 204 || text.trim() === '') {
        return undefined as TResponse
      }

      return parseJsonText(text, response.status) as TResponse
    },
  }
}
