import { useEffect, useMemo, useState } from 'react'

import { useQuery, useQueryClient } from '@tanstack/react-query'

import { sceneClient, type SceneClient } from '@/features/scene/api/scene-client'

import type { SceneSetupViewModel } from '../types/scene-view-models'
import { sceneQueryKeys } from './scene-query-keys'

function clone<T>(value: T): T {
  return structuredClone(value)
}

interface UseSceneSetupFormOptions {
  sceneId: string
  client?: SceneClient
  onSaveAndRun?: () => void
}

export function useSceneSetupForm({
  sceneId,
  client = sceneClient,
  onSaveAndRun,
}: UseSceneSetupFormOptions) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: sceneQueryKeys.setup(sceneId),
    queryFn: () => client.getSceneSetup(sceneId),
  })
  const [draft, setDraft] = useState<SceneSetupViewModel | null>(null)
  const [savedSnapshot, setSavedSnapshot] = useState<SceneSetupViewModel | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [statusLabel, setStatusLabel] = useState('Draft is synced with fixtures.')

  const isDirty = useMemo(() => {
    if (!draft || !savedSnapshot) {
      return false
    }

    return JSON.stringify(draft) !== JSON.stringify(savedSnapshot)
  }, [draft, savedSnapshot])

  useEffect(() => {
    if (!query.data) {
      return
    }

    if (!draft || draft.sceneId !== sceneId || !savedSnapshot || savedSnapshot.sceneId !== sceneId) {
      const nextValue = clone(query.data)
      setDraft(nextValue)
      setSavedSnapshot(nextValue)
    }
  }, [draft, query.data, savedSnapshot, sceneId])

  const updateDraft = (updater: (current: SceneSetupViewModel) => SceneSetupViewModel) => {
    setDraft((current) => {
      if (!current) {
        return current
      }

      return updater(current)
    })
    setStatusLabel('Unsaved local changes')
  }

  const discardChanges = () => {
    if (!savedSnapshot) {
      return
    }

    const restoredSnapshot = clone(savedSnapshot)
    setDraft(restoredSnapshot)
    setStatusLabel('Local changes discarded')
    queryClient.setQueryData(sceneQueryKeys.setup(sceneId), restoredSnapshot)
  }

  const persist = async (nextStatusLabel: string) => {
    if (!draft) {
      return
    }

    setIsSaving(true)
    try {
      const nextSnapshot = clone(draft)
      await client.saveSceneSetup(sceneId, nextSnapshot)
      setSavedSnapshot(nextSnapshot)
      setDraft(nextSnapshot)
      setStatusLabel(nextStatusLabel)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: sceneQueryKeys.setup(sceneId) }),
        queryClient.invalidateQueries({ queryKey: sceneQueryKeys.workspace(sceneId) }),
        queryClient.invalidateQueries({ queryKey: sceneQueryKeys.execution(sceneId) }),
        queryClient.invalidateQueries({ queryKey: sceneQueryKeys.inspector(sceneId) }),
      ])
    } finally {
      setIsSaving(false)
    }
  }

  return {
    draft: draft ?? query.data,
    isLoading: query.isLoading,
    error: query.error,
    isDirty,
    isSaving,
    statusLabel,
    updateDraft,
    discardChanges,
    save: async () => {
      await persist('Draft saved locally')
    },
    saveAndRun: async () => {
      await persist('Draft saved locally and moved to execution')
      onSaveAndRun?.()
    },
  }
}
