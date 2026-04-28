import { useEffect, useState } from 'react'

import { getModelBindingProviderLabel, getModelBindingRoleLabel, useI18n } from '@/app/i18n'

import {
  useOptionalModelSettingsController,
  type DesktopModelBindingRole,
  type DesktopModelBindings,
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

function createBindingsDraft(bindings?: DesktopModelBindings | null) {
  return {
    continuityReviewer: { modelId: bindings?.continuityReviewer.modelId ?? '', provider: bindings?.continuityReviewer.provider ?? 'fixture' },
    planner: { modelId: bindings?.planner.modelId ?? '', provider: bindings?.planner.provider ?? 'fixture' },
    sceneProseWriter: { modelId: bindings?.sceneProseWriter.modelId ?? '', provider: bindings?.sceneProseWriter.provider ?? 'fixture' },
    sceneRevision: { modelId: bindings?.sceneRevision.modelId ?? '', provider: bindings?.sceneRevision.provider ?? 'fixture' },
    summary: { modelId: bindings?.summary.modelId ?? '', provider: bindings?.summary.provider ?? 'fixture' },
  }
}

export function ModelSettingsDialog({ open, onOpenChange }: ModelSettingsDialogProps) {
  const controller = useOptionalModelSettingsController()
  const { dictionary, locale } = useI18n()
  const [apiKeyDraft, setApiKeyDraft] = useState('')
  const [bindingsDraft, setBindingsDraft] = useState(() => createBindingsDraft())

  useEffect(() => {
    if (controller?.snapshot) {
      setBindingsDraft(createBindingsDraft(controller.snapshot.bindings))
      setApiKeyDraft('')
    }
  }, [controller?.snapshot])

  if (!open || !controller?.supported) {
    return null
  }

  const snapshot = controller.snapshot

  return (
    <div className="absolute inset-0 z-20 flex items-start justify-end bg-app/70 p-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={dictionary.shell.modelSettingsTitle}
        className="w-full max-w-3xl rounded-md border border-line-soft bg-surface-1 shadow-ringwarm"
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
              <section className="rounded-md border border-line-soft bg-surface-2 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-text-main">{dictionary.shell.openAiApiKeyTitle}</h4>
                    <p className="text-sm text-text-muted">
                      {snapshot.credentialStatus.configured
                        ? snapshot.credentialStatus.redactedValue ?? dictionary.shell.keyConfigured
                        : dictionary.shell.keyMissing}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void controller.deleteOpenAiCredential()}
                    disabled={!snapshot.credentialStatus.configured || controller.saving}
                    className="rounded-md border border-line-soft px-3 py-2 text-sm text-text-main disabled:opacity-60"
                  >
                    {dictionary.shell.clearOpenAiApiKey}
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <label className="min-w-0 flex-1 space-y-2">
                    <span className="text-sm text-text-main">{dictionary.shell.openAiApiKeyInput}</span>
                    <input
                      aria-label={dictionary.shell.openAiApiKeyInput}
                      type="password"
                      value={apiKeyDraft}
                      onChange={(event) => setApiKeyDraft(event.target.value)}
                      className="w-full rounded-md border border-line-soft bg-app px-3 py-2 text-sm text-text-main"
                    />
                  </label>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => void controller.saveOpenAiCredential(apiKeyDraft)}
                      disabled={!apiKeyDraft.trim() || controller.saving}
                      className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                    >
                      {dictionary.shell.saveOpenAiApiKey}
                    </button>
                  </div>
                </div>
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
                {roleOrder.map((role) => {
                  const draft = bindingsDraft[role]
                  const roleLabel = getModelBindingRoleLabel(locale, role)
                  return (
                    <div key={role} className="grid gap-3 rounded-md border border-line-soft bg-surface-2 px-4 py-4 md:grid-cols-[1.2fr_1fr_auto]">
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-text-main">{roleLabel}</span>
                        <select
                          aria-label={dictionary.shell.modelSettingsRoleProviderLabel(roleLabel)}
                          value={draft.provider}
                          onChange={(event) => {
                            const provider = event.target.value as 'fixture' | 'openai'
                            setBindingsDraft((currentDraft) => ({
                              ...currentDraft,
                              [role]: {
                                ...currentDraft[role],
                                provider,
                              },
                            }))
                          }}
                          className="w-full rounded-md border border-line-soft bg-app px-3 py-2 text-sm text-text-main"
                        >
                          <option value="fixture">{getModelBindingProviderLabel(locale, 'fixture')}</option>
                          <option value="openai">{getModelBindingProviderLabel(locale, 'openai')}</option>
                        </select>
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-text-main">{dictionary.shell.modelIdLabel}</span>
                        <input
                          aria-label={dictionary.shell.modelSettingsRoleModelLabel(roleLabel)}
                          value={draft.modelId}
                          disabled={draft.provider !== 'openai'}
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
                          onClick={() => void controller.updateBinding(role, draft.provider === 'openai'
                            ? { provider: 'openai', modelId: draft.modelId }
                            : { provider: 'fixture' })}
                          disabled={controller.saving || (draft.provider === 'openai' && !draft.modelId.trim())}
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
