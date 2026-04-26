import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'

import { useI18n } from '@/app/i18n'
import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
import type { ChapterClient } from '@/features/chapter/api/chapter-client'
import type { SceneClient } from '@/features/scene/api/scene-client'
import type { TraceabilitySceneClient } from '@/features/traceability/hooks/useTraceabilitySceneSources'

import { isUnsupportedBookDraftAssemblyError, type BookClient } from '../api/book-client'
import {
  buildBookDraftWorkspaceViewModel,
  buildBookDraftWorkspaceViewModelFromAssemblyRecord,
} from '../lib/book-draft-workspace-mappers'
import { bookQueryKeys } from './book-query-keys'
import { useBookWorkspaceSources } from './useBookWorkspaceSources'

interface UseBookDraftWorkspaceQueryInput {
  bookId: string
  selectedChapterId?: string | null
}

interface BookDraftWorkspaceQueryDeps {
  bookClient?: Pick<BookClient, 'getBookDraftAssembly' | 'getBookStructureRecord'>
  chapterClient?: Pick<ChapterClient, 'getChapterStructureWorkspace'>
  sceneClient?: Pick<SceneClient, 'getSceneProse'>
  traceabilitySceneClient?: TraceabilitySceneClient
}

const legacyBookWorkspaceFallbackToken = Symbol('legacy-book-workspace-fallback')

export function useBookDraftWorkspaceQuery(
  { bookId, selectedChapterId }: UseBookDraftWorkspaceQueryInput,
  deps: BookDraftWorkspaceQueryDeps = {},
) {
  const runtime = useOptionalProjectRuntime()
  const { locale } = useI18n()
  const effectiveBookClient = resolveProjectRuntimeDependency(
    deps.bookClient,
    runtime?.bookClient,
    'useBookDraftWorkspaceQuery',
    'deps.bookClient',
  )
  const supportsLiveDraftAssembly = typeof effectiveBookClient.getBookDraftAssembly === 'function'
  const assemblyQuery = useQuery({
    queryKey: bookQueryKeys.draftAssembly(bookId, locale),
    enabled: supportsLiveDraftAssembly,
    queryFn: async () => {
      if (!effectiveBookClient.getBookDraftAssembly) {
        return legacyBookWorkspaceFallbackToken
      }

      try {
        return await effectiveBookClient.getBookDraftAssembly({ bookId })
      } catch (error) {
        if (isUnsupportedBookDraftAssemblyError(error)) {
          return legacyBookWorkspaceFallbackToken
        }

        throw error
      }
    },
  })
  const shouldUseLegacyWorkspaceSources =
    !supportsLiveDraftAssembly || assemblyQuery.data === legacyBookWorkspaceFallbackToken
  const sources = useBookWorkspaceSources({ bookId, enabled: shouldUseLegacyWorkspaceSources }, deps)

  const workspace = useMemo(() => {
    if (!shouldUseLegacyWorkspaceSources) {
      if (assemblyQuery.isLoading || assemblyQuery.error || assemblyQuery.data === undefined) {
        return undefined
      }

      if (assemblyQuery.data === null) {
        return null
      }

      return buildBookDraftWorkspaceViewModelFromAssemblyRecord({
        record: assemblyQuery.data,
        locale,
        selectedChapterId,
      })
    }

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
    assemblyQuery.data,
    assemblyQuery.error,
    assemblyQuery.isLoading,
    locale,
    selectedChapterId,
    shouldUseLegacyWorkspaceSources,
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
    isLoading:
      supportsLiveDraftAssembly && !shouldUseLegacyWorkspaceSources
        ? assemblyQuery.isLoading
        : (supportsLiveDraftAssembly && assemblyQuery.isLoading) || sources.isLoading,
    error:
      (assemblyQuery.error instanceof Error ? assemblyQuery.error : null) ??
      sources.error,
    refetch: async () => {
      if (shouldUseLegacyWorkspaceSources) {
        await sources.refetch()
        return
      }

      if (supportsLiveDraftAssembly) {
        await assemblyQuery.refetch()
      }
    },
  }
}
