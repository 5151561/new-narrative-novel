import { fileURLToPath } from 'node:url'

import { afterEach, describe, expect, it } from 'vitest'

import { getApiServerConfig } from './config.js'

const originalEnv = { ...process.env }
const defaultProjectStateFilePath = fileURLToPath(
  new URL('../../../.narrative/prototype-state.json', import.meta.url),
)

describe('getApiServerConfig', () => {
  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('defaults the project state file path to the workspace .narrative directory', () => {
    expect(getApiServerConfig()).toMatchObject({
      projectStateFilePath: defaultProjectStateFilePath,
    })
  })

  it('prefers NARRATIVE_PROJECT_STATE_FILE when present', () => {
    process.env.NARRATIVE_PROJECT_STATE_FILE = '/tmp/narrative/custom-state.json'

    expect(getApiServerConfig()).toMatchObject({
      projectStateFilePath: '/tmp/narrative/custom-state.json',
    })
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
