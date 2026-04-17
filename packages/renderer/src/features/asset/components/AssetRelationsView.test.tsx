import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import type { AssetRelationViewModel } from '../types/asset-view-models'

import { AssetRelationsView } from './AssetRelationsView'

const relations: AssetRelationViewModel[] = [
  {
    id: 'relation-ren-mei',
    targetAssetId: 'asset-mei-arden',
    targetTitle: 'Mei Arden',
    targetKind: 'character',
    relationLabel: 'Bargains against',
    summary: 'Ren needs Mei’s timing, but refuses the terms that would make the ledger public.',
  },
]

describe('AssetRelationsView', () => {
  it('shows relation labels and selecting a relation target calls onSelectAsset', async () => {
    const user = userEvent.setup()
    const onSelectAsset = vi.fn()

    render(
      <I18nProvider>
        <AssetRelationsView relations={relations} onSelectAsset={onSelectAsset} />
      </I18nProvider>,
    )

    expect(screen.getByText('Bargains against')).toBeInTheDocument()
    expect(screen.getByText('Ren needs Mei’s timing, but refuses the terms that would make the ledger public.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Relates to: Mei Arden/i }))

    expect(onSelectAsset).toHaveBeenCalledWith('asset-mei-arden')
  })
})
