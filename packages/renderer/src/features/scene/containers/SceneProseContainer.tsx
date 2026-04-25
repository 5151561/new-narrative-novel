import { useEffect, useState } from 'react'

import { useI18n } from '@/app/i18n'
import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
import { EmptyState } from '@/components/ui/EmptyState'

import type { SceneClient } from '@/features/scene/api/scene-client'

import { SceneProseTab } from '../components/SceneProseTab'
import { useSceneProseQuery } from '../hooks/useSceneProseQuery'

interface SceneProseContainerProps {
  sceneId: string
  client?: SceneClient
}

export function SceneProseContainer({ sceneId, client }: SceneProseContainerProps) {
  const runtime = useOptionalProjectRuntime()
  const { locale } = useI18n()
  const effectiveClient = resolveProjectRuntimeDependency(
    client,
    runtime?.sceneClient,
    'SceneProseContainer',
    'props.client',
  )
  const proseQuery = useSceneProseQuery(sceneId, effectiveClient)
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
        <EmptyState title={locale === 'zh-CN' ? '正文不可用' : 'Prose unavailable'} message={proseQuery.error.message} />
      </div>
    )
  }

  if (proseQuery.isLoading || !proseQuery.prose) {
    return (
      <div className="p-5">
        <EmptyState
          title={locale === 'zh-CN' ? '正在加载正文' : 'Loading prose'}
          message={
            locale === 'zh-CN'
              ? '正在准备当前草稿、修订模式和正文状态栏。'
              : 'Preparing the current draft, revision modes, and prose status footer.'
          }
        />
      </div>
    )
  }

  const prose = proseQuery.prose
  const canReviseDraft = Boolean(prose.proseDraft?.trim())

  return (
    <SceneProseTab
      prose={prose}
      selectedMode={selectedMode}
      isFocusModeActive={isFocusModeActive}
      isRevising={isRevising}
      canReviseDraft={canReviseDraft}
      onSelectMode={setSelectedMode}
      onToggleFocusMode={() => setIsFocusModeActive((current) => !current)}
      onRevise={async () => {
        if (!canReviseDraft) {
          return
        }

        setIsRevising(true)
        try {
          await effectiveClient.reviseSceneProse(sceneId, selectedMode)
          await proseQuery.refetch()
        } finally {
          setIsRevising(false)
        }
      }}
    />
  )
}
