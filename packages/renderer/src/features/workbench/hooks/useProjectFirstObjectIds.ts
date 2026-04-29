import { useQuery } from '@tanstack/react-query'

import { useProjectRuntime } from '@/app/project-runtime'
import { bookQueryKeys } from '@/features/book/hooks/book-query-keys'
import { chapterQueryKeys } from '@/features/chapter/hooks/chapter-query-keys'

export function useProjectFirstObjectIds() {
  const runtime = useProjectRuntime()
  const projectId = runtime.projectId
  const projectMode = runtime.info?.projectMode

  const firstBookId = `book-${projectId}`

  const bookStructureQuery = useQuery({
    queryKey: bookQueryKeys.structure(firstBookId),
    queryFn: () => runtime.bookClient.getBookStructure({ projectId, bookId: firstBookId }),
    enabled: Boolean(projectId) && Boolean(firstBookId),
  })

  const firstChapterId = bookStructureQuery.data?.chapterIds?.[0] ?? null

  const chapterStructureQuery = useQuery({
    queryKey: firstChapterId ? chapterQueryKeys.workspace(firstChapterId) : [...chapterQueryKeys.all, 'workspace', 'first-scene-resolver', projectId],
    queryFn: () => runtime.chapterClient.getChapterStructureWorkspace({ chapterId: firstChapterId! }),
    enabled: Boolean(firstChapterId),
  })

  const firstSceneId = chapterStructureQuery.data?.scenes?.[0]?.id ?? null

  return {
    bookId: firstBookId,
    chapterId: firstChapterId,
    sceneId: firstSceneId,
    projectMode,
    isRealProject: projectMode === 'real-project',
    isLoading: bookStructureQuery.isLoading || chapterStructureQuery.isLoading,
  }
}
