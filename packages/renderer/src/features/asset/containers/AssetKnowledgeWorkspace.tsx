import { useCallback } from 'react'

import { getAssetKnowledgeViewLabel, getWorkbenchLensLabel, useI18n } from '@/app/i18n'
import { classifyApiResponseState } from '@/app/project-runtime'
import { EmptyState } from '@/components/ui/EmptyState'
import { LocaleToggle } from '@/features/workbench/components/LocaleToggle'
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

function AssetPaneState({ title, message }: { title: string; message: string }) {
  return (
    <div className="p-4">
      <EmptyState title={title} message={message} />
    </div>
  )
}

function AssetTopBar({
  title,
  view,
}: {
  title?: string
  view: 'profile' | 'mentions' | 'relations' | 'context'
}) {
  const { locale, dictionary } = useI18n()

  return (
    <div className="flex h-full flex-wrap items-center justify-end gap-2" data-testid="asset-top-bar">
      <div className="sr-only">
        <h1>{dictionary.app.assetKnowledge}</h1>
        <p>
          {title ?? dictionary.common.asset} / {getWorkbenchLensLabel(locale, 'knowledge')} / {getAssetKnowledgeViewLabel(locale, view)}
        </p>
      </div>
      <LocaleToggle />
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
    workspace: workspace!,
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
        <AssetTopBar title={traceAwareWorkspace.title} view={route.view} />
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
          storyBible={traceAwareWorkspace.storyBible}
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
