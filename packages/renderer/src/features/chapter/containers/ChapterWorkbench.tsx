import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'

import { ChapterDraftWorkspace } from './ChapterDraftWorkspace'
import { ChapterStructureWorkspace } from './ChapterStructureWorkspace'

export function ChapterWorkbench() {
  const { route } = useWorkbenchRouteState()

  if (route.scope !== 'chapter') {
    return null
  }

  return route.lens === 'draft' ? <ChapterDraftWorkspace /> : <ChapterStructureWorkspace />
}
