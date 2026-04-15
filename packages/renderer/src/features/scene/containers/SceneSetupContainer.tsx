import { getSetupFormStatusLabel, useI18n } from '@/app/i18n'
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
  const { locale } = useI18n()
  const form = useSceneSetupForm({
    sceneId,
    client,
    onSaveAndRun,
  })

  if (form.error) {
    return (
      <div className="p-5">
        <EmptyState title={locale === 'zh-CN' ? '设定数据不可用' : 'Setup data unavailable'} message={form.error.message} />
      </div>
    )
  }

  if (form.isLoading || !form.draft) {
    return (
      <div className="p-5">
        <EmptyState
          title={locale === 'zh-CN' ? '正在加载设定' : 'Loading setup'}
          message={
            locale === 'zh-CN'
              ? '正在准备场景身份、目标、角色、约束和运行预设。'
              : 'Preparing scene identity, objective, cast, constraints, and runtime preset.'
          }
        />
      </div>
    )
  }

  return (
    <SceneSetupTab
      draft={form.draft}
      isDirty={form.isDirty}
      isSaving={form.isSaving}
      statusLabel={getSetupFormStatusLabel(locale, form.statusKey)}
      onUpdateDraft={form.updateDraft}
      onDiscardChanges={form.discardChanges}
      onSave={() => void form.save()}
      onSaveAndRun={() => void form.saveAndRun()}
    />
  )
}
