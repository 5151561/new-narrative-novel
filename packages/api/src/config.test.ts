import { afterEach, describe, expect, it } from 'vitest'

import { getApiServerConfig } from './config.js'

const originalEnv = { ...process.env }

describe('getApiServerConfig', () => {
  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('rejects a PORT value that is not a full integer string', () => {
    process.env.PORT = '12abc'

    expect(() => getApiServerConfig()).toThrowError('PORT must be a full integer string between 0 and 65535')
  })

  it('rejects a PORT value outside the valid port range', () => {
    process.env.PORT = '70000'

    expect(() => getApiServerConfig()).toThrowError('PORT must be a full integer string between 0 and 65535')
  })
})
