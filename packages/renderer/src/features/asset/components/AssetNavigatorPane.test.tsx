import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import type { AssetNavigatorItemViewModel } from '../types/asset-view-models'

import { AssetNavigatorPane } from './AssetNavigatorPane'

const groups: {
  characters: AssetNavigatorItemViewModel[]
  locations: AssetNavigatorItemViewModel[]
  organizations: AssetNavigatorItemViewModel[]
  objects: AssetNavigatorItemViewModel[]
  lore: AssetNavigatorItemViewModel[]
} = {
  characters: [
    {
      id: 'asset-ren-voss',
      kind: 'character',
      title: 'Ren Voss',
      summary: 'Keeps the ledger closed in public.',
      mentionCount: 3,
      relationCount: 3,
      hasWarnings: true,
      isOrphan: false,
    },
    {
      id: 'asset-mei-arden',
      kind: 'character',
      title: 'Mei Arden',
      summary: 'Raises the visible price of the bargain.',
      mentionCount: 2,
      relationCount: 2,
      hasWarnings: false,
      isOrphan: false,
    },
  ],
  locations: [
    {
      id: 'asset-midnight-platform',
      kind: 'location',
      title: 'Midnight Platform',
      summary: 'Public witness pressure turns hesitation into leverage.',
      mentionCount: 2,
      relationCount: 2,
      hasWarnings: true,
      isOrphan: false,
    },
  ],
  organizations: [],
  objects: [],
  lore: [
    {
      id: 'asset-public-witness-rule',
      kind: 'lore',
      title: 'Public Witness Rule',
      summary: 'The bargain must stay one step away from public proof.',
      mentionCount: 2,
      relationCount: 2,
      hasWarnings: true,
      isOrphan: false,
    },
  ],
}

describe('AssetNavigatorPane', () => {
  it('marks the selected asset and clicking another asset calls onSelectAsset', async () => {
    const user = userEvent.setup()
    const onSelectAsset = vi.fn()

    render(
      <I18nProvider>
        <AssetNavigatorPane groups={groups} activeAssetId="asset-ren-voss" onSelectAsset={onSelectAsset} />
      </I18nProvider>,
    )

    const renButton = screen.getByRole('button', { name: /Ren Voss/i })
    const meiButton = screen.getByRole('button', { name: /Mei Arden/i })

    expect(renButton).toHaveClass('border-line-strong')
    expect(meiButton).toHaveClass('border-line-soft')

    await user.click(meiButton)

    expect(onSelectAsset).toHaveBeenCalledWith('asset-mei-arden')
  })
})
