import { describe, expect, it } from 'vitest'

import { createRunEventStreamBroker } from './run-event-stream-broker.js'

function createEvent(id: string) {
  return {
    id,
    runId: 'run-stream-001',
    order: Number(id.split('-').at(-1) ?? '0'),
    kind: 'run_started' as const,
    label: `Event ${id}`,
    summary: `Summary ${id}`,
    createdAtLabel: '2026-04-27 10:00',
  }
}

describe('runEventStreamBroker', () => {
  it('delivers published product event batches to subscribers and closes after completion', async () => {
    const broker = createRunEventStreamBroker()
    const iterator = broker.subscribe('run-stream-001')[Symbol.asyncIterator]()

    const firstBatchPromise = iterator.next()
    broker.publish('run-stream-001', [createEvent('run-event-001'), createEvent('run-event-002')])

    await expect(firstBatchPromise).resolves.toEqual({
      done: false,
      value: [createEvent('run-event-001'), createEvent('run-event-002')],
    })

    const completionPromise = iterator.next()
    broker.complete('run-stream-001')

    await expect(completionPromise).resolves.toEqual({
      done: true,
      value: undefined,
    })
  })

  it('allows the same key to be reused after completion for a later run stream', async () => {
    const broker = createRunEventStreamBroker()

    const firstIterator = broker.subscribe('run-stream-001')[Symbol.asyncIterator]()
    const firstBatchPromise = firstIterator.next()
    broker.publish('run-stream-001', [createEvent('run-event-003')])
    await expect(firstBatchPromise).resolves.toEqual({
      done: false,
      value: [createEvent('run-event-003')],
    })

    broker.complete('run-stream-001')

    const iterator = broker.subscribe('run-stream-001')[Symbol.asyncIterator]()
    const nextBatchPromise = iterator.next()
    broker.publish('run-stream-001', [createEvent('run-event-004')])

    await expect(nextBatchPromise).resolves.toEqual({
      done: false,
      value: [createEvent('run-event-004')],
    })
  })

  it('delivers the final batch before cancellation closes the stream', async () => {
    const broker = createRunEventStreamBroker()
    const iterator = broker.subscribe('run-stream-001')[Symbol.asyncIterator]()

    const firstBatchPromise = iterator.next()
    broker.publish('run-stream-001', [createEvent('run-event-005')])
    broker.complete('run-stream-001')

    await expect(firstBatchPromise).resolves.toEqual({
      done: false,
      value: [createEvent('run-event-005')],
    })
    await expect(iterator.next()).resolves.toEqual({
      done: true,
      value: undefined,
    })
  })
})
