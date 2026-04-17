import type { PropsWithChildren, ReactElement } from 'react'

import { AppProviders } from '@/app/providers'

interface AssetStoryParameters {
  assetStory?: {
    search?: string
  }
}

const defaultAssetStorySearch = '?scope=asset&id=asset-ren-voss&lens=knowledge&view=profile'

function applyAssetStoryEnvironment(search = defaultAssetStorySearch) {
  if (typeof window === 'undefined') {
    return
  }

  const nextUrl = `${window.location.pathname}${search}${window.location.hash}`
  if (window.location.search !== search) {
    window.history.replaceState({}, '', nextUrl)
  }
}

export function AssetStoryShell({
  children,
  frameClassName,
  search,
}: PropsWithChildren<{ frameClassName: string; search?: string }>) {
  applyAssetStoryEnvironment(search)

  return (
    <AppProviders>
      <div className="min-h-screen bg-app p-6">
        <div className={frameClassName}>{children}</div>
      </div>
    </AppProviders>
  )
}

export function withAssetStoryShell(frameClassName: string) {
  return function AssetStoryDecorator(Story: () => ReactElement, context: { parameters: AssetStoryParameters }) {
    return (
      <AssetStoryShell frameClassName={frameClassName} search={context.parameters.assetStory?.search}>
        <Story />
      </AssetStoryShell>
    )
  }
}
