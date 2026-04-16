import { useEffect, useMemo, useState } from 'react'

import { useI18n } from '@/app/i18n'
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
  const { locale } = useI18n()
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: sceneQueryKeys.setup(sceneId, locale),
    queryFn: () => client.getSceneSetup(sceneId),
  })
  const [draft, setDraft] = useState<SceneSetupViewModel | null>(null)
  const [savedSnapshot, setSavedSnapshot] = useState<SceneSetupViewModel | null>(null)
  const [draftLocale, setDraftLocale] = useState(locale)
  const [isSaving, setIsSaving] = useState(false)
  const [statusKey, setStatusKey] = useState<'synced' | 'unsaved' | 'discarded' | 'saved' | 'saved_and_opened'>(
    'synced',
  )

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

    if (
      !draft ||
      draft.sceneId !== sceneId ||
      !savedSnapshot ||
      savedSnapshot.sceneId !== sceneId ||
      draftLocale !== locale
    ) {
      const nextValue = clone(query.data)
      setDraft(nextValue)
      setSavedSnapshot(nextValue)
      setDraftLocale(locale)
      setStatusKey('synced')
    }
  }, [draft, draftLocale, locale, query.data, savedSnapshot, sceneId])

  const updateDraft = (updater: (current: SceneSetupViewModel) => SceneSetupViewModel) => {
    setDraft((current) => {
      if (!current) {
        return current
      }

      return updater(current)
    })
    setStatusKey('unsaved')
  }

  const discardChanges = () => {
    if (!savedSnapshot) {
      return
    }

    const restoredSnapshot = clone(savedSnapshot)
    setDraft(restoredSnapshot)
    setDraftLocale(locale)
    setStatusKey('discarded')
    queryClient.setQueryData(sceneQueryKeys.setup(sceneId, locale), restoredSnapshot)
  }

  const persist = async (nextStatusKey: 'saved' | 'saved_and_opened') => {
    if (!draft) {
      return
    }

    setIsSaving(true)
    try {
      await client.saveSceneSetup(sceneId, clone(draft))
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: sceneQueryKeys.setup(sceneId) }),
        queryClient.invalidateQueries({ queryKey: sceneQueryKeys.workspace(sceneId) }),
        queryClient.invalidateQueries({ queryKey: sceneQueryKeys.execution(sceneId) }),
        queryClient.invalidateQueries({ queryKey: sceneQueryKeys.inspector(sceneId) }),
      ])
      const refreshedSetup = await queryClient.fetchQuery({
        queryKey: sceneQueryKeys.setup(sceneId, locale),
        queryFn: () => client.getSceneSetup(sceneId),
      })
      const nextSnapshot = clone(refreshedSetup)
      setSavedSnapshot(nextSnapshot)
      setDraft(nextSnapshot)
      setDraftLocale(locale)
      setStatusKey(nextStatusKey)
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
    statusKey,
    updateDraft,
    discardChanges,
    save: async () => {
      await persist('saved')
    },
    saveAndRun: async () => {
      await persist('saved_and_opened')
      onSaveAndRun?.()
    },
  }
}
