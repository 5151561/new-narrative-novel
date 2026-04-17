import { useI18n } from '@/app/i18n'
import { EmptyState } from '@/components/ui/EmptyState'

import type { TraceabilityRelatedAssetViewModel } from '../types/traceability-view-models'

interface TraceabilityAssetChipsProps {
  assets: TraceabilityRelatedAssetViewModel[]
  onOpenAsset: (assetId: string) => void
}

export function TraceabilityAssetChips({ assets, onOpenAsset }: TraceabilityAssetChipsProps) {
  const { locale } = useI18n()

  if (assets.length === 0) {
    return (
      <EmptyState
        title={locale === 'zh-CN' ? '还没有关联资产' : 'No related assets yet'}
        message={
          locale === 'zh-CN'
            ? '等 traceability metadata 完整后，这里会出现可跳转的资产资料入口。'
            : 'Once the traceability metadata is complete, linked asset profiles will appear here.'
        }
      />
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {assets.map((asset) => (
        <button
          key={asset.assetId}
          type="button"
          onClick={() => onOpenAsset(asset.assetId)}
          className="rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm text-text-main hover:bg-surface-1"
        >
          {asset.title}
        </button>
      ))}
    </div>
  )
}
