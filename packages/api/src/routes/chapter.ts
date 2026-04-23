import { badRequest } from '../http/errors.js'

import type { ApiRouteContext } from './route-context.js'

export function registerChapterRoutes({ app, apiBasePath, repository }: ApiRouteContext) {
  const projectBase = `${apiBasePath}/projects/:projectId`

  app.get(`${projectBase}/chapters/:chapterId/structure`, async (request) => {
    const { projectId, chapterId } = request.params as { projectId: string; chapterId: string }
    return repository.getChapterStructure(projectId, chapterId)
  })

  app.post(`${projectBase}/chapters/:chapterId/scenes/:sceneId/reorder`, async (request) => {
    const { projectId, chapterId, sceneId } = request.params as {
      projectId: string
      chapterId: string
      sceneId: string
    }
    const body = request.body as { targetIndex?: number }
    if (typeof body?.targetIndex !== 'number' || Number.isNaN(body.targetIndex)) {
      throw badRequest('targetIndex must be a number.', {
        code: 'INVALID_TARGET_INDEX',
        detail: { body },
      })
    }

    return repository.reorderChapterScene(projectId, {
      chapterId,
      sceneId,
      targetIndex: body.targetIndex,
    })
  })

  app.patch(`${projectBase}/chapters/:chapterId/scenes/:sceneId/structure`, async (request) => {
    const { projectId, chapterId, sceneId } = request.params as {
      projectId: string
      chapterId: string
      sceneId: string
    }
    const body = request.body as { locale?: 'en' | 'zh-CN'; patch?: Record<string, string> }
    if (body?.locale !== 'en' && body?.locale !== 'zh-CN') {
      throw badRequest('locale must be "en" or "zh-CN".', {
        code: 'INVALID_LOCALE',
        detail: { body },
      })
    }

    return repository.updateChapterSceneStructure(projectId, {
      chapterId,
      sceneId,
      locale: body.locale,
      patch: body.patch ?? {},
    })
  })
}
