import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionCard } from '@/components/ui/SectionCard'
import { useI18n } from '@/app/i18n'

import type { AssetRelationViewModel } from '../types/asset-view-models'

interface AssetRelationsViewProps {
  relations: AssetRelationViewModel[]
  onSelectAsset: (assetId: string) => void
}

export function AssetRelationsView({ relations, onSelectAsset }: AssetRelationsViewProps) {
  const { dictionary, locale } = useI18n()

  if (relations.length === 0) {
    return (
      <div className="p-4">
        <EmptyState title={dictionary.app.assetRelations} message={dictionary.app.assetRelationsEmpty} />
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      {relations.map((relation) => (
        <button
          key={relation.id}
          type="button"
          onClick={() => onSelectAsset(relation.targetAssetId)}
          className="block w-full rounded-md border border-line-soft bg-surface-1 p-0 text-left hover:bg-surface-2"
          aria-label={locale === 'zh-CN' ? `关联到: ${relation.targetTitle}` : `Relates to: ${relation.targetTitle}`}
        >
          <SectionCard
            title={relation.targetTitle}
            eyebrow={relation.relationLabel}
            actions={<Badge tone="neutral">{relation.targetKind}</Badge>}
            className="border-none bg-transparent shadow-none"
          >
            <p className="text-sm leading-6 text-text-muted">{relation.summary}</p>
          </SectionCard>
        </button>
      ))}
    </div>
  )
}
