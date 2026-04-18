import { useMemo } from 'react'

import { useI18n } from '@/app/i18n'
import type { ChapterClient } from '@/features/chapter/api/chapter-client'
import type { SceneClient } from '@/features/scene/api/scene-client'
import type { TraceabilitySceneClient } from '@/features/traceability/hooks/useTraceabilitySceneSources'

import type { BookClient } from '../api/book-client'
import { buildBookDraftWorkspaceViewModel } from '../lib/book-draft-workspace-mappers'
import { useBookWorkspaceSources } from './useBookWorkspaceSources'

interface UseBookDraftWorkspaceQueryInput {
  bookId: string
  selectedChapterId?: string | null
}

interface BookDraftWorkspaceQueryDeps {
  bookClient?: Pick<BookClient, 'getBookStructureRecord'>
  chapterClient?: Pick<ChapterClient, 'getChapterStructureWorkspace'>
  sceneClient?: Pick<SceneClient, 'getSceneProse'>
  traceabilitySceneClient?: TraceabilitySceneClient
}

export function useBookDraftWorkspaceQuery(
  { bookId, selectedChapterId }: UseBookDraftWorkspaceQueryInput,
  deps: BookDraftWorkspaceQueryDeps = {},
) {
  const { locale } = useI18n()
  const sources = useBookWorkspaceSources({ bookId }, deps)

  const workspace = useMemo(() => {
    if (sources.isLoading || sources.error || sources.bookRecord === undefined) {
      return undefined
    }

    if (sources.bookRecord === null) {
      return null
    }

    return buildBookDraftWorkspaceViewModel({
      record: sources.bookRecord,
      locale,
      selectedChapterId,
      chapterWorkspacesById: sources.chapterWorkspacesById,
      sceneProseBySceneId: sources.sceneProseBySceneId,
      sceneProseStateBySceneId: sources.sceneProseStateBySceneId,
      traceRollupsBySceneId: sources.traceRollupsBySceneId,
    })
  }, [
    locale,
    selectedChapterId,
    sources.bookRecord,
    sources.chapterWorkspacesById,
    sources.error,
    sources.isLoading,
    sources.sceneProseBySceneId,
    sources.sceneProseStateBySceneId,
    sources.traceRollupsBySceneId,
  ])

  return {
    workspace,
    isLoading: sources.isLoading,
    error: sources.error,
    refetch: sources.refetch,
  }
}
