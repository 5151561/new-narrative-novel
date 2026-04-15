import { useEffect, useState } from 'react'

import { EmptyState } from '@/components/ui/EmptyState'

import { sceneClient, type SceneClient } from '@/features/scene/api/scene-client'

import { SceneProseTab } from '../components/SceneProseTab'
import { useSceneProseQuery } from '../hooks/useSceneProseQuery'

interface SceneProseContainerProps {
  sceneId: string
  client?: SceneClient
}

export function SceneProseContainer({ sceneId, client }: SceneProseContainerProps) {
  const resolvedClient = client ?? sceneClient
  const proseQuery = useSceneProseQuery(sceneId, resolvedClient)
  const [selectedMode, setSelectedMode] = useState<'rewrite' | 'compress' | 'expand' | 'tone_adjust' | 'continuity_fix'>(
    'rewrite',
  )
  const [isRevising, setIsRevising] = useState(false)
  const [isFocusModeActive, setIsFocusModeActive] = useState(false)

  useEffect(() => {
    if (proseQuery.prose?.revisionModes.length) {
      setSelectedMode(proseQuery.prose.revisionModes[0])
    }
    if (!proseQuery.prose?.focusModeAvailable) {
      setIsFocusModeActive(false)
    }
  }, [proseQuery.prose?.focusModeAvailable, proseQuery.prose?.revisionModes, sceneId])

  if (proseQuery.error) {
    return (
      <div className="p-5">
        <EmptyState title="Prose unavailable" message={proseQuery.error.message} />
      </div>
    )
  }

  if (proseQuery.isLoading || !proseQuery.prose) {
    return (
      <div className="p-5">
        <EmptyState
          title="Loading prose"
          message="Preparing the current draft, revision modes, and prose status footer."
        />
      </div>
    )
  }

  const prose = proseQuery.prose

  return (
    <SceneProseTab
      prose={prose}
      selectedMode={selectedMode}
      isFocusModeActive={isFocusModeActive}
      isRevising={isRevising}
      onSelectMode={setSelectedMode}
      onToggleFocusMode={() => setIsFocusModeActive((current) => !current)}
      onRevise={async () => {
        setIsRevising(true)
        try {
          await resolvedClient.reviseSceneProse(sceneId, selectedMode)
          await proseQuery.refetch()
        } finally {
          setIsRevising(false)
        }
      }}
    />
  )
}
