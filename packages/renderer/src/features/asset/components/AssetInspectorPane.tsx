import { FactList } from '@/components/ui/FactList'
import { EmptyState } from '@/components/ui/EmptyState'
import { PaneHeader } from '@/components/ui/PaneHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { useI18n } from '@/app/i18n'

import type { AssetInspectorViewModel } from '../types/asset-view-models'

interface AssetInspectorPaneProps {
  title: string
  inspector: AssetInspectorViewModel
}

export function AssetInspectorPane({ title, inspector }: AssetInspectorPaneProps) {
  const { locale } = useI18n()
  const traceabilityReady = !inspector.traceabilityStatus

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      <PaneHeader
        title={locale === 'zh-CN' ? '检查器' : 'Inspector'}
        description={
          locale === 'zh-CN'
            ? '摘要和一致性判断保持在右侧，不把编辑器带进来。'
            : 'Summary and consistency stay close without turning the pane into an editor.'
        }
      />
      <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4">
        <SectionCard title={locale === 'zh-CN' ? '摘要' : 'Summary'} eyebrow={inspector.kindLabel}>
          <FactList
            items={[
              { id: 'asset-title', label: locale === 'zh-CN' ? '资产' : 'Asset', value: title },
              { id: 'kind', label: locale === 'zh-CN' ? '类型' : 'Kind', value: inspector.kindLabel },
              { id: 'visibility', label: locale === 'zh-CN' ? '可见性' : 'Visibility', value: inspector.visibilityLabel },
              { id: 'mentions', label: locale === 'zh-CN' ? '提及' : 'Mentions', value: `${inspector.mentionCount}` },
              { id: 'relations', label: locale === 'zh-CN' ? '关系' : 'Relations', value: `${inspector.relationCount}` },
              { id: 'canon-facts', label: locale === 'zh-CN' ? '正典事实' : 'Canon facts', value: `${inspector.canonFactCount}` },
              { id: 'private-facts', label: locale === 'zh-CN' ? '私密事实' : 'Private facts', value: `${inspector.privateFactCount}` },
              { id: 'timeline', label: locale === 'zh-CN' ? '时间线条目' : 'Timeline entries', value: `${inspector.timelineEntryCount}` },
            ]}
          />
          <p className="mt-4 text-sm leading-6 text-text-muted">{inspector.summary}</p>
        </SectionCard>
        <SectionCard title={locale === 'zh-CN' ? '一致性' : 'Consistency'} eyebrow={locale === 'zh-CN' ? '辅助判断' : 'Judgment Support'}>
          <FactList
            items={[
              {
                id: 'warnings',
                label: locale === 'zh-CN' ? '警告' : 'Warnings',
                value: `${inspector.warnings.length}`,
              },
              {
                id: 'orphan',
                label: locale === 'zh-CN' ? '孤立状态' : 'Orphan',
                value: inspector.isOrphan ? (locale === 'zh-CN' ? '是' : 'Yes') : (locale === 'zh-CN' ? '否' : 'No'),
              },
              {
                id: 'missing',
                label: locale === 'zh-CN' ? '缺失字段' : 'Missing fields',
                value: `${inspector.missingFields.length}`,
              },
              ...(traceabilityReady
                ? [
                    {
                      id: 'canon-backed',
                      label: locale === 'zh-CN' ? '正典支撑提及' : 'Canon-backed mentions',
                      value: `${inspector.canonBackedMentionCount ?? 0}`,
                    },
                    {
                      id: 'draft-context',
                      label: locale === 'zh-CN' ? '草稿上下文提及' : 'Draft-context mentions',
                      value: `${inspector.draftContextMentionCount ?? 0}`,
                    },
                    {
                      id: 'unlinked',
                      label: locale === 'zh-CN' ? '未关联提及' : 'Unlinked mentions',
                      value: `${inspector.unlinkedMentionCount ?? 0}`,
                    },
                  ]
                : []),
            ]}
          />
          {inspector.traceabilityStatus ? (
            <div className="mt-4">
              <EmptyState title={inspector.traceabilityStatus.title} message={inspector.traceabilityStatus.message} className="min-h-0" />
            </div>
          ) : null}
          <div className="mt-4 space-y-3">
            {(inspector.warnings.length > 0 ? inspector.warnings : inspector.notes).map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-md border border-line-soft bg-surface-2 p-3">
                <p className="text-sm leading-6 text-text-muted">{item}</p>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title={locale === 'zh-CN' ? '上下文策略' : 'Context Policy'} eyebrow={locale === 'zh-CN' ? '只读摘要' : 'Read-only Summary'}>
          <FactList
            items={[
              {
                id: 'context-policy-status',
                label: locale === 'zh-CN' ? '状态' : 'Status',
                value: inspector.contextPolicy.statusLabel,
              },
              {
                id: 'context-policy-visibility',
                label: locale === 'zh-CN' ? '默认可见性' : 'Default visibility',
                value: inspector.contextPolicy.defaultVisibilityLabel,
              },
              {
                id: 'context-policy-budget',
                label: locale === 'zh-CN' ? '默认预算' : 'Default budget',
                value: inspector.contextPolicy.defaultBudgetLabel,
              },
              {
                id: 'context-policy-rules',
                label: locale === 'zh-CN' ? '激活规则' : 'Activation rules',
                value: `${inspector.contextPolicy.activationRuleCount}`,
              },
              {
                id: 'context-policy-warnings',
                label: locale === 'zh-CN' ? '策略警告' : 'Policy warnings',
                value: `${inspector.contextPolicy.warningCount}`,
              },
            ]}
          />
          {!inspector.contextPolicy.hasContextPolicy ? (
            <div className="mt-4">
              <EmptyState
                title={locale === 'zh-CN' ? '暂无上下文策略' : 'No context policy yet'}
                message={
                  locale === 'zh-CN'
                    ? '该资产会在 Context 视图中显示安静空态。'
                    : 'The Context view will show a quiet empty state for this asset.'
                }
                className="min-h-0"
              />
            </div>
          ) : null}
        </SectionCard>
      </div>
    </section>
  )
}
