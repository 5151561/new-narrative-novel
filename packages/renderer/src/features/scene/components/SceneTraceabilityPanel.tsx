import { getGenericStatusLabel, useI18n } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FactList } from '@/components/ui/FactList'
import { SectionCard } from '@/components/ui/SectionCard'

import { TraceabilityAssetChips } from '@/features/traceability/components/TraceabilityAssetChips'
import type {
  SceneProseOriginViewModel,
  SceneTraceabilityLatestPatchViewModel,
  SceneTraceabilityViewModel,
  TraceabilityAcceptedFactViewModel,
  TraceabilitySourceProposalViewModel,
} from '@/features/traceability/types/traceability-view-models'

function SourceProposalList({ proposals }: { proposals: TraceabilitySourceProposalViewModel[] }) {
  const { locale } = useI18n()

  if (proposals.length === 0) {
    return (
      <p className="text-sm leading-6 text-text-muted">
        {locale === 'zh-CN' ? '当前还没有 proposal 来源链接。' : 'No proposal links are attached yet.'}
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {proposals.map((proposal) => (
        <li key={proposal.proposalId} className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
          <p className="text-sm font-medium text-text-main">{proposal.title}</p>
          <p className="mt-1 text-sm leading-6 text-text-muted">
            {proposal.sourceTraceId
              ? locale === 'zh-CN'
                ? `来源 trace: ${proposal.sourceTraceId}`
                : `Source trace: ${proposal.sourceTraceId}`
              : locale === 'zh-CN'
                ? '没有独立 trace id。'
                : 'No dedicated trace id.'}
          </p>
        </li>
      ))}
    </ul>
  )
}

function AcceptedCanonSection({
  acceptedFacts,
  onOpenAsset,
}: {
  acceptedFacts: TraceabilityAcceptedFactViewModel[]
  onOpenAsset: (assetId: string) => void
}) {
  const { locale } = useI18n()

  return (
    <SectionCard eyebrow={locale === 'zh-CN' ? 'Canon' : 'Canon'} title={locale === 'zh-CN' ? '已采纳 canon' : 'Accepted canon'}>
      {acceptedFacts.length > 0 ? (
        <div className="space-y-3">
          {acceptedFacts.map((fact) => (
            <div key={fact.id} className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-text-main">{fact.label}</p>
                <p className="text-sm leading-6 text-text-muted">{fact.value}</p>
              </div>
              <div className="mt-3 grid gap-3">
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.05em] text-text-soft">
                    {locale === 'zh-CN' ? 'Source proposals' : 'Source proposals'}
                  </p>
                  <SourceProposalList proposals={fact.sourceProposals} />
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.05em] text-text-soft">
                    {locale === 'zh-CN' ? 'Related assets' : 'Related assets'}
                  </p>
                  <TraceabilityAssetChips assets={fact.relatedAssets} onOpenAsset={onOpenAsset} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title={locale === 'zh-CN' ? '还没有已采纳来源链' : 'No accepted canon trace yet'}
          message={
            locale === 'zh-CN'
              ? '当 accepted facts 带有 proposal 与 asset metadata 时，这里会显示第一条来源链。'
              : 'Accepted facts will appear here once proposal and asset metadata are available.'
          }
        />
      )}
    </SectionCard>
  )
}

function LatestPatchSection({
  latestPatch,
  onOpenAsset,
}: {
  latestPatch: SceneTraceabilityLatestPatchViewModel | null
  onOpenAsset: (assetId: string) => void
}) {
  const { locale } = useI18n()

  return (
    <SectionCard eyebrow={locale === 'zh-CN' ? 'Patch' : 'Patch'} title={locale === 'zh-CN' ? '最新补丁' : 'Latest patch'}>
      {latestPatch ? (
        <div className="space-y-3">
          <div className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-text-main">{latestPatch.label}</p>
                <p className="text-sm leading-6 text-text-muted">{latestPatch.summary}</p>
              </div>
              <Badge tone={latestPatch.status === 'ready_for_commit' ? 'success' : latestPatch.status === 'needs_review' ? 'warn' : 'neutral'}>
                {getGenericStatusLabel(locale, latestPatch.status)}
              </Badge>
            </div>
          </div>
          <div className="grid gap-3">
            {latestPatch.changes.map((change) => (
              <div key={change.id} className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
                <p className="text-sm font-medium text-text-main">{change.label}</p>
                <p className="mt-1 text-sm leading-6 text-text-muted">{change.detail}</p>
                <div className="mt-3 grid gap-3">
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.05em] text-text-soft">
                      {locale === 'zh-CN' ? 'Source proposals' : 'Source proposals'}
                    </p>
                    <SourceProposalList proposals={change.sourceProposals} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.05em] text-text-soft">
                      {locale === 'zh-CN' ? 'Related assets' : 'Related assets'}
                    </p>
                    <TraceabilityAssetChips assets={change.relatedAssets} onOpenAsset={onOpenAsset} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          title={locale === 'zh-CN' ? '还没有补丁来源链' : 'No patch trace yet'}
          message={
            locale === 'zh-CN'
              ? '当 accepted patch preview 可用时，这里会显示 change、proposal 与 asset 关系。'
              : 'Patch changes, proposal links, and asset links will appear here once an accepted patch preview is available.'
          }
        />
      )}
    </SectionCard>
  )
}

function ProseOriginSection({
  proseOrigin,
  onOpenAsset,
}: {
  proseOrigin: SceneProseOriginViewModel | null
  onOpenAsset: (assetId: string) => void
}) {
  const { locale } = useI18n()

  return (
    <SectionCard eyebrow={locale === 'zh-CN' ? 'Prose' : 'Prose'} title={locale === 'zh-CN' ? '正文来源' : 'Prose origin'}>
      {proseOrigin ? (
        <div className="space-y-3">
          <FactList
            items={[
              {
                id: 'prose-status',
                label: locale === 'zh-CN' ? '正文状态' : 'Prose status',
                value: proseOrigin.statusLabel ?? (locale === 'zh-CN' ? '暂无' : 'n/a'),
              },
              {
                id: 'source-patch',
                label: locale === 'zh-CN' ? '来源 patch' : 'Source patch',
                value: proseOrigin.sourcePatchId ?? (locale === 'zh-CN' ? '暂无' : 'n/a'),
              },
              {
                id: 'accepted-facts',
                label: locale === 'zh-CN' ? '已采纳事实' : 'Accepted facts',
                value: `${proseOrigin.acceptedFactIds.length}`,
              },
            ]}
          />
          {proseOrigin.latestDiffSummary ? (
            <div className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.05em] text-text-soft">{locale === 'zh-CN' ? '最近差异' : 'Latest diff'}</p>
              <p className="mt-2 text-sm leading-6 text-text-muted">{proseOrigin.latestDiffSummary}</p>
            </div>
          ) : null}
          {proseOrigin.traceSummary ? (
            <div className="rounded-md border border-dashed border-line-strong bg-surface-2 px-3 py-3">
              <p className="text-sm leading-6 text-text-muted">{proseOrigin.traceSummary}</p>
            </div>
          ) : null}
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.05em] text-text-soft">
              {locale === 'zh-CN' ? 'Source proposals' : 'Source proposals'}
            </p>
            <SourceProposalList proposals={proseOrigin.sourceProposals} />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.05em] text-text-soft">
              {locale === 'zh-CN' ? 'Related assets' : 'Related assets'}
            </p>
            <TraceabilityAssetChips assets={proseOrigin.relatedAssets} onOpenAsset={onOpenAsset} />
          </div>
        </div>
      ) : (
        <EmptyState
          title={locale === 'zh-CN' ? '还没有正文来源链' : 'No prose origin yet'}
          message={
            locale === 'zh-CN'
              ? '当 prose trace summary 带有 patch、fact 与 asset metadata 时，这里会显示正文来源。'
              : 'Prose origin will appear here once patch, fact, and asset metadata land in the trace summary.'
          }
        />
      )}
    </SectionCard>
  )
}

interface SceneTraceabilityPanelProps {
  traceability: SceneTraceabilityViewModel | null
  isLoading: boolean
  error?: Error | null
  onOpenAsset: (assetId: string) => void
}

export function SceneTraceabilityPanel({
  traceability,
  isLoading,
  error,
  onOpenAsset,
}: SceneTraceabilityPanelProps) {
  const { locale } = useI18n()

  if (error) {
    return (
      <div className="grid gap-4 p-4">
        <EmptyState title={locale === 'zh-CN' ? '来源链不可用' : 'Traceability unavailable'} message={error.message} />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 p-4">
        <EmptyState
          title={locale === 'zh-CN' ? '正在加载来源链' : 'Loading traceability'}
          message={
            locale === 'zh-CN'
              ? '正在组合 accepted canon、latest patch 与 prose origin。'
              : 'Combining accepted canon, latest patch, and prose origin.'
          }
        />
      </div>
    )
  }

  return (
    <div className="grid gap-4 p-4">
      <AcceptedCanonSection acceptedFacts={traceability?.acceptedFacts ?? []} onOpenAsset={onOpenAsset} />
      <LatestPatchSection latestPatch={traceability?.latestPatch ?? null} onOpenAsset={onOpenAsset} />
      <ProseOriginSection proseOrigin={traceability?.proseOrigin ?? null} onOpenAsset={onOpenAsset} />
    </div>
  )
}
