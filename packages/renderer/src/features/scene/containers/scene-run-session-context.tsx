import type { PropsWithChildren } from 'react'
import { createContext, useContext } from 'react'

import { useSceneRunSession } from '@/features/run/hooks/useSceneRunSession'

const SceneRunSessionContext = createContext<ReturnType<typeof useSceneRunSession> | null>(null)

interface SceneRunSessionProviderProps extends PropsWithChildren {
  sceneId: string
  runId?: string | null
  latestRunId?: string | null
}

export function SceneRunSessionProvider({
  children,
  sceneId,
  runId,
  latestRunId,
}: SceneRunSessionProviderProps) {
  const session = useSceneRunSession({
    sceneId,
    runId,
    latestRunId,
  })

  return <SceneRunSessionContext.Provider value={session}>{children}</SceneRunSessionContext.Provider>
}

export function useSharedSceneRunSession() {
  const session = useContext(SceneRunSessionContext)

  if (!session) {
    throw new Error('useSharedSceneRunSession must be used within SceneRunSessionProvider.')
  }

  return session
}
