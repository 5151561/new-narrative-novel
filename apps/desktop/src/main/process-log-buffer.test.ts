import { describe, expect, it } from 'vitest'

import { ProcessLogBuffer } from './process-log-buffer.js'

describe('ProcessLogBuffer', () => {
  it('keeps only the most recent tagged process log lines', () => {
    const buffer = new ProcessLogBuffer(3)

    buffer.append('stdout', 'one\ntwo\n')
    buffer.append('stderr', 'three\nfour\n')

    expect(buffer.getLines()).toEqual(['[stdout] two', '[stderr] three', '[stderr] four'])
  })
})
