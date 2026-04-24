import { useI18n } from '@/app/i18n'
import { EmptyState } from '@/components/ui/EmptyState'
import { PaneHeader } from '@/components/ui/PaneHeader'

import type { RunArtifactDetailRecord } from '../api/run-artifact-records'

import {
  AgentInvocationArtifactPanel,
  CanonPatchArtifactPanel,
  ContextPacketArtifactPanel,
  ProposalSetArtifactPanel,
  ProseDraftArtifactPanel,
} from './RunArtifactDetailSections'

export interface RunArtifactInspectorPanelProps {
  artifact: RunArtifactDetailRecord | null
  isLoading?: boolean
  error?: Error | null
  selectedVariants?: Record<string, string>
  onSelectProposalVariant?: (proposalId: string, variantId: string) => void
}

export function RunArtifactInspectorPanel({
  artifact,
  isLoading = false,
  error = null,
  selectedVariants,
  onSelectProposalVariant,
}: RunArtifactInspectorPanelProps) {
  const { locale } = useI18n()

  if (isLoading) {
    return (
      <section className="flex min-h-0 flex-col overflow-hidden rounded-md border border-line-soft bg-surface-1 shadow-ringwarm">
        <PaneHeader title={locale === 'zh-CN' ? 'Artifact 详情' : 'Artifact Detail'} description={locale === 'zh-CN' ? '正在读取运行产物。' : 'Loading the selected run artifact.'} />
        <div className="p-4">
          <EmptyState title={locale === 'zh-CN' ? '正在加载产物' : 'Loading artifact'} message={locale === 'zh-CN' ? '正在读取结构化产物详情。' : 'Reading structured artifact detail.'} />
        </div>
      </section>
    )
  }

  if (error || !artifact) {
    return (
      <section className="flex min-h-0 flex-col overflow-hidden rounded-md border border-line-soft bg-surface-1 shadow-ringwarm">
        <PaneHeader title={locale === 'zh-CN' ? 'Artifact 详情' : 'Artifact Detail'} description={locale === 'zh-CN' ? '选择运行产物后在这里审阅。' : 'Select a run artifact to inspect it here.'} />
        <div className="p-4">
          <EmptyState
            title={locale === 'zh-CN' ? '找不到产物' : 'Artifact not found'}
            message={
              locale === 'zh-CN'
                ? '所选运行产物已不再属于这次运行。'
                : 'The selected run artifact is no longer available for this run.'
            }
          />
        </div>
      </section>
    )
  }

  const title = artifact.title[locale] ?? artifact.title.en
  const summary = artifact.summary[locale] ?? artifact.summary.en

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-md border border-line-soft bg-surface-1 shadow-ringwarm">
      <PaneHeader title={title} description={summary} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {artifact.kind === 'context-packet' ? <ContextPacketArtifactPanel artifact={artifact} /> : null}
        {artifact.kind === 'agent-invocation' ? <AgentInvocationArtifactPanel artifact={artifact} /> : null}
        {artifact.kind === 'proposal-set' ? (
          <ProposalSetArtifactPanel
            artifact={artifact}
            selectedVariants={selectedVariants}
            onSelectProposalVariant={onSelectProposalVariant}
          />
        ) : null}
        {artifact.kind === 'canon-patch' ? <CanonPatchArtifactPanel artifact={artifact} /> : null}
        {artifact.kind === 'prose-draft' ? <ProseDraftArtifactPanel artifact={artifact} /> : null}
      </div>
    </section>
  )
}
