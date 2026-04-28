import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PaneHeader } from '@/components/ui/PaneHeader'
import { useI18n } from '@/app/i18n'

import type { AssetNavigatorItemViewModel } from '../types/asset-view-models'

interface AssetNavigatorPaneProps {
  groups: {
    characters: AssetNavigatorItemViewModel[]
    locations: AssetNavigatorItemViewModel[]
    organizations: AssetNavigatorItemViewModel[]
    objects: AssetNavigatorItemViewModel[]
    lore: AssetNavigatorItemViewModel[]
  }
  activeAssetId: string
  onSelectAsset: (assetId: string) => void
}

function NavigatorGroup({
  title,
  items,
  activeAssetId,
  onSelectAsset,
}: {
  title: string
  items: AssetNavigatorItemViewModel[]
  activeAssetId: string
  onSelectAsset: (assetId: string) => void
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="space-y-2">
      <p className="px-1 text-[11px] uppercase tracking-[0.08em] text-text-soft">{title}</p>
      <div className="grid gap-2">
        {items.map((item) => {
          const active = item.id === activeAssetId

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectAsset(item.id)}
              className={`rounded-md border px-3 py-3 text-left transition ${
                active
                  ? 'border-line-strong bg-surface-1 shadow-sm'
                  : 'border-line-soft bg-surface-2/80 hover:bg-surface-1'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-main">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-text-muted">{item.summary}</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                  {item.hasWarnings ? <Badge tone="warn">!</Badge> : null}
                  {item.isOrphan ? <Badge tone="neutral">0</Badge> : null}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-text-soft">
                <span>{item.mentionCount} mentions</span>
                <span>{item.relationCount} relations</span>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export function AssetNavigatorPane({ groups, activeAssetId, onSelectAsset }: AssetNavigatorPaneProps) {
  const { dictionary } = useI18n()
  const hasItems = groups.characters.length
    + groups.locations.length
    + groups.organizations.length
    + groups.objects.length
    + groups.lore.length > 0

  return (
    <>
      <PaneHeader title={dictionary.app.assets} />
      <div className="min-h-0 space-y-4 overflow-auto p-3">
        {hasItems ? (
          <>
            <NavigatorGroup
              title={dictionary.app.assetGroups.characters}
              items={groups.characters}
              activeAssetId={activeAssetId}
              onSelectAsset={onSelectAsset}
            />
            <NavigatorGroup
              title={dictionary.app.assetGroups.locations}
              items={groups.locations}
              activeAssetId={activeAssetId}
              onSelectAsset={onSelectAsset}
            />
            <NavigatorGroup
              title={dictionary.app.assetGroups.organizations}
              items={groups.organizations}
              activeAssetId={activeAssetId}
              onSelectAsset={onSelectAsset}
            />
            <NavigatorGroup
              title={dictionary.app.assetGroups.objects}
              items={groups.objects}
              activeAssetId={activeAssetId}
              onSelectAsset={onSelectAsset}
            />
            <NavigatorGroup
              title={dictionary.app.assetGroups.lore}
              items={groups.lore}
              activeAssetId={activeAssetId}
              onSelectAsset={onSelectAsset}
            />
          </>
        ) : (
          <EmptyState
            title={dictionary.app.assets}
            message={dictionary.app.assetNavigatorEmpty}
          />
        )}
      </div>
    </>
  )
}
