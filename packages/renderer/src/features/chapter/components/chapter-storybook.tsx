import { useMemo, type PropsWithChildren } from 'react'

import { getChapterStructureViewLabel, useI18n, type Locale } from '@/app/i18n'
import { AppProviders } from '@/app/providers'
import { createStoryProjectRuntimeEnvironment } from '@/app/project-runtime'

import {
  buildChapterDraftMissingStoryWorkspace,
  buildChapterDraftStoryWorkspace,
  buildChapterProblemsHeavyStoryWorkspace,
  buildChapterStoryWorkspace,
  buildQuietChapterDraftStoryWorkspace,
} from './chapter-story-fixture'
import type { ChapterDraftActivityItem } from '../hooks/useChapterDraftActivity'
import type { ChapterWorkbenchActivityItem } from '../hooks/useChapterWorkbenchActivity'
import type { ChapterDraftWorkspaceViewModel } from '../types/chapter-draft-view-models'
import type { ChapterStructureView, ChapterStructureWorkspaceViewModel } from '../types/chapter-view-models'

export type ChapterStructureStoryVariant = 'default' | 'problems-heavy'
export type ChapterDraftStoryVariant = 'default' | 'missing' | 'quiet'

export function ChapterStoryShell({
  children,
  frameClassName,
}: PropsWithChildren<{ frameClassName: string }>) {
  const storyEnvironment = useMemo(() => createStoryProjectRuntimeEnvironment(), [])

  return (
    <AppProviders runtime={storyEnvironment.runtime} queryClient={storyEnvironment.queryClient}>
      <div className="min-h-[720px] bg-app p-6">
        <div className={frameClassName}>{children}</div>
      </div>
    </AppProviders>
  )
}

export function useLocalizedChapterStructureWorkspace(
  selectedSceneId: string,
  variant: ChapterStructureStoryVariant = 'default',
) {
  const { locale } = useI18n()

  return useMemo<ChapterStructureWorkspaceViewModel>(() => {
    return variant === 'problems-heavy'
      ? buildChapterProblemsHeavyStoryWorkspace(selectedSceneId, locale)
      : buildChapterStoryWorkspace(selectedSceneId, locale)
  }, [locale, selectedSceneId, variant])
}

export function useLocalizedChapterDraftWorkspace(
  selectedSceneId: string,
  variant: ChapterDraftStoryVariant = 'default',
) {
  const { locale } = useI18n()

  return useMemo<ChapterDraftWorkspaceViewModel>(() => {
    if (variant === 'missing') {
      return buildChapterDraftMissingStoryWorkspace(selectedSceneId, locale)
    }

    if (variant === 'quiet') {
      return buildQuietChapterDraftStoryWorkspace(selectedSceneId, locale)
    }

    return buildChapterDraftStoryWorkspace(selectedSceneId, locale)
  }, [locale, selectedSceneId, variant])
}

export function buildChapterBottomDockProblems(workspace: ChapterStructureWorkspaceViewModel) {
  const selectedScene = workspace.scenes.find((scene) => scene.id === workspace.selectedSceneId) ?? workspace.scenes[0]

  return {
    unresolvedCount: workspace.unresolvedCount,
    selectedScene: workspace.inspector.selectedSceneBrief
      ? {
          title: workspace.inspector.selectedSceneBrief.title,
          summary: workspace.inspector.selectedSceneBrief.summary,
          unresolvedLabel: workspace.inspector.selectedSceneBrief.unresolvedLabel,
        }
      : null,
    problemsSummary: workspace.inspector.problemsSummary,
    assemblyHints: workspace.inspector.assemblyHints,
    status: {
      acceptedProposalId: workspace.planning.acceptedProposalId,
      selectedSceneBacklogStatusLabel: selectedScene?.backlogStatusLabel,
      sceneStatuses: workspace.scenes.map((scene) => ({
        id: scene.id,
        title: scene.title,
        backlogStatusLabel: scene.backlogStatusLabel,
      })),
    },
  }
}

export function buildChapterDraftStoryActivity(
  locale: Locale,
  workspace: ChapterDraftWorkspaceViewModel,
): ChapterDraftActivityItem[] {
  const selectedTitle = workspace.selectedScene?.title ?? workspace.title

  return [
    {
      id: 'lens-0',
      kind: 'lens',
      title: locale === 'zh-CN' ? '进入章节 Draft' : 'Entered chapter draft',
      detail:
        locale === 'zh-CN'
          ? '阅读稿会继续围绕同一个 chapter identity 和 route.sceneId 对齐。'
          : 'The reading surface stays aligned to the same chapter identity and route.sceneId.',
      tone: 'accent',
    },
    {
      id: 'scene-1',
      kind: 'scene',
      title: locale === 'zh-CN' ? `聚焦${selectedTitle}` : `Focused ${selectedTitle}`,
      detail: workspace.selectedScene?.summary ?? workspace.summary,
      tone: 'neutral',
    },
  ]
}

export function buildChapterStructureStoryActivity(
  locale: Locale,
  workspace: ChapterStructureWorkspaceViewModel,
  options: {
    activeView: ChapterStructureView
    includeAssemblySwitch?: boolean
    movedSceneTitle?: string
  },
): ChapterWorkbenchActivityItem[] {
  const selectedTitle = workspace.inspector.selectedSceneBrief?.title ?? workspace.title
  const selectedSummary = workspace.inspector.selectedSceneBrief?.summary ?? workspace.summary
  const items: ChapterWorkbenchActivityItem[] = [
    {
      id: 'activity-1',
      kind: 'view',
      title:
        locale === 'zh-CN'
          ? `进入${getChapterStructureViewLabel(locale, options.activeView)}`
          : `Entered ${getChapterStructureViewLabel(locale, options.activeView)}`,
      detail:
        locale === 'zh-CN'
          ? '底部日志只记录工作区切换，不接管视图状态。'
          : 'The dock records the workspace transition without owning view state.',
      tone: 'accent',
    },
    {
      id: 'activity-2',
      kind: 'scene',
      title: locale === 'zh-CN' ? `聚焦${selectedTitle}` : `Focused ${selectedTitle}`,
      detail: selectedSummary,
      tone: 'neutral',
    },
  ]

  if (options.includeAssemblySwitch) {
    items.push({
      id: 'activity-3',
      kind: 'view',
      title:
        locale === 'zh-CN'
          ? `切换到${getChapterStructureViewLabel(locale, 'assembly')}`
          : `Switched to ${getChapterStructureViewLabel(locale, 'assembly')}`,
      detail:
        locale === 'zh-CN'
          ? '判断焦点转到接缝检查，但仍保持同一个选中场景。'
          : 'Judgment moved to seam review while keeping the same selected scene.',
      tone: 'accent',
    })
  }

  if (options.movedSceneTitle) {
    items.push({
      id: 'activity-4',
      kind: 'mutation',
      title: locale === 'zh-CN' ? `前移${options.movedSceneTitle}` : `Moved ${options.movedSceneTitle} earlier`,
      detail:
        locale === 'zh-CN'
          ? '章节顺序已更新，当前选中场景保持不变。'
          : 'Chapter order changed without changing the selected scene.',
      tone: 'accent',
    })
  }

  return items
}
