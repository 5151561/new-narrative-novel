import type { RunEventRecord } from '../contracts/api-records.js'

interface RunEventStreamSubscriber {
  queue: Array<IteratorResult<RunEventRecord[]>>
  resolve?: (result: IteratorResult<RunEventRecord[]>) => void
  closed: boolean
}

interface RunEventStreamChannel {
  completed: boolean
  subscribers: Set<RunEventStreamSubscriber>
}

function createChannel(): RunEventStreamChannel {
  return {
    completed: false,
    subscribers: new Set(),
  }
}

function doneResult(): IteratorResult<RunEventRecord[]> {
  return {
    done: true,
    value: undefined,
  }
}

export interface RunEventStreamBroker {
  subscribe(runId: string, signal?: AbortSignal): AsyncIterable<RunEventRecord[]>
  publish(runId: string, events: RunEventRecord[]): void
  complete(runId: string): void
  reset(): void
}

export function createRunEventStreamBroker(): RunEventStreamBroker {
  const channels = new Map<string, RunEventStreamChannel>()

  function getChannel(runId: string, createIfMissing = true) {
    const existing = channels.get(runId)
    if (existing) {
      return existing
    }

    if (!createIfMissing) {
      return undefined
    }

    const next = createChannel()
    channels.set(runId, next)
    return next
  }

  function closeSubscriber(channel: RunEventStreamChannel, subscriber: RunEventStreamSubscriber) {
    if (subscriber.closed) {
      return
    }

    subscriber.closed = true
    channel.subscribers.delete(subscriber)
    const result = doneResult()
    if (subscriber.resolve) {
      const resolve = subscriber.resolve
      subscriber.resolve = undefined
      resolve(result)
      return
    }

    subscriber.queue.push(result)
  }

  return {
    subscribe(runId, signal) {
      const channel = getChannel(runId)!
      if (channel.completed) {
        return {
          async *[Symbol.asyncIterator]() {},
        }
      }

      const subscriber: RunEventStreamSubscriber = {
        queue: [],
        closed: false,
      }
      channel.subscribers.add(subscriber)

      const close = () => closeSubscriber(channel, subscriber)
      signal?.addEventListener('abort', close, { once: true })

      return {
        [Symbol.asyncIterator]() {
          return {
            next() {
              if (subscriber.queue.length > 0) {
                return Promise.resolve(subscriber.queue.shift()!)
              }

              if (subscriber.closed) {
                return Promise.resolve(doneResult())
              }

              return new Promise<IteratorResult<RunEventRecord[]>>((resolve) => {
                subscriber.resolve = resolve
              })
            },
            return() {
              signal?.removeEventListener('abort', close)
              close()
              return Promise.resolve(doneResult())
            },
          }
        },
      }
    },
    publish(runId, events) {
      if (!events.length) {
        return
      }

      const channel = getChannel(runId)!
      if (channel.completed) {
        return
      }

      for (const subscriber of channel.subscribers) {
        const result: IteratorResult<RunEventRecord[]> = {
          done: false,
          value: events,
        }

        if (subscriber.resolve) {
          const resolve = subscriber.resolve
          subscriber.resolve = undefined
          resolve(result)
          continue
        }

        subscriber.queue.push(result)
      }
    },
    complete(runId) {
      const channel = getChannel(runId, false)
      if (!channel || channel.completed) {
        return
      }

      channel.completed = true
      for (const subscriber of [...channel.subscribers]) {
        closeSubscriber(channel, subscriber)
      }
      channels.delete(runId)
    },
    reset() {
      for (const runId of [...channels.keys()]) {
        this.complete(runId)
      }

      channels.clear()
    },
  }
}
