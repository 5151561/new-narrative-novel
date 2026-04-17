import { getChapterUnresolvedCountLabel, useI18n } from '@/app/i18n'

import { ChapterBottomDock } from '../components/ChapterBottomDock'
import { useChapterWorkbenchActivity, type ChapterWorkbenchMutationEvent } from '../hooks/useChapterWorkbenchActivity'
import type {
  ChapterStructureSceneViewModel,
  ChapterStructureView,
  ChapterStructureWorkspaceViewModel,
} from '../types/chapter-view-models'

interface ChapterDockContainerProps {
  activeView: ChapterStructureView
  workspace: ChapterStructureWorkspaceViewModel
  latestMutation?: ChapterWorkbenchMutationEvent | null
}

function getSelectedScene(
  workspace: ChapterStructureWorkspaceViewModel,
): ChapterStructureSceneViewModel | null {
  if (workspace.scenes.length === 0) {
    return null
  }

  if (workspace.selectedSceneId) {
    return workspace.scenes.find((scene) => scene.id === workspace.selectedSceneId) ?? workspace.scenes[0] ?? null
  }

  return workspace.scenes[0] ?? null
}

export function ChapterDockContainer({ activeView, workspace, latestMutation = null }: ChapterDockContainerProps) {
  const { locale } = useI18n()
  const selectedScene = getSelectedScene(workspace)
  const selectedSceneBrief =
    workspace.inspector.selectedSceneBrief && workspace.inspector.selectedSceneBrief.sceneId === selectedScene?.id
      ? workspace.inspector.selectedSceneBrief
      : null
  const activity = useChapterWorkbenchActivity({
    chapterId: workspace.chapterId,
    activeView,
    latestMutation,
    selectedScene: selectedScene
      ? {
          id: selectedScene.id,
          title: selectedSceneBrief?.title ?? selectedScene.title,
          summary: selectedSceneBrief?.summary ?? selectedScene.summary,
        }
      : null,
  })

  return (
    <ChapterBottomDock
      problems={{
        unresolvedCount: workspace.unresolvedCount,
        selectedScene: selectedScene
          ? {
              title: selectedSceneBrief?.title ?? selectedScene.title,
              summary: selectedSceneBrief?.summary ?? selectedScene.summary,
              unresolvedLabel:
                selectedSceneBrief?.unresolvedLabel ?? getChapterUnresolvedCountLabel(locale, selectedScene.unresolvedCount),
            }
          : null,
        problemsSummary: workspace.inspector.problemsSummary,
        assemblyHints: workspace.inspector.assemblyHints,
      }}
      activity={activity}
    />
  )
}
