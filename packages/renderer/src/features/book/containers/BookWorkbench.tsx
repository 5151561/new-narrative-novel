import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'

import { BookDraftWorkspace } from './BookDraftWorkspace'
import { BookStructureWorkspace } from './BookStructureWorkspace'

export function BookWorkbench() {
  const { route } = useWorkbenchRouteState()

  if (route.scope !== 'book') {
    return null
  }

  return route.lens === 'draft' ? <BookDraftWorkspace /> : <BookStructureWorkspace />
}
