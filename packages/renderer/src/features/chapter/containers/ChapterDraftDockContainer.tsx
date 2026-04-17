import { useI18n } from '@/app/i18n'

import { ChapterDraftBottomDock } from '../components/ChapterDraftBottomDock'
import { useChapterDraftActivity } from '../hooks/useChapterDraftActivity'
import type { ChapterDraftWorkspaceViewModel } from '../types/chapter-draft-view-models'

interface ChapterDraftDockContainerProps {
  workspace: ChapterDraftWorkspaceViewModel
}

export function ChapterDraftDockContainer({ workspace }: ChapterDraftDockContainerProps) {
  const { locale } = useI18n()
  const activity = useChapterDraftActivity({
    chapterId: workspace.chapterId,
    selectedScene: workspace.selectedScene
      ? {
          id: workspace.selectedScene.sceneId,
          title: workspace.selectedScene.title,
          summary: workspace.selectedScene.summary,
        }
      : null,
    locale,
  })

  return <ChapterDraftBottomDock summary={workspace.dockSummary} activity={activity} />
}
