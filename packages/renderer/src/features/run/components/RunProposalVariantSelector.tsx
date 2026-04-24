import { useI18n, type Locale } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'

import type { LocalizedTextRecord, ProposalVariantRecord } from '../api/run-artifact-records'

export interface RunProposalVariantSelectorProps {
  proposalId: string
  variants: ProposalVariantRecord[]
  selectedVariantId?: string | null
  defaultVariantId?: string | null
  onSelectVariant?: (proposalId: string, variantId: string) => void
}

function t(value: LocalizedTextRecord, locale: Locale) {
  return value[locale] ?? value.en
}

function resolveSelectedVariantId(
  variants: ProposalVariantRecord[],
  selectedVariantId?: string | null,
  defaultVariantId?: string | null,
) {
  if (selectedVariantId && variants.some((variant) => variant.id === selectedVariantId)) {
    return selectedVariantId
  }

  if (defaultVariantId && variants.some((variant) => variant.id === defaultVariantId)) {
    return defaultVariantId
  }

  return variants[0]?.id ?? null
}

export function RunProposalVariantSelector({
  proposalId,
  variants,
  selectedVariantId,
  defaultVariantId,
  onSelectVariant,
}: RunProposalVariantSelectorProps) {
  const { locale } = useI18n()

  if (variants.length === 0) {
    return null
  }

  const activeVariantId = resolveSelectedVariantId(variants, selectedVariantId, defaultVariantId)
  const canSelect = Boolean(onSelectVariant)
  const groupLabel = locale === 'zh-CN' ? '提案候选版本' : 'Proposal variants'
  const groupName = `proposal-variant-${proposalId}`

  return (
    <div className="mt-4 grid gap-2" role="radiogroup" aria-label={groupLabel}>
      {variants.map((variant) => {
        const isSelected = activeVariantId === variant.id

        return (
          <label
            key={variant.id}
            className={cn(
              'flex min-h-[132px] gap-3 rounded-md border px-3 py-3 text-left transition-colors',
              isSelected
                ? 'border-line-strong bg-surface-1 text-text-main shadow-ringwarm'
                : 'border-line-soft bg-surface-2 text-text-muted',
              canSelect ? 'cursor-pointer hover:bg-surface-1 hover:text-text-main' : 'cursor-default opacity-90',
            )}
          >
            <input
              type="radio"
              name={groupName}
              checked={isSelected}
              disabled={!canSelect}
              onChange={() => onSelectVariant?.(proposalId, variant.id)}
              className="mt-1 h-4 w-4 shrink-0 accent-accent disabled:opacity-60"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-text-main">{t(variant.label, locale)}</p>
                  <p className="text-sm leading-6">{t(variant.summary, locale)}</p>
                </div>
                {isSelected ? <Badge tone="accent">{locale === 'zh-CN' ? '已选择' : 'Selected'}</Badge> : <Badge>{locale === 'zh-CN' ? '候选' : 'Option'}</Badge>}
              </div>
              <p className="mt-2 text-sm leading-6 text-text-muted">{t(variant.rationale, locale)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {variant.tradeoffLabel ? <Badge>{t(variant.tradeoffLabel, locale)}</Badge> : null}
                {variant.riskLabel ? <Badge tone="warn">{t(variant.riskLabel, locale)}</Badge> : null}
                {(variant.relatedAssets ?? []).map((asset) => (
                  <Badge key={asset.assetId} title={asset.assetId}>
                    {t(asset.label, locale)}
                  </Badge>
                ))}
              </div>
            </div>
          </label>
        )
      })}
    </div>
  )
}
