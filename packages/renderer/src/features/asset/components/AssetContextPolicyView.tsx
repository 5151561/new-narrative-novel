import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FactList } from '@/components/ui/FactList'
import { SectionCard } from '@/components/ui/SectionCard'
import { useI18n } from '@/app/i18n'

import type { AssetContextPolicyViewModel } from '../types/asset-view-models'

interface AssetContextPolicyViewProps {
  policy: AssetContextPolicyViewModel
}

function joinLabels(labels: string[], fallback: string) {
  return labels.length > 0 ? labels.join(', ') : fallback
}

export function AssetContextPolicyView({ policy }: AssetContextPolicyViewProps) {
  const { locale } = useI18n()
  const emptyLabel = locale === 'zh-CN' ? '无' : 'None'

  if (!policy.hasContextPolicy) {
    return (
      <div className="p-4">
        <EmptyState
          title={locale === 'zh-CN' ? '暂无上下文策略' : 'No context policy yet'}
          message={policy.summary}
          className="min-h-0"
        />
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <SectionCard title={locale === 'zh-CN' ? '摘要' : 'Summary'} eyebrow={locale === 'zh-CN' ? '只读策略' : 'Read-only Policy'}>
        <FactList
          items={[
            { id: 'status', label: locale === 'zh-CN' ? '状态' : 'Status', value: policy.statusLabel },
            {
              id: 'default-visibility',
              label: locale === 'zh-CN' ? '默认可见性' : 'Default visibility',
              value: policy.defaultVisibilityLabel,
            },
            {
              id: 'default-budget',
              label: locale === 'zh-CN' ? '默认预算' : 'Default budget',
              value: policy.defaultBudgetLabel,
            },
            {
              id: 'activation-rules',
              label: locale === 'zh-CN' ? '激活规则' : 'Activation rules',
              value: `${policy.activationRules.length}`,
            },
          ]}
        />
        <p className="mt-4 text-sm leading-6 text-text-muted">{policy.summary}</p>
      </SectionCard>

      <SectionCard title={locale === 'zh-CN' ? '激活规则' : 'Activation Rules'} eyebrow={locale === 'zh-CN' ? '进入条件' : 'Entry Conditions'}>
        {policy.activationRules.length > 0 ? (
          <div className="space-y-3">
            {policy.activationRules.map((rule) => (
              <article key={rule.id} className="rounded-md border border-line-soft bg-surface-2 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <h4 className="text-sm font-medium text-text-main">{rule.label}</h4>
                    <p className="text-sm leading-6 text-text-muted">{rule.summary}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {rule.priorityLabel ? <Badge tone="accent">{rule.priorityLabel}</Badge> : null}
                    {rule.guardrailLabel ? <Badge tone="warn">{rule.guardrailLabel}</Badge> : null}
                  </div>
                </div>
                <div className="mt-3">
                  <FactList
                    items={[
                      { id: `${rule.id}-reason`, label: locale === 'zh-CN' ? '原因' : 'Reason', value: rule.reasonKindLabel },
                      { id: `${rule.id}-visibility`, label: locale === 'zh-CN' ? '可见性' : 'Visibility', value: rule.visibilityLabel },
                      { id: `${rule.id}-budget`, label: locale === 'zh-CN' ? '预算' : 'Budget', value: rule.budgetLabel },
                      {
                        id: `${rule.id}-agents`,
                        label: locale === 'zh-CN' ? '目标代理' : 'Target agents',
                        value: joinLabels(rule.targetAgentLabels, emptyLabel),
                      },
                    ]}
                  />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title={locale === 'zh-CN' ? '没有激活规则' : 'No activation rules'}
            message={
              locale === 'zh-CN'
                ? '策略存在，但还没有规则说明何时进入上下文。'
                : 'The policy exists, but no rules explain when it should enter context.'
            }
            className="min-h-0"
          />
        )}
      </SectionCard>

      <SectionCard title={locale === 'zh-CN' ? '可见性与预算' : 'Visibility & Budget'} eyebrow={locale === 'zh-CN' ? '默认值' : 'Defaults'}>
        <FactList
          items={[
            {
              id: 'visibility-default',
              label: locale === 'zh-CN' ? '默认可见性' : 'Default visibility',
              value: policy.defaultVisibilityLabel,
            },
            {
              id: 'budget-default',
              label: locale === 'zh-CN' ? '默认预算' : 'Default budget',
              value: policy.defaultBudgetLabel,
            },
          ]}
        />
      </SectionCard>

      <SectionCard title={locale === 'zh-CN' ? '护栏 / 排除项' : 'Guardrails / Exclusions'} eyebrow={locale === 'zh-CN' ? '不要带入' : 'Excluded Context'}>
        {policy.exclusions.length > 0 ? (
          <ul className="space-y-3">
            {policy.exclusions.map((exclusion) => (
              <li key={exclusion.id} className="rounded-md border border-line-soft bg-surface-2 p-3">
                <p className="font-medium text-text-main">{exclusion.label}</p>
                <p className="mt-2 text-sm leading-6 text-text-muted">{exclusion.summary}</p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title={locale === 'zh-CN' ? '没有排除项' : 'No exclusions'}
            message={
              locale === 'zh-CN'
                ? '当前策略没有额外的上下文排除项。'
                : 'This policy has no additional context exclusions.'
            }
            className="min-h-0"
          />
        )}
      </SectionCard>

      <SectionCard title={locale === 'zh-CN' ? '警告' : 'Warnings'} eyebrow={locale === 'zh-CN' ? '注意事项' : 'Cautions'}>
        {policy.warnings.length > 0 ? (
          <ul className="space-y-3">
            {policy.warnings.map((warning, index) => (
              <li key={`${warning}-${index}`} className="rounded-md border border-line-soft bg-surface-2 p-3">
                <p className="text-sm leading-6 text-text-muted">{warning}</p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title={locale === 'zh-CN' ? '没有策略警告' : 'No policy warnings'}
            message={
              locale === 'zh-CN'
                ? '当前上下文策略没有额外警告。'
                : 'This context policy has no extra warnings.'
            }
            className="min-h-0"
          />
        )}
      </SectionCard>
    </div>
  )
}
