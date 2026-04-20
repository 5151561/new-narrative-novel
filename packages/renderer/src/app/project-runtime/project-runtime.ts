import type { BookClient } from '@/features/book/api/book-client'
import type { ChapterClient } from '@/features/chapter/api/chapter-client'
import type { ReviewClient } from '@/features/review/api/review-client'
import type { SceneClient } from '@/features/scene/api/scene-client'
import type { TraceabilitySceneClient } from '@/features/traceability/hooks/useTraceabilitySceneSources'

import type { ProjectPersistencePort } from './project-persistence'

export interface ProjectRuntime {
  projectId: string
  bookClient: BookClient
  chapterClient: ChapterClient
  reviewClient: ReviewClient
  sceneClient: SceneClient
  traceabilitySceneClient: TraceabilitySceneClient
  persistence: ProjectPersistencePort
}
