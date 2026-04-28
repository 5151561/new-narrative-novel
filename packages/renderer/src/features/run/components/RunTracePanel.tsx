import { useMemo, useState } from 'react'

import { useI18n, type Locale } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PaneHeader } from '@/components/ui/PaneHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { cn } from '@/lib/cn'

import type { LocalizedTextRecord } from '../api/run-artifact-records'
import type { RunTraceRelation, RunTraceResponse } from '../api/run-trace-records'

export interface RunTracePanelProps {
  trace: RunTraceResponse | null
  isLoading?: boolean
  error?: Error | null
}

const relationLabels: Record<RunTraceRelation, string> = {
  used_context: 'Used context',
  generated: 'Generated',
  proposed: 'Proposed',
  reviewed_by: 'Reviewed by',
  accepted_into: 'Accepted into canon',
  rendered_as: 'Rendered as prose',
  mentions: 'Mentions',
}

function t(value: LocalizedTextRecord, locale: Locale) {
  return value[locale] ?? value.en
}

function groupTraceLinks(trace: RunTraceResponse) {
  const groups = new Map<RunTraceRelation, RunTraceResponse['links']>()

  for (const link of trace.links) {
    const group = groups.get(link.relation) ?? []
    group.push(link)
    groups.set(link.relation, group)
  }

  return Array.from(groups.entries()).map(([relation, links]) => ({
    relation,
    links,
  }))
}

export function RunTracePanel({ trace, isLoading = false, error = null }: RunTracePanelProps) {
  const { locale } = useI18n()
  const groups = useMemo(() => (trace ? groupTraceLinks(trace) : []), [trace])
  const [selectedRelation, setSelectedRelation] = useState<RunTraceRelation | null>(null)
  const activeRelation = groups.some((group) => group.relation === selectedRelation)
    ? selectedRelation
    : groups[0]?.relation ?? null
  const selectedLinks = groups.find((group) => group.relation === activeRelation)?.links ?? []
  const selectedNodeIds = new Set(selectedLinks.flatMap((link) => [link.from.id, link.to.id]))
  const selectedNodes = trace?.nodes.filter((node) => selectedNodeIds.has(node.id)) ?? []
  const nodesById = useMemo(() => new Map(trace?.nodes.map((node) => [node.id, node]) ?? []), [trace])
  const isPartialFailureTrace = Boolean(trace?.isPartialFailure)

  if (isLoading) {
    return (
      <section className="flex min-h-0 flex-col overflow-hidden rounded-md border border-line-soft bg-surface-1 shadow-ringwarm">
        <PaneHeader title={locale === 'zh-CN' ? '运行来源链' : 'Run Trace'} description={locale === 'zh-CN' ? '正在读取来源链。' : 'Loading trace links.'} />
        <div className="p-4">
          <EmptyState title={locale === 'zh-CN' ? '正在加载来源链' : 'Loading trace'} message={locale === 'zh-CN' ? '正在读取运行链路摘要。' : 'Reading run trace summary.'} />
        </div>
      </section>
    )
  }

  if (error || !trace) {
    return (
      <section className="flex min-h-0 flex-col overflow-hidden rounded-md border border-line-soft bg-surface-1 shadow-ringwarm">
        <PaneHeader title={locale === 'zh-CN' ? '运行来源链' : 'Run Trace'} description={locale === 'zh-CN' ? '按关系分组显示运行来源。' : 'Grouped run provenance relations.'} />
        <div className="p-4">
          <EmptyState title={locale === 'zh-CN' ? '来源链不可用' : 'Trace unavailable'} message={locale === 'zh-CN' ? '这次运行的来源链暂时不可读。' : 'The trace for this run is temporarily unavailable.'} />
        </div>
      </section>
    )
  }

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-md border border-line-soft bg-surface-1 shadow-ringwarm">
      <PaneHeader title={locale === 'zh-CN' ? '运行来源链' : 'Run Trace'} description={locale === 'zh-CN' ? '按关系分组显示运行来源。' : 'Grouped run provenance relations.'} />
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="grid gap-4">
          {isPartialFailureTrace ? (
            <SectionCard eyebrow="Failure Recovery" title={locale === 'zh-CN' ? '局部失败来源链' : 'Partial failure trace'}>
              <p className="text-sm leading-6 text-text-muted">
                {locale === 'zh-CN'
                  ? '这条来源链只显示运行停止前已经创建的节点，不代表已经形成 accepted canon 或 prose。'
                  : 'This trace only shows the nodes that existed before the run stopped. It does not imply accepted canon or prose.'}
              </p>
            </SectionCard>
          ) : null}
          <SectionCard eyebrow="Summary" title={locale === 'zh-CN' ? '来源摘要' : 'Trace Summary'}>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { id: 'proposalSetCount', label: locale === 'zh-CN' ? 'Proposal sets' : 'Proposal sets', value: trace.summary.proposalSetCount },
                { id: 'canonPatchCount', label: locale === 'zh-CN' ? 'Canon patches' : 'Canon patches', value: trace.summary.canonPatchCount },
                { id: 'proseDraftCount', label: locale === 'zh-CN' ? 'Prose drafts' : 'Prose drafts', value: trace.summary.proseDraftCount },
                { id: 'missingTraceCount', label: locale === 'zh-CN' ? 'Missing trace' : 'Missing trace', value: trace.summary.missingTraceCount },
              ].map((item) => (
                <div key={item.id} className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
                  <dt className="text-xs uppercase tracking-[0.05em] text-text-soft">{item.label}</dt>
                  <dd className="mt-1 text-lg font-medium text-text-main">{item.value}</dd>
                </div>
              ))}
            </dl>
          </SectionCard>
          <SectionCard eyebrow="Relations" title={locale === 'zh-CN' ? '按关系分组的链接' : 'Links grouped by relation'}>
            {groups.length === 0 ? (
              <EmptyState title={locale === 'zh-CN' ? '暂无关系链接' : 'No relation links'} message={locale === 'zh-CN' ? '这次运行还没有来源关系。' : 'This run has no trace relations yet.'} />
            ) : (
              <div className="grid gap-2">
                {groups.map((group) => (
                  <button
                    key={group.relation}
                    type="button"
                    aria-pressed={activeRelation === group.relation}
                    onClick={() => setSelectedRelation(group.relation)}
                    className={cn(
                      'rounded-md border px-3 py-3 text-left transition-colors',
                      activeRelation === group.relation
                        ? 'border-line-strong bg-surface-1 text-text-main shadow-ringwarm'
                        : 'border-line-soft bg-surface-2 text-text-muted hover:bg-surface-1 hover:text-text-main',
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium">{relationLabels[group.relation]}</span>
                      <Badge>{group.links.length} links</Badge>
                    </div>
                    <div className="mt-2 grid gap-1">
                      {group.links.map((link) => (
                        <p key={link.id} className="text-sm leading-6 text-text-muted">
                          {t(nodesById.get(link.from.id)?.label ?? link.label, locale)} - {t(nodesById.get(link.to.id)?.label ?? link.label, locale)}
                        </p>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </SectionCard>
          <SectionCard
            eyebrow="Nodes"
            title={
              activeRelation
                ? `${locale === 'zh-CN' ? '关系节点' : 'Nodes referenced by'} ${relationLabels[activeRelation]}`
                : locale === 'zh-CN' ? '关系节点' : 'Nodes referenced by selected relation'
            }
          >
            {selectedNodes.length === 0 ? (
              <EmptyState title={locale === 'zh-CN' ? '暂无节点' : 'No nodes selected'} message={locale === 'zh-CN' ? '选择一个关系分组查看节点。' : 'Select a relation group to inspect its nodes.'} />
            ) : (
              <div className="grid gap-2">
                {selectedNodes.map((node) => (
                  <div key={node.id} className="flex items-center justify-between gap-3 rounded-md border border-line-soft bg-surface-2 px-3 py-3">
                    <p className="text-sm font-medium text-text-main">{t(node.label, locale)}</p>
                    <Badge>{node.kind}</Badge>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </section>
  )
}
