import { EmptyState } from '@/components/ui/EmptyState'

import { type SceneClient } from '@/features/scene/api/scene-client'

import { SceneSetupTab } from '../components/SceneSetupTab'
import { useSceneSetupForm } from '../hooks/useSceneSetupForm'

interface SceneSetupContainerProps {
  sceneId: string
  client?: SceneClient
  onSaveAndRun?: () => void
}

export function SceneSetupContainer({ sceneId, client, onSaveAndRun }: SceneSetupContainerProps) {
  const form = useSceneSetupForm({
    sceneId,
    client,
    onSaveAndRun,
  })

  if (form.error) {
    return (
      <div className="p-5">
        <EmptyState title="Setup data unavailable" message={form.error.message} />
      </div>
    )
  }

  if (form.isLoading || !form.draft) {
    return (
      <div className="p-5">
        <EmptyState
          title="Loading setup"
          message="Preparing scene identity, objective, cast, constraints, and runtime preset."
        />
      </div>
    )
  }

  return (
    <SceneSetupTab
      draft={form.draft}
      isDirty={form.isDirty}
      isSaving={form.isSaving}
      statusLabel={form.statusLabel}
      onUpdateDraft={form.updateDraft}
      onDiscardChanges={form.discardChanges}
      onSave={() => void form.save()}
      onSaveAndRun={() => void form.saveAndRun()}
    />
  )
}
