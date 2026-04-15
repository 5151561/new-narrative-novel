import { useI18n } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { SectionCard } from '@/components/ui/SectionCard'
import { StickyFooter } from '@/components/ui/StickyFooter'
import { Toolbar } from '@/components/ui/Toolbar'

import type { SceneSetupViewModel } from '../types/scene-view-models'

interface SceneSetupTabProps {
  draft: SceneSetupViewModel
  isDirty: boolean
  isSaving: boolean
  statusLabel: string
  onUpdateDraft: (updater: (current: SceneSetupViewModel) => SceneSetupViewModel) => void
  onDiscardChanges: () => void
  onSave: () => void
  onSaveAndRun: () => void
}

interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  textarea?: boolean
}

function TextField({ label, value, onChange, placeholder, textarea = false }: TextFieldProps) {
  const fieldClassName =
    'w-full rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm leading-6 text-text-main outline-none transition focus:border-accent'

  return (
    <label className="space-y-1.5">
      <span className="text-xs uppercase tracking-[0.05em] text-text-soft">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={3}
          className={fieldClassName}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={fieldClassName}
        />
      )}
    </label>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs uppercase tracking-[0.05em] text-text-soft">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm text-text-main outline-none transition focus:border-accent"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function SceneIdentitySection({
  draft,
  onUpdateDraft,
}: Pick<SceneSetupTabProps, 'draft' | 'onUpdateDraft'>) {
  const { locale } = useI18n()

  return (
    <SectionCard eyebrow={locale === 'zh-CN' ? '场景设定' : 'Scene Setup'} title={locale === 'zh-CN' ? '身份' : 'Identity'}>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label={locale === 'zh-CN' ? '场景标题' : 'Scene Title'}
          value={draft.identity.title}
          onChange={(value) =>
            onUpdateDraft((current) => ({
              ...current,
              identity: { ...current.identity, title: value },
            }))
          }
        />
        <TextField
          label={locale === 'zh-CN' ? '章节标签' : 'Chapter Label'}
          value={draft.identity.chapterLabel}
          onChange={(value) =>
            onUpdateDraft((current) => ({
              ...current,
              identity: { ...current.identity, chapterLabel: value },
            }))
          }
        />
        <TextField
          label={locale === 'zh-CN' ? '地点' : 'Location'}
          value={draft.identity.locationLabel}
          onChange={(value) =>
            onUpdateDraft((current) => ({
              ...current,
              identity: { ...current.identity, locationLabel: value },
            }))
          }
        />
        <TextField
          label={locale === 'zh-CN' ? '时间窗' : 'Timebox'}
          value={draft.identity.timeboxLabel}
          onChange={(value) =>
            onUpdateDraft((current) => ({
              ...current,
              identity: { ...current.identity, timeboxLabel: value },
            }))
          }
        />
        <SelectField
          label={locale === 'zh-CN' ? '视角角色' : 'POV'}
          value={draft.identity.povCharacterId}
          options={draft.cast.map((member) => ({ value: member.id, label: member.name }))}
          onChange={(value) =>
            onUpdateDraft((current) => ({
              ...current,
              identity: { ...current.identity, povCharacterId: value },
            }))
          }
        />
        <div className="flex items-end gap-2">
          <Badge tone="accent">
            {locale === 'zh-CN'
              ? `${draft.cast.filter((member) => member.selected).length} 个激活角色`
              : `${draft.cast.filter((member) => member.selected).length} active cast`}
          </Badge>
          <Badge tone="neutral">{locale === 'zh-CN' ? `${draft.constraints.length} 条约束` : `${draft.constraints.length} guardrails`}</Badge>
        </div>
        <div className="md:col-span-2">
          <TextField
            label={locale === 'zh-CN' ? '场景摘要' : 'Scene Summary'}
            value={draft.identity.summary}
            textarea
            onChange={(value) =>
              onUpdateDraft((current) => ({
                ...current,
                identity: { ...current.identity, summary: value },
              }))
            }
          />
        </div>
      </div>
    </SectionCard>
  )
}

export function SceneObjectiveSection({
  draft,
  onUpdateDraft,
}: Pick<SceneSetupTabProps, 'draft' | 'onUpdateDraft'>) {
  const { locale } = useI18n()

  return (
    <SectionCard eyebrow={locale === 'zh-CN' ? '意图' : 'Intent'} title={locale === 'zh-CN' ? '目标' : 'Objective'}>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label={locale === 'zh-CN' ? '外部目标' : 'External Goal'}
          value={draft.objective.externalGoal}
          textarea
          onChange={(value) =>
            onUpdateDraft((current) => ({
              ...current,
              objective: { ...current.objective, externalGoal: value },
            }))
          }
        />
        <TextField
          label={locale === 'zh-CN' ? '情感目标' : 'Emotional Goal'}
          value={draft.objective.emotionalGoal}
          textarea
          onChange={(value) =>
            onUpdateDraft((current) => ({
              ...current,
              objective: { ...current.objective, emotionalGoal: value },
            }))
          }
        />
        <TextField
          label={locale === 'zh-CN' ? '成功信号' : 'Success Signal'}
          value={draft.objective.successSignal}
          textarea
          onChange={(value) =>
            onUpdateDraft((current) => ({
              ...current,
              objective: { ...current.objective, successSignal: value },
            }))
          }
        />
        <TextField
          label={locale === 'zh-CN' ? '失败代价' : 'Failure Cost'}
          value={draft.objective.failureCost}
          textarea
          onChange={(value) =>
            onUpdateDraft((current) => ({
              ...current,
              objective: { ...current.objective, failureCost: value },
            }))
          }
        />
      </div>
    </SectionCard>
  )
}

export function SceneCastSection({
  draft,
  onUpdateDraft,
}: Pick<SceneSetupTabProps, 'draft' | 'onUpdateDraft'>) {
  const { locale } = useI18n()

  return (
    <SectionCard eyebrow={locale === 'zh-CN' ? '参与者' : 'Participants'} title={locale === 'zh-CN' ? '角色' : 'Cast'}>
      <div className="grid gap-3">
        {draft.cast.map((member) => (
          <label
            key={member.id}
            className="grid gap-3 rounded-md border border-line-soft bg-surface-2 px-3 py-3 md:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)]"
          >
            <span className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={member.selected}
                onChange={(event) =>
                  onUpdateDraft((current) => ({
                    ...current,
                    cast: current.cast.map((item) =>
                      item.id === member.id ? { ...item, selected: event.target.checked } : item,
                    ),
                  }))
                }
                className="mt-1 rounded border-line-soft text-accent focus:ring-accent"
              />
              <span>
                <span className="block text-sm font-medium text-text-main">{member.name}</span>
                <span className="block text-xs uppercase tracking-[0.05em] text-text-soft">{member.role}</span>
              </span>
            </span>
            <TextField
              label={locale === 'zh-CN' ? '角色定位' : 'Role'}
              value={member.role}
              onChange={(value) =>
                onUpdateDraft((current) => ({
                  ...current,
                  cast: current.cast.map((item) => (item.id === member.id ? { ...item, role: value } : item)),
                }))
              }
            />
            <TextField
              label={locale === 'zh-CN' ? '动机' : 'Agenda'}
              value={member.agenda}
              textarea
              onChange={(value) =>
                onUpdateDraft((current) => ({
                  ...current,
                  cast: current.cast.map((item) => (item.id === member.id ? { ...item, agenda: value } : item)),
                }))
              }
            />
          </label>
        ))}
      </div>
    </SectionCard>
  )
}

export function SceneConstraintSection({
  draft,
  onUpdateDraft,
}: Pick<SceneSetupTabProps, 'draft' | 'onUpdateDraft'>) {
  const { locale } = useI18n()

  return (
    <SectionCard eyebrow={locale === 'zh-CN' ? '约束' : 'Guardrails'} title={locale === 'zh-CN' ? '限制条件' : 'Constraints'}>
      <div className="grid gap-3">
        {draft.constraints.map((constraint) => (
          <div key={constraint.id} className="grid gap-3 rounded-md border border-line-soft bg-surface-2 px-3 py-3 md:grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)]">
            <SelectField
              label={locale === 'zh-CN' ? '约束类型' : 'Constraint Type'}
              value={constraint.kind}
              options={[
                { value: 'canon', label: locale === 'zh-CN' ? '设定' : 'Canon' },
                { value: 'staging', label: locale === 'zh-CN' ? '调度' : 'Staging' },
                { value: 'tone', label: locale === 'zh-CN' ? '语气' : 'Tone' },
                { value: 'timing', label: locale === 'zh-CN' ? '时序' : 'Timing' },
              ]}
              onChange={(value) =>
                onUpdateDraft((current) => ({
                  ...current,
                  constraints: current.constraints.map((item) =>
                    item.id === constraint.id ? { ...item, kind: value as typeof item.kind } : item,
                  ),
                }))
              }
            />
            <TextField
              label={locale === 'zh-CN' ? '标签' : 'Label'}
              value={constraint.label}
              onChange={(value) =>
                onUpdateDraft((current) => ({
                  ...current,
                  constraints: current.constraints.map((item) =>
                    item.id === constraint.id ? { ...item, label: value } : item,
                  ),
                }))
              }
            />
            <TextField
              label={locale === 'zh-CN' ? '摘要' : 'Summary'}
              value={constraint.summary}
              textarea
              onChange={(value) =>
                onUpdateDraft((current) => ({
                  ...current,
                  constraints: current.constraints.map((item) =>
                    item.id === constraint.id ? { ...item, summary: value } : item,
                  ),
                }))
              }
            />
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

export function SceneKnowledgeBoundarySection({
  draft,
  onUpdateDraft,
}: Pick<SceneSetupTabProps, 'draft' | 'onUpdateDraft'>) {
  const { locale } = useI18n()

  return (
    <SectionCard eyebrow={locale === 'zh-CN' ? '读者契约' : 'Reader Contract'} title={locale === 'zh-CN' ? '认知边界' : 'Knowledge Boundaries'}>
      <div className="grid gap-3">
        {draft.knowledgeBoundaries.map((boundary) => (
          <div key={boundary.id} className="grid gap-3 rounded-md border border-line-soft bg-surface-2 px-3 py-3 md:grid-cols-[170px_minmax(0,1fr)_minmax(0,1fr)]">
            <SelectField
              label={locale === 'zh-CN' ? '边界状态' : 'Boundary State'}
              value={boundary.status}
              options={[
                { value: 'known', label: locale === 'zh-CN' ? '已知' : 'Known' },
                { value: 'guarded', label: locale === 'zh-CN' ? '受保护' : 'Guarded' },
                { value: 'open-question', label: locale === 'zh-CN' ? '开放问题' : 'Open Question' },
              ]}
              onChange={(value) =>
                onUpdateDraft((current) => ({
                  ...current,
                  knowledgeBoundaries: current.knowledgeBoundaries.map((item) =>
                    item.id === boundary.id ? { ...item, status: value as typeof item.status } : item,
                  ),
                }))
              }
            />
            <TextField
              label={locale === 'zh-CN' ? '边界' : 'Boundary'}
              value={boundary.label}
              onChange={(value) =>
                onUpdateDraft((current) => ({
                  ...current,
                  knowledgeBoundaries: current.knowledgeBoundaries.map((item) =>
                    item.id === boundary.id ? { ...item, label: value } : item,
                  ),
                }))
              }
            />
            <TextField
              label={locale === 'zh-CN' ? '摘要' : 'Summary'}
              value={boundary.summary}
              textarea
              onChange={(value) =>
                onUpdateDraft((current) => ({
                  ...current,
                  knowledgeBoundaries: current.knowledgeBoundaries.map((item) =>
                    item.id === boundary.id ? { ...item, summary: value } : item,
                  ),
                }))
              }
            />
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

export function SceneRuntimePresetSection({
  draft,
  onUpdateDraft,
}: Pick<SceneSetupTabProps, 'draft' | 'onUpdateDraft'>) {
  const { locale } = useI18n()

  return (
    <SectionCard eyebrow={locale === 'zh-CN' ? '执行偏置' : 'Execution Bias'} title={locale === 'zh-CN' ? '运行预设' : 'Runtime Preset'}>
      <div className="grid gap-3 lg:grid-cols-3">
        {draft.runtimePreset.presetOptions.map((preset) => {
          const isSelected = preset.id === draft.runtimePreset.selectedPresetId

          return (
            <label
              key={preset.id}
              className={`flex cursor-pointer flex-col gap-2 rounded-md border px-3 py-3 transition ${
                isSelected
                  ? 'border-accent bg-[rgba(201,100,66,0.12)] shadow-ringwarm'
                  : 'border-line-soft bg-surface-2'
              }`}
            >
              <span className="flex items-start justify-between gap-3">
                <span>
                  <span className="block text-sm font-medium text-text-main">{preset.label}</span>
                  <span className="block text-xs uppercase tracking-[0.05em] text-text-soft">{preset.focus}</span>
                </span>
                <input
                  type="radio"
                  name="runtime-preset"
                  checked={isSelected}
                  onChange={() =>
                    onUpdateDraft((current) => ({
                      ...current,
                      runtimePreset: { ...current.runtimePreset, selectedPresetId: preset.id },
                    }))
                  }
                  className="mt-1 border-line-soft text-accent focus:ring-accent"
                />
              </span>
              <p className="text-sm leading-6 text-text-muted">{preset.summary}</p>
              <Badge tone={isSelected ? 'accent' : 'neutral'}>{preset.intensity}</Badge>
            </label>
          )
        })}
      </div>
    </SectionCard>
  )
}

export function SceneSetupActionBar({
  isDirty,
  isSaving,
  statusLabel,
  onDiscardChanges,
  onSave,
  onSaveAndRun,
}: Pick<SceneSetupTabProps, 'isDirty' | 'isSaving' | 'statusLabel' | 'onDiscardChanges' | 'onSave' | 'onSaveAndRun'>) {
  const { locale } = useI18n()

  return (
    <StickyFooter>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Toolbar className="border-0 bg-transparent px-0 py-0 shadow-none">
          <Badge tone={isDirty ? 'warn' : 'success'}>
            {isDirty
              ? locale === 'zh-CN'
                ? '有未保存修改'
                : 'Unsaved changes'
              : locale === 'zh-CN'
                ? '草稿已同步'
                : 'Draft synced'}
          </Badge>
          <span className="text-sm text-text-muted">{statusLabel}</span>
        </Toolbar>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onDiscardChanges}
            disabled={!isDirty || isSaving}
            className="rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm disabled:opacity-60"
          >
            {locale === 'zh-CN' ? '丢弃修改' : 'Discard Changes'}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm disabled:opacity-60"
          >
            {locale === 'zh-CN' ? '保存草稿' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={onSaveAndRun}
            disabled={isSaving}
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {locale === 'zh-CN' ? '保存并打开执行视图' : 'Save And Open Execution'}
          </button>
        </div>
      </div>
    </StickyFooter>
  )
}

export function SceneSetupTab({
  draft,
  isDirty,
  isSaving,
  statusLabel,
  onUpdateDraft,
  onDiscardChanges,
  onSave,
  onSaveAndRun,
}: SceneSetupTabProps) {
  const { locale } = useI18n()
  const selectedCastCount = draft.cast.filter((member) => member.selected).length

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <Toolbar className="mb-4 justify-between border border-line-soft bg-surface-1 px-4 py-3 shadow-ringwarm">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.05em] text-text-soft">{locale === 'zh-CN' ? '场景设定简报' : 'Scene Setup Brief'}</p>
            <p className="text-sm text-text-muted">
              {locale === 'zh-CN'
                ? '在重新进入执行评审之前，先把目标、角色、约束和运行姿态锁定。'
                : 'Lock the objective, cast, constraints, and runtime posture before you re-enter execution review.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{locale === 'zh-CN' ? `${selectedCastCount} 个激活角色` : `${selectedCastCount} active cast`}</Badge>
            <Badge tone="neutral">{locale === 'zh-CN' ? `${draft.constraints.length} 条约束` : `${draft.constraints.length} constraints`}</Badge>
            <Badge tone="neutral">{locale === 'zh-CN' ? `${draft.knowledgeBoundaries.length} 条边界` : `${draft.knowledgeBoundaries.length} boundaries`}</Badge>
          </div>
        </Toolbar>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="grid content-start gap-4">
            <SceneIdentitySection draft={draft} onUpdateDraft={onUpdateDraft} />
            <SceneObjectiveSection draft={draft} onUpdateDraft={onUpdateDraft} />
            <SceneCastSection draft={draft} onUpdateDraft={onUpdateDraft} />
          </div>
          <div className="grid content-start gap-4">
            <SceneConstraintSection draft={draft} onUpdateDraft={onUpdateDraft} />
            <SceneKnowledgeBoundarySection draft={draft} onUpdateDraft={onUpdateDraft} />
            <SceneRuntimePresetSection draft={draft} onUpdateDraft={onUpdateDraft} />
          </div>
        </div>
      </div>
      <SceneSetupActionBar
        isDirty={isDirty}
        isSaving={isSaving}
        statusLabel={statusLabel}
        onDiscardChanges={onDiscardChanges}
        onSave={onSave}
        onSaveAndRun={onSaveAndRun}
      />
    </div>
  )
}
