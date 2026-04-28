import { useEffect, useMemo, useState } from 'react'

import { getModelBindingRoleLabel, useI18n } from '@/app/i18n'

import {
  useOptionalModelSettingsController,
  type DesktopModelBindingRole,
  type DesktopModelBindings,
  type OpenAiCompatibleProviderProfile,
  type ProviderCredentialStatus,
} from './ModelSettingsProvider'

interface ModelSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const roleOrder: DesktopModelBindingRole[] = [
  'planner',
  'sceneProseWriter',
  'sceneRevision',
  'continuityReviewer',
  'summary',
]

const requiredRealProjectRoles: DesktopModelBindingRole[] = ['planner', 'sceneProseWriter']

function createBindingsDraft(bindings?: DesktopModelBindings | null) {
  return {
    continuityReviewer: {
      modelId: bindings?.continuityReviewer.provider === 'openai-compatible' ? bindings.continuityReviewer.modelId : '',
      providerId: bindings?.continuityReviewer.provider === 'openai-compatible' ? bindings.continuityReviewer.providerId : 'fixture',
    },
    planner: {
      modelId: bindings?.planner.provider === 'openai-compatible' ? bindings.planner.modelId : '',
      providerId: bindings?.planner.provider === 'openai-compatible' ? bindings.planner.providerId : 'fixture',
    },
    sceneProseWriter: {
      modelId: bindings?.sceneProseWriter.provider === 'openai-compatible' ? bindings.sceneProseWriter.modelId : '',
      providerId: bindings?.sceneProseWriter.provider === 'openai-compatible' ? bindings.sceneProseWriter.providerId : 'fixture',
    },
    sceneRevision: {
      modelId: bindings?.sceneRevision.provider === 'openai-compatible' ? bindings.sceneRevision.modelId : '',
      providerId: bindings?.sceneRevision.provider === 'openai-compatible' ? bindings.sceneRevision.providerId : 'fixture',
    },
    summary: {
      modelId: bindings?.summary.provider === 'openai-compatible' ? bindings.summary.modelId : '',
      providerId: bindings?.summary.provider === 'openai-compatible' ? bindings.summary.providerId : 'fixture',
    },
  }
}

function createProviderDraft(profile?: OpenAiCompatibleProviderProfile) {
  return {
    id: profile?.id ?? '',
    label: profile?.label ?? '',
    baseUrl: profile?.baseUrl ?? '',
  }
}

function getCredentialStatus(credentialStatuses: ProviderCredentialStatus[], providerId: string) {
  return credentialStatuses.find((status) => status.providerId === providerId)
}

export function ModelSettingsDialog({ open, onOpenChange }: ModelSettingsDialogProps) {
  const controller = useOptionalModelSettingsController()
  const { dictionary, locale } = useI18n()
  const [newProviderDraft, setNewProviderDraft] = useState(() => createProviderDraft())
  const [providerDrafts, setProviderDrafts] = useState<Record<string, OpenAiCompatibleProviderProfile>>({})
  const [credentialDrafts, setCredentialDrafts] = useState<Record<string, string>>({})
  const [bindingsDraft, setBindingsDraft] = useState(() => createBindingsDraft())

  useEffect(() => {
    if (controller?.snapshot) {
      setBindingsDraft(createBindingsDraft(controller.snapshot.bindings))
      setProviderDrafts(Object.fromEntries(
        controller.snapshot.providers.map((provider) => [provider.id, { ...provider }]),
      ))
      setCredentialDrafts({})
      setNewProviderDraft(createProviderDraft())
    }
  }, [controller?.snapshot])

  const providers = controller?.snapshot?.providers ?? []
  const credentialStatuses = controller?.snapshot?.credentialStatuses ?? []
  const providerOptions = useMemo(() => [
    { id: 'fixture', label: dictionary.shell.modelFixtureOptionLabel },
    ...providers.map((provider) => ({ id: provider.id, label: provider.label })),
  ], [dictionary.shell.modelFixtureOptionLabel, providers])

  if (!open || !controller?.supported) {
    return null
  }

  const snapshot = controller.snapshot
  const readinessSummary = snapshot ? getRealProjectReadinessSummary(snapshot, locale) : null

  return (
    <div className="absolute inset-0 z-20 flex items-start justify-end bg-app/70 p-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={dictionary.shell.modelSettingsTitle}
        className="w-full max-w-5xl rounded-md border border-line-soft bg-surface-1 shadow-ringwarm"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line-soft px-4 py-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.05em] text-text-soft">{dictionary.shell.modelSettingsEyebrow}</p>
            <h3 className="text-lg leading-tight">{dictionary.shell.modelSettingsTitle}</h3>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm"
          >
            {dictionary.common.close}
          </button>
        </div>
        <div className="space-y-6 px-4 py-4">
          {controller.loading || !snapshot ? (
            <p className="text-sm text-text-muted">{dictionary.common.loading}</p>
          ) : (
            <>
              <section className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-text-main">{dictionary.shell.providerProfilesTitle}</h4>
                  <p className="text-sm text-text-muted">{dictionary.shell.providerProfilesDescription}</p>
                </div>

                <div className="grid gap-3 rounded-md border border-dashed border-line-soft bg-surface-2 px-4 py-4 md:grid-cols-[1fr_1fr_1.4fr_auto]">
                  <label className="space-y-2">
                    <span className="text-sm text-text-main">{dictionary.shell.providerProfileIdLabel}</span>
                    <input
                      aria-label={dictionary.shell.providerProfileIdInput}
                      value={newProviderDraft.id}
                      onChange={(event) => setNewProviderDraft((current) => ({ ...current, id: event.target.value }))}
                      className="w-full rounded-md border border-line-soft bg-app px-3 py-2 text-sm text-text-main"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-text-main">{dictionary.shell.providerProfileLabelLabel}</span>
                    <input
                      aria-label={dictionary.shell.providerProfileLabelInput}
                      value={newProviderDraft.label}
                      onChange={(event) => setNewProviderDraft((current) => ({ ...current, label: event.target.value }))}
                      className="w-full rounded-md border border-line-soft bg-app px-3 py-2 text-sm text-text-main"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-text-main">{dictionary.shell.providerProfileBaseUrlLabel}</span>
                    <input
                      aria-label={dictionary.shell.providerProfileBaseUrlInput}
                      value={newProviderDraft.baseUrl}
                      onChange={(event) => setNewProviderDraft((current) => ({ ...current, baseUrl: event.target.value }))}
                      className="w-full rounded-md border border-line-soft bg-app px-3 py-2 text-sm text-text-main"
                    />
                  </label>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => void controller.saveProviderProfile(newProviderDraft)}
                      disabled={!newProviderDraft.id.trim() || !newProviderDraft.label.trim() || !newProviderDraft.baseUrl.trim() || controller.saving}
                      className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                    >
                      {dictionary.shell.createProviderProfile}
                    </button>
                  </div>
                </div>

                {providers.map((provider) => {
                  const draft = providerDrafts[provider.id] ?? provider
                  const credentialStatus = getCredentialStatus(credentialStatuses, provider.id)
                  const credentialSummary = credentialStatus?.configured
                    ? credentialStatus.redactedValue ?? dictionary.shell.keyConfigured
                    : dictionary.shell.keyMissing

                  return (
                    <div key={provider.id} className="space-y-4 rounded-md border border-line-soft bg-surface-2 px-4 py-4">
                      <div className="grid gap-3 md:grid-cols-[1fr_1fr_1.4fr_auto_auto]">
                        <label className="space-y-2">
                          <span className="text-sm text-text-main">{dictionary.shell.providerProfileIdLabel}</span>
                          <input
                            aria-label={dictionary.shell.providerProfileEditorIdInput(provider.id)}
                            value={draft.id}
                            disabled
                            className="w-full rounded-md border border-line-soft bg-app px-3 py-2 text-sm text-text-main"
                          />
                        </label>
                        <label className="space-y-2">
                          <span className="text-sm text-text-main">{dictionary.shell.providerProfileLabelLabel}</span>
                          <input
                            aria-label={dictionary.shell.providerProfileEditorLabelInput(provider.id)}
                            value={draft.label}
                            onChange={(event) => {
                              const nextValue = event.target.value
                              setProviderDrafts((current) => ({
                                ...current,
                                [provider.id]: {
                                  ...draft,
                                  label: nextValue,
                                },
                              }))
                            }}
                            className="w-full rounded-md border border-line-soft bg-app px-3 py-2 text-sm text-text-main"
                          />
                        </label>
                        <label className="space-y-2">
                          <span className="text-sm text-text-main">{dictionary.shell.providerProfileBaseUrlLabel}</span>
                          <input
                            aria-label={dictionary.shell.providerProfileEditorBaseUrlInput(provider.id)}
                            value={draft.baseUrl}
                            onChange={(event) => {
                              const nextValue = event.target.value
                              setProviderDrafts((current) => ({
                                ...current,
                                [provider.id]: {
                                  ...draft,
                                  baseUrl: nextValue,
                                },
                              }))
                            }}
                            className="w-full rounded-md border border-line-soft bg-app px-3 py-2 text-sm text-text-main"
                          />
                        </label>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => void controller.saveProviderProfile(draft)}
                            disabled={!draft.id.trim() || !draft.label.trim() || !draft.baseUrl.trim() || controller.saving}
                            className="rounded-md border border-line-soft px-3 py-2 text-sm text-text-main disabled:opacity-60"
                          >
                            {dictionary.shell.saveProviderProfile(provider.label)}
                          </button>
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => void controller.deleteProviderProfile(provider.id)}
                            disabled={controller.saving}
                            className="rounded-md border border-line-soft px-3 py-2 text-sm text-text-main disabled:opacity-60"
                          >
                            {dictionary.shell.deleteProviderProfile(provider.label)}
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                        <label className="space-y-2">
                          <span className="text-sm text-text-main">
                            {dictionary.shell.providerCredentialInputLabel(provider.label)}
                          </span>
                          <input
                            aria-label={dictionary.shell.providerCredentialInput(provider.label)}
                            type="password"
                            value={credentialDrafts[provider.id] ?? ''}
                            onChange={(event) => {
                              const nextValue = event.target.value
                              setCredentialDrafts((current) => ({
                                ...current,
                                [provider.id]: nextValue,
                              }))
                            }}
                            className="w-full rounded-md border border-line-soft bg-app px-3 py-2 text-sm text-text-main"
                          />
                        </label>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => void controller.saveProviderCredential(provider.id, credentialDrafts[provider.id] ?? '')}
                            disabled={!credentialDrafts[provider.id]?.trim() || controller.saving}
                            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                          >
                            {dictionary.shell.saveProviderCredential(provider.label)}
                          </button>
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => void controller.deleteProviderCredential(provider.id)}
                            disabled={!credentialStatus?.configured || controller.saving}
                            className="rounded-md border border-line-soft px-3 py-2 text-sm text-text-main disabled:opacity-60"
                          >
                            {dictionary.shell.clearProviderCredential(provider.label)}
                          </button>
                        </div>
                      </div>

                      <p className="text-sm text-text-muted">
                        {locale === 'zh-CN'
                          ? `${provider.label}：${credentialSummary}`
                          : `${provider.label}: ${credentialSummary}`}
                      </p>
                    </div>
                  )
                })}
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-text-main">{dictionary.shell.modelRoleBindingsTitle}</h4>
                    <p className="text-sm text-text-muted">{dictionary.shell.modelRoleBindingsDescription}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void controller.testConnection()}
                    disabled={controller.testing}
                    className="rounded-md border border-line-soft px-3 py-2 text-sm text-text-main disabled:opacity-60"
                  >
                    {dictionary.shell.testModelConnection}
                  </button>
                </div>
                {readinessSummary ? (
                  <div className="rounded-md border border-line-soft bg-surface-2 px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-line-soft bg-app px-2 py-1 text-xs font-medium text-text-main">
                        {readinessSummary.statusLabel}
                      </span>
                      <span className="rounded-md border border-line-soft bg-app px-2 py-1 text-xs text-text-muted">
                        {readinessSummary.requiredRolesLabel}
                      </span>
                      <span className="rounded-md border border-line-soft bg-app px-2 py-1 text-xs text-text-muted">
                        {readinessSummary.connectionLabel}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-text-muted">{readinessSummary.summary}</p>
                  </div>
                ) : null}
                {roleOrder.map((role) => {
                  const draft = bindingsDraft[role]
                  const roleLabel = getModelBindingRoleLabel(locale, role)
                  const usesFixture = draft.providerId === 'fixture'

                  return (
                    <div key={role} className="grid gap-3 rounded-md border border-line-soft bg-surface-2 px-4 py-4 md:grid-cols-[1.2fr_1fr_auto]">
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-text-main">{roleLabel}</span>
                        <select
                          aria-label={dictionary.shell.modelSettingsRoleProviderLabel(roleLabel)}
                          value={draft.providerId}
                          onChange={(event) => {
                            const providerId = event.target.value
                            setBindingsDraft((currentDraft) => ({
                              ...currentDraft,
                              [role]: {
                                ...currentDraft[role],
                                modelId: providerId === 'fixture' ? '' : currentDraft[role].modelId,
                                providerId,
                              },
                            }))
                          }}
                          className="w-full rounded-md border border-line-soft bg-app px-3 py-2 text-sm text-text-main"
                        >
                          {providerOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-text-main">{dictionary.shell.modelIdLabel}</span>
                        <input
                          aria-label={dictionary.shell.modelSettingsRoleModelLabel(roleLabel)}
                          value={draft.modelId}
                          disabled={usesFixture}
                          onChange={(event) => {
                            const modelId = event.target.value
                            setBindingsDraft((currentDraft) => ({
                              ...currentDraft,
                              [role]: {
                                ...currentDraft[role],
                                modelId,
                              },
                            }))
                          }}
                          className="w-full rounded-md border border-line-soft bg-app px-3 py-2 text-sm text-text-main disabled:opacity-60"
                        />
                      </label>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => void controller.updateBinding(
                            role,
                            usesFixture
                              ? { provider: 'fixture' }
                              : {
                                  provider: 'openai-compatible',
                                  providerId: draft.providerId,
                                  modelId: draft.modelId,
                                },
                          )}
                          disabled={controller.saving || (!usesFixture && (!draft.providerId.trim() || !draft.modelId.trim()))}
                          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                        >
                          {dictionary.shell.saveBindingLabel(roleLabel)}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </section>

              <section className="rounded-md border border-line-soft bg-surface-2 px-4 py-4">
                <h4 className="text-sm font-semibold text-text-main">{dictionary.shell.connectionTestTitle}</h4>
                <p className="mt-2 text-sm text-text-muted">
                  {snapshot.connectionTest.summary ?? dictionary.shell.connectionTestNever}
                </p>
              </section>
            </>
          )}

          {controller.error ? <p className="text-sm text-danger">{controller.error}</p> : null}
        </div>
      </div>
    </div>
  )
}

function getRealProjectReadinessSummary(
  snapshot: NonNullable<ModelSettingsController['snapshot']>,
  locale: 'en' | 'zh-CN',
) {
  const requiredBindings = requiredRealProjectRoles.map((role) => snapshot.bindings[role])
  const configuredProviderIds = new Set(
    snapshot.credentialStatuses.filter((status) => status.configured).map((status) => status.providerId),
  )
  const readyRoleCount = requiredBindings.filter((binding) => {
    if (binding.provider !== 'openai-compatible') {
      return false
    }

    return Boolean(
      binding.modelId?.trim()
        && snapshot.providers.some((provider) => provider.id === binding.providerId)
        && configuredProviderIds.has(binding.providerId),
    )
  }).length
  const needsAttention = readyRoleCount !== requiredRealProjectRoles.length || snapshot.connectionTest.status === 'failed'
  const statusLabel = needsAttention
    ? locale === 'zh-CN' ? '真实项目运行待修复' : 'Real project run needs attention'
    : locale === 'zh-CN' ? '真实项目运行已就绪' : 'Real project run ready'
  const requiredRolesLabel = locale === 'zh-CN'
    ? `关键角色 ${readyRoleCount}/${requiredRealProjectRoles.length}`
    : `Required roles ${readyRoleCount}/${requiredRealProjectRoles.length}`
  const connectionLabel = snapshot.connectionTest.status === 'failed'
    ? locale === 'zh-CN' ? '连接测试失败' : 'Connection test failed'
    : snapshot.connectionTest.status === 'passed'
      ? locale === 'zh-CN' ? '连接测试通过' : 'Connection test passed'
      : locale === 'zh-CN' ? '尚未测试连接' : 'Connection test not run'

  return {
    statusLabel,
    requiredRolesLabel,
    connectionLabel,
    summary: snapshot.connectionTest.summary
      ?? (needsAttention
        ? locale === 'zh-CN'
          ? '请先确认规划器与正文写作器都指向可用的 OpenAI-compatible 提供方，并补齐模型与密钥。'
          : 'Make sure both planner and prose writer bindings target usable OpenAI-compatible providers with models and credentials.'
        : locale === 'zh-CN'
          ? '关键真实运行角色已经配置完成，可以回到主舞台启动 Run Scene。'
          : 'The required real-run roles are configured, so you can return to the Main Stage and run the scene.')
  }
}
