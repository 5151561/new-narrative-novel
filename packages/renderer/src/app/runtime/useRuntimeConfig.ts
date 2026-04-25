import { useEffect, useState } from 'react'

import { createWebRuntimeConfig, resolveRuntimeConfig, type RuntimeConfig, type RuntimeConfigState } from './runtime-config'

function isSameRuntimeConfig(left: RuntimeConfig, right: RuntimeConfig): boolean {
  return left.runtimeMode === right.runtimeMode && left.apiBaseUrl === right.apiBaseUrl
}

function getInitialRuntimeConfigState(): RuntimeConfigState {
  if (typeof window !== 'undefined' && window.narrativeDesktop?.getRuntimeConfig) {
    return {
      status: 'pending',
    }
  }

  return {
    runtimeConfig: createWebRuntimeConfig(),
    status: 'ready',
  }
}

export function useRuntimeConfig(): RuntimeConfigState {
  const [runtimeConfigState, setRuntimeConfigState] = useState<RuntimeConfigState>(() => getInitialRuntimeConfigState())

  useEffect(() => {
    let cancelled = false

    if (!(typeof window !== 'undefined' && window.narrativeDesktop?.getRuntimeConfig)) {
      return () => {
        cancelled = true
      }
    }

    void resolveRuntimeConfig()
      .then((resolvedRuntimeConfig) => {
        if (!cancelled) {
          setRuntimeConfigState((currentRuntimeConfigState) => {
            if (
              currentRuntimeConfigState.status === 'ready'
              && isSameRuntimeConfig(currentRuntimeConfigState.runtimeConfig, resolvedRuntimeConfig)
            ) {
              return currentRuntimeConfigState
            }

            return {
              runtimeConfig: resolvedRuntimeConfig,
              status: 'ready',
            }
          })
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setRuntimeConfigState({
            error: error instanceof Error ? error : new Error(String(error)),
            status: 'error',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return runtimeConfigState
}
