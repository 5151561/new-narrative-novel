import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useEffect, type PropsWithChildren } from 'react'
import { describe, expect, it } from 'vitest'

import { APP_LOCALE_STORAGE_KEY, I18nProvider, type Locale, useI18n } from '@/app/i18n'
import type { AssetKnowledgeView } from '@/features/workbench/types/workbench-route'

import { assetQueryKeys } from './asset-query-keys'
import { useAssetKnowledgeWorkspaceQuery } from './useAssetKnowledgeWorkspaceQuery'

function wrapperFactory() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  let setLocaleRef: ((locale: Locale) => void) | undefined

  function LocaleControl() {
    const { setLocale } = useI18n()

    useEffect(() => {
      setLocaleRef = setLocale
    }, [setLocale])

    return null
  }

  return {
    wrapper: function Wrapper({ children }: PropsWithChildren) {
      return (
        <QueryClientProvider client={queryClient}>
          <I18nProvider>
            <LocaleControl />
            {children}
          </I18nProvider>
        </QueryClientProvider>
      )
    },
    setLocale(nextLocale: Locale) {
      act(() => {
        setLocaleRef?.(nextLocale)
      })
    },
  }
}

describe('useAssetKnowledgeWorkspaceQuery', () => {
  it('uses asset id and locale for the workspace query key', () => {
    expect(assetQueryKeys.workspace('asset-ren-voss', 'en')).toEqual(['asset', 'workspace', 'asset-ren-voss', 'en'])
  })

  it('hydrates the asset knowledge workspace with grouped navigator items and read-heavy inspector data', async () => {
    const { wrapper } = wrapperFactory()

    const hook = renderHook(
      () =>
        useAssetKnowledgeWorkspaceQuery({
          assetId: 'asset-ren-voss',
        }),
      {
        wrapper,
      },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.workspace).toMatchObject({
      assetId: 'asset-ren-voss',
      kind: 'character',
      title: 'Ren Voss',
      navigator: {
        characters: expect.arrayContaining([expect.objectContaining({ id: 'asset-ren-voss' })]),
        locations: expect.arrayContaining([expect.objectContaining({ id: 'asset-midnight-platform' })]),
        rules: expect.arrayContaining([expect.objectContaining({ id: 'asset-ledger-stays-shut' })]),
      },
      profile: {
        sections: expect.arrayContaining([
          expect.objectContaining({
            id: 'identity',
            facts: expect.arrayContaining([expect.objectContaining({ id: 'role', value: 'Courier negotiator' })]),
          }),
        ]),
      },
      mentions: expect.arrayContaining([
        expect.objectContaining({
          id: 'mention-ren-midnight-platform',
          targetScope: 'scene',
          title: 'Midnight Platform',
          recommendedLens: 'draft',
          handoffActions: expect.arrayContaining([
            expect.objectContaining({
              lens: 'draft',
              recommended: true,
            }),
            expect.objectContaining({
              lens: 'orchestrate',
              recommended: false,
            }),
          ]),
        }),
      ]),
      relations: expect.arrayContaining([
        expect.objectContaining({
          id: 'relation-ren-mei',
          targetAssetId: 'asset-mei-arden',
          targetTitle: 'Mei Arden',
        }),
      ]),
      inspector: expect.objectContaining({
        kindLabel: 'Character',
        mentionCount: 3,
        relationCount: 3,
      }),
      dockSummary: expect.objectContaining({
        warningCount: 1,
        relationCount: 3,
        mentionCount: 3,
      }),
      dockActivity: expect.arrayContaining([
        expect.objectContaining({
          kind: 'lens',
          title: 'Entered Knowledge',
        }),
        expect.objectContaining({
          kind: 'asset',
          title: 'Focused Ren Voss',
        }),
      ]),
    })

    expect(hook.result.current.workspace?.navigator.characters).toHaveLength(2)
    expect(hook.result.current.workspace?.navigator.locations).toHaveLength(2)
    expect(hook.result.current.workspace?.navigator.rules).toHaveLength(2)
    expect(hook.result.current.workspace?.dockSummary.problemItems).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: 'Warning' })]),
    )
  })

  it('derives dock activity from the workspace model and active route view without changing the query identity', async () => {
    const { wrapper } = wrapperFactory()
    type HookProps = { activeView: AssetKnowledgeView }
    const initialProps: HookProps = { activeView: 'mentions' }

    const hook = renderHook(
      ({ activeView }: HookProps) =>
        useAssetKnowledgeWorkspaceQuery(
          {
            assetId: 'asset-ren-voss',
            activeView,
          },
        ),
      {
        initialProps,
        wrapper,
      },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.workspace?.dockActivity).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'view',
          title: 'Switched to Mentions',
        }),
      ]),
    )

    const nextProps: HookProps = { activeView: 'relations' }
    hook.rerender(nextProps)

    await waitFor(() => {
      expect(hook.result.current.workspace?.dockActivity).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: 'view',
            title: 'Switched to Relations',
          }),
        ]),
      )
    })
  })

  it('preserves every representable recommended handoff lens in the mapped handoff actions', async () => {
    const { wrapper } = wrapperFactory()

    const renHook = renderHook(
      () =>
        useAssetKnowledgeWorkspaceQuery({
          assetId: 'asset-ren-voss',
        }),
      { wrapper },
    )

    await waitFor(() => {
      expect(renHook.result.current.workspace?.assetId).toBe('asset-ren-voss')
    })

    const renSceneMention = renHook.result.current.workspace?.mentions.find((mention) => mention.id === 'mention-ren-ticket-window')
    expect(renSceneMention?.recommendedLens).toBe('orchestrate')
    expect(renSceneMention?.handoffActions.filter((action) => action.recommended)).toEqual([
      expect.objectContaining({
        targetScope: 'scene',
        lens: 'orchestrate',
      }),
    ])

    const renChapterMention = renHook.result.current.workspace?.mentions.find((mention) => mention.id === 'mention-ren-signals-in-rain')
    expect(renChapterMention?.recommendedLens).toBe('structure')
    expect(renChapterMention?.handoffActions.filter((action) => action.recommended)).toEqual([
      expect.objectContaining({
        targetScope: 'chapter',
        lens: 'structure',
      }),
    ])

    const meiHook = renderHook(
      () =>
        useAssetKnowledgeWorkspaceQuery({
          assetId: 'asset-mei-arden',
        }),
      { wrapper },
    )

    await waitFor(() => {
      expect(meiHook.result.current.workspace?.assetId).toBe('asset-mei-arden')
    })

    const meiSceneMention = meiHook.result.current.workspace?.mentions.find((mention) => mention.id === 'mention-mei-ticket-window')
    expect(meiSceneMention?.recommendedLens).toBe('orchestrate')
    expect(meiSceneMention?.handoffActions.filter((action) => action.recommended)).toEqual([
      expect.objectContaining({
        targetScope: 'scene',
        lens: 'orchestrate',
      }),
    ])

    const platformHook = renderHook(
      () =>
        useAssetKnowledgeWorkspaceQuery({
          assetId: 'asset-midnight-platform',
        }),
      { wrapper },
    )

    await waitFor(() => {
      expect(platformHook.result.current.workspace?.assetId).toBe('asset-midnight-platform')
    })

    const platformSceneMention = platformHook.result.current.workspace?.mentions.find((mention) => mention.id === 'mention-platform-midnight-platform')
    expect(platformSceneMention?.recommendedLens).toBe('orchestrate')
    expect(platformSceneMention?.handoffActions.filter((action) => action.recommended)).toEqual([
      expect.objectContaining({
        targetScope: 'scene',
        lens: 'orchestrate',
      }),
    ])

    const platformChapterMention = platformHook.result.current.workspace?.mentions.find((mention) => mention.id === 'mention-platform-signals-in-rain')
    expect(platformChapterMention?.recommendedLens).toBe('structure')
    expect(platformChapterMention?.handoffActions.filter((action) => action.recommended)).toEqual([
      expect.objectContaining({
        targetScope: 'chapter',
        lens: 'structure',
      }),
    ])

    const bellHook = renderHook(
      () =>
        useAssetKnowledgeWorkspaceQuery({
          assetId: 'asset-departure-bell-timing',
        }),
      { wrapper },
    )

    await waitFor(() => {
      expect(bellHook.result.current.workspace?.assetId).toBe('asset-departure-bell-timing')
    })

    const bellSceneMention = bellHook.result.current.workspace?.mentions.find((mention) => mention.id === 'mention-bell-departure-bell')
    expect(bellSceneMention?.recommendedLens).toBe('orchestrate')
    expect(bellSceneMention?.handoffActions.filter((action) => action.recommended)).toEqual([
      expect.objectContaining({
        targetScope: 'scene',
        lens: 'orchestrate',
      }),
    ])
  })

  it('re-localizes the knowledge workspace when the locale changes', async () => {
    window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, 'en')
    const { wrapper, setLocale } = wrapperFactory()

    const hook = renderHook(
      () =>
        useAssetKnowledgeWorkspaceQuery({
          assetId: 'asset-ren-voss',
        }),
      {
        wrapper,
      },
    )

    await waitFor(() => {
      expect(hook.result.current.workspace?.title).toBe('Ren Voss')
    })

    setLocale('zh-CN')

    await waitFor(() => {
      expect(hook.result.current.workspace?.title).toBe('任·沃斯')
    })

    expect(hook.result.current.workspace?.relations[0]?.targetTitle).toBeTruthy()
    expect(hook.result.current.workspace?.mentions[0]?.title).toBeTruthy()
  })
})
