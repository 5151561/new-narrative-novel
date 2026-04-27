import type { AssetClient } from '@/features/asset/api/asset-client'
import type { BookClient } from '@/features/book/api/book-client'
import type { ChapterClient } from '@/features/chapter/api/chapter-client'
import type { ReviewClient } from '@/features/review/api/review-client'
import type { RunClient } from '@/features/run/api/run-client'
import type { SceneClient } from '@/features/scene/api/scene-client'
import type { TraceabilitySceneClient } from '@/features/traceability/hooks/useTraceabilitySceneSources'

import type { ProjectPersistencePort } from './project-persistence'
import type { ProjectRuntimeInfoClient } from './project-runtime-info'

export interface ProjectRuntime {
  projectId: string
  projectTitle?: string
  bookClient: BookClient
  chapterClient: ChapterClient
  assetClient: AssetClient
  reviewClient: ReviewClient
  runClient: RunClient
  runtimeInfoClient: ProjectRuntimeInfoClient
  sceneClient: SceneClient
  traceabilitySceneClient: TraceabilitySceneClient
  // Mock-only preview/dev/test capability. API runtimes intentionally omit persistence.
  persistence?: ProjectPersistencePort
}
