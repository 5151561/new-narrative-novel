import { FactList } from '@/components/ui/FactList'
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
              { id: 'mentions', label: locale === 'zh-CN' ? '提及' : 'Mentions', value: `${inspector.mentionCount}` },
              { id: 'relations', label: locale === 'zh-CN' ? '关系' : 'Relations', value: `${inspector.relationCount}` },
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
            ]}
          />
          <div className="mt-4 space-y-3">
            {(inspector.warnings.length > 0 ? inspector.warnings : inspector.notes).map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-md border border-line-soft bg-surface-2 p-3">
                <p className="text-sm leading-6 text-text-muted">{item}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </section>
  )
}
