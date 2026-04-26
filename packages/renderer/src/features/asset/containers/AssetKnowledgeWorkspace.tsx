import { useCallback } from 'react'

import {
  getAssetKindLabel,
  getAssetKnowledgeViewLabel,
  getLocaleName,
  getWorkbenchLensLabel,
  useI18n,
} from '@/app/i18n'
import { classifyApiResponseState } from '@/app/project-runtime'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { WorkbenchShell } from '@/features/workbench/components/WorkbenchShell'
import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'
import { useAssetTraceabilitySummaryQuery } from '@/features/traceability/hooks/useAssetTraceabilitySummaryQuery'

import { AssetDockContainer } from './AssetDockContainer'
import { mergeAssetTraceabilityIntoWorkspace } from '../lib/mergeAssetTraceabilityIntoWorkspace'
import { AssetModeRail } from '../components/AssetModeRail'
import { AssetInspectorPane } from '../components/AssetInspectorPane'
import { AssetKnowledgeStage } from '../components/AssetKnowledgeStage'
import { AssetNavigatorPane } from '../components/AssetNavigatorPane'
import { useAssetKnowledgeWorkspaceQuery } from '../hooks/useAssetKnowledgeWorkspaceQuery'

function LanguageToggle() {
  const { locale, setLocale, dictionary } = useI18n()

  return (
    <div className="flex items-center gap-1 rounded-md border border-line-soft bg-surface-2 p-1">
      <span className="px-2 text-[11px] uppercase tracking-[0.05em] text-text-soft">{dictionary.common.language}</span>
      {(['en', 'zh-CN'] as const).map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={locale === value}
          onClick={() => setLocale(value)}
          className={`rounded-md px-2 py-1 text-xs font-medium ${
            locale === value ? 'bg-surface-1 text-text-main shadow-ringwarm' : 'text-text-muted'
          }`}
        >
          {getLocaleName(locale, value)}
        </button>
      ))}
    </div>
  )
}

function AssetPaneState({ title, message }: { title: string; message: string }) {
  return (
    <div className="p-4">
      <EmptyState title={title} message={message} />
    </div>
  )
}

function AssetTopBar({
  title,
  kind,
  view,
}: {
  title?: string
  kind?: 'character' | 'location' | 'rule'
  view: 'profile' | 'mentions' | 'relations' | 'context'
}) {
  const { locale, dictionary } = useI18n()

  return (
    <div className="flex h-full flex-wrap items-center justify-between gap-3" data-testid="asset-top-bar">
      <div className="min-w-0 space-y-1">
        <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.narrativeWorkbench}</p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg leading-tight text-text-main">{dictionary.app.assetKnowledge}</h1>
          <Badge tone="neutral">{dictionary.common.asset}</Badge>
          {kind ? <Badge tone="accent">{getAssetKindLabel(locale, kind)}</Badge> : null}
        </div>
        <p className="text-sm text-text-muted">
          {title ?? dictionary.common.asset} / {getWorkbenchLensLabel(locale, 'knowledge')} / {getAssetKnowledgeViewLabel(locale, view)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <LanguageToggle />
        <Badge tone="neutral">{getWorkbenchLensLabel(locale, 'knowledge')}</Badge>
        <Badge tone="neutral">{getAssetKnowledgeViewLabel(locale, view)}</Badge>
      </div>
    </div>
  )
}

export function AssetKnowledgeWorkspace() {
  const { route, replaceRoute, patchAssetRoute } = useWorkbenchRouteState()
  const { locale, dictionary } = useI18n()

  if (route.scope !== 'asset') {
    return null
  }

  const { workspace, isLoading, error } = useAssetKnowledgeWorkspaceQuery({
    assetId: route.assetId,
    activeView: route.view,
  })
  const responseState = classifyApiResponseState({
    data: workspace,
    error,
  })
  const traceability = useAssetTraceabilitySummaryQuery(route.assetId)

  const openSceneFromAsset = useCallback(
    (sceneId: string, lens: 'draft' | 'orchestrate') => {
      replaceRoute({
        scope: 'scene',
        sceneId,
        lens,
        tab: lens === 'draft' ? 'prose' : 'execution',
        beatId: undefined,
        proposalId: undefined,
        modal: undefined,
      })
    },
    [replaceRoute],
  )

  const openChapterFromAsset = useCallback(
    (chapterId: string, lens: 'structure' | 'draft') => {
      replaceRoute({
        scope: 'chapter',
        chapterId,
        lens,
        view: 'sequence',
        sceneId: undefined,
      })
    },
    [replaceRoute],
  )

  if (responseState.kind === 'auth' || responseState.kind === 'unavailable') {
    return (
      <WorkbenchShell
        topBar={<AssetTopBar view={route.view} />}
        modeRail={
          <AssetModeRail
            activeScope="asset"
            activeLens="knowledge"
            onSelectScope={(scope) => {
              if (scope === 'asset') {
                return
              }
              replaceRoute({ scope })
            }}
            onSelectLens={() => {}}
          />
        }
        navigator={<AssetPaneState title={locale === 'zh-CN' ? '资产不可用' : 'Asset unavailable'} message={responseState.message ?? ''} />}
        mainStage={<AssetPaneState title={locale === 'zh-CN' ? '知识页不可用' : 'Knowledge unavailable'} message={responseState.message ?? ''} />}
        inspector={<AssetPaneState title={locale === 'zh-CN' ? '检查器不可用' : 'Inspector unavailable'} message={responseState.message ?? ''} />}
        bottomDock={<AssetPaneState title={locale === 'zh-CN' ? '底部面板不可用' : 'Bottom dock unavailable'} message={responseState.message ?? ''} />}
      />
    )
  }

  if (isLoading || responseState.kind === 'pending') {
    const message =
      locale === 'zh-CN'
        ? '正在准备知识页、mentions、relations、trace detail 和检查器摘要。'
        : 'Preparing the knowledge workspace, mentions, relations, trace detail, and inspector summary.'

    return (
      <WorkbenchShell
        topBar={<AssetTopBar view={route.view} />}
        modeRail={
          <AssetModeRail
            activeScope="asset"
            activeLens="knowledge"
            onSelectScope={(scope) => {
              if (scope === 'asset') {
                return
              }
              replaceRoute({ scope })
            }}
            onSelectLens={() => {}}
          />
        }
        navigator={<AssetPaneState title={dictionary.common.loading} message={message} />}
        mainStage={<AssetPaneState title={dictionary.common.loading} message={message} />}
        inspector={<AssetPaneState title={dictionary.common.loading} message={message} />}
        bottomDock={<AssetPaneState title={dictionary.common.loading} message={message} />}
      />
    )
  }

  if (responseState.kind === 'not-found') {
    const message =
      responseState.message ??
      (locale === 'zh-CN' ? `未找到资产 ${route.assetId}。` : `Asset ${route.assetId} could not be found.`)

    return (
      <WorkbenchShell
        topBar={<AssetTopBar view={route.view} />}
        modeRail={
          <AssetModeRail
            activeScope="asset"
            activeLens="knowledge"
            onSelectScope={(scope) => {
              if (scope === 'asset') {
                return
              }
              replaceRoute({ scope })
            }}
            onSelectLens={() => {}}
          />
        }
        navigator={<AssetPaneState title={locale === 'zh-CN' ? '资产不存在' : 'Asset not found'} message={message} />}
        mainStage={<AssetPaneState title={locale === 'zh-CN' ? '资产不存在' : 'Asset not found'} message={message} />}
        inspector={<AssetPaneState title={locale === 'zh-CN' ? '资产不存在' : 'Asset not found'} message={message} />}
        bottomDock={<AssetPaneState title={locale === 'zh-CN' ? '资产不存在' : 'Asset not found'} message={message} />}
      />
    )
  }

  const traceAwareWorkspace = mergeAssetTraceabilityIntoWorkspace({
    workspace,
    traceability: {
      summary: traceability.summary,
      isLoading: traceability.isLoading,
      error: traceability.error,
    },
    locale,
  })

  return (
    <WorkbenchShell
      topBar={
        <AssetTopBar
          title={traceAwareWorkspace.title}
          kind={traceAwareWorkspace.kind}
          view={route.view}
        />
      }
      modeRail={
        <AssetModeRail
          activeScope="asset"
          activeLens="knowledge"
          onSelectScope={(scope) => {
            if (scope === 'asset') {
              return
            }
            replaceRoute({ scope })
          }}
          onSelectLens={() => {
            if (route.lens !== 'knowledge') {
              patchAssetRoute({ lens: 'knowledge' })
            }
          }}
        />
      }
      navigator={
        <AssetNavigatorPane
          groups={traceAwareWorkspace.navigator}
          activeAssetId={traceAwareWorkspace.assetId}
          onSelectAsset={(assetId) => patchAssetRoute({ assetId })}
        />
      }
      mainStage={
        <AssetKnowledgeStage
          assetTitle={traceAwareWorkspace.title}
          assetSummary={traceAwareWorkspace.summary}
          activeView={route.view}
          availableViews={traceAwareWorkspace.viewsMeta.availableViews}
          profile={traceAwareWorkspace.profile}
          mentions={traceAwareWorkspace.mentions}
          relations={traceAwareWorkspace.relations}
          contextPolicy={traceAwareWorkspace.contextPolicy}
          onViewChange={(view) => patchAssetRoute({ view })}
          onOpenScene={openSceneFromAsset}
          onOpenChapter={openChapterFromAsset}
          onSelectAsset={(assetId) => patchAssetRoute({ assetId })}
        />
      }
      inspector={<AssetInspectorPane title={traceAwareWorkspace.title} inspector={traceAwareWorkspace.inspector} />}
      bottomDock={<AssetDockContainer workspace={traceAwareWorkspace} />}
    />
  )
}
