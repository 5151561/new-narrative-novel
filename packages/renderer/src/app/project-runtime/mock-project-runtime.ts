import { bookClient, type BookClient } from '@/features/book/api/book-client'
import { chapterClient, type ChapterClient } from '@/features/chapter/api/chapter-client'
import { reviewClient, type ReviewClient } from '@/features/review/api/review-client'
import { sceneClient, type SceneClient } from '@/features/scene/api/scene-client'
import type { TraceabilitySceneClient } from '@/features/traceability/hooks/useTraceabilitySceneSources'

import { createLocalStorageProjectPersistence } from './local-storage-project-persistence'
import type { ProjectPersistencePort } from './project-persistence'
import type { ProjectRuntime } from './project-runtime'

interface CreateMockProjectRuntimeOptions {
  projectId?: string
  bookClient?: BookClient
  chapterClient?: ChapterClient
  reviewClient?: ReviewClient
  sceneClient?: SceneClient
  traceabilitySceneClient?: TraceabilitySceneClient
  persistence?: ProjectPersistencePort
}

export function createMockProjectRuntime({
  projectId = 'book-signal-arc',
  bookClient: runtimeBookClient = bookClient,
  chapterClient: runtimeChapterClient = chapterClient,
  reviewClient: runtimeReviewClient = reviewClient,
  sceneClient: runtimeSceneClient = sceneClient,
  traceabilitySceneClient = runtimeSceneClient,
  persistence = createLocalStorageProjectPersistence(),
}: CreateMockProjectRuntimeOptions = {}): ProjectRuntime {
  return {
    projectId,
    bookClient: runtimeBookClient,
    chapterClient: runtimeChapterClient,
    reviewClient: runtimeReviewClient,
    sceneClient: runtimeSceneClient,
    traceabilitySceneClient,
    persistence,
  }
}
