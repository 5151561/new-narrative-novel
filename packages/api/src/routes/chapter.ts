import { badRequest, notFound } from '../http/errors.js'

import type { ApiRouteContext } from './route-context.js'
import { assertEnumValue, assertOptionalString } from './validation.js'

const RUN_MODES = ['continue', 'rewrite', 'from-scratch'] as const

export function registerChapterRoutes({ app, apiBasePath, repository }: ApiRouteContext) {
  const projectBase = `${apiBasePath}/projects/:projectId`

  function readLocaleBody(body: unknown, code: string) {
    const locale = (body as { locale?: unknown } | undefined)?.locale
    if (locale !== 'en' && locale !== 'zh-CN') {
      throw badRequest('locale must be "en" or "zh-CN".', {
        code,
        detail: { body },
      })
    }

    return locale
  }

  app.get(`${projectBase}/chapters/:chapterId/structure`, async (request) => {
    const { projectId, chapterId } = request.params as { projectId: string; chapterId: string }
    return repository.getChapterStructure(projectId, chapterId)
  })

  app.get(`${projectBase}/chapters/:chapterId/draft-assembly`, async (request) => {
    const { projectId, chapterId } = request.params as { projectId: string; chapterId: string }
    return repository.getChapterDraftAssembly(projectId, chapterId)
  })

  app.patch(`${projectBase}/chapters/:chapterId/planning-input`, async (request) => {
    const { projectId, chapterId } = request.params as { projectId: string; chapterId: string }
    const body = request.body as { locale?: unknown; goal?: unknown; constraints?: unknown }
    const locale = readLocaleBody(body, 'INVALID_LOCALE')
    if (body.goal !== undefined && typeof body.goal !== 'string') {
      throw badRequest('goal must be a string when provided.', {
        code: 'INVALID_GOAL',
        detail: { body },
      })
    }
    if (body.constraints !== undefined && (!Array.isArray(body.constraints) || body.constraints.some((item) => typeof item !== 'string'))) {
      throw badRequest('constraints must be an array when provided.', {
        code: 'INVALID_CONSTRAINTS',
        detail: { body },
      })
    }

    return repository.updateChapterBacklogPlanningInput(projectId, chapterId, {
      locale,
      goal: body.goal as string | undefined,
      constraints: body.constraints as string[] | undefined,
    })
  })

  app.post(`${projectBase}/chapters/:chapterId/backlog-proposals`, async (request) => {
    const { projectId, chapterId } = request.params as { projectId: string; chapterId: string }
    const body = request.body as { locale?: unknown }
    const locale = readLocaleBody(body, 'INVALID_GENERATE_LOCALE')
    const chapter = repository.getChapterStructure(projectId, chapterId)
    if (!chapter) {
      throw notFound(`Chapter ${chapterId} was not found.`, {
        code: 'CHAPTER_NOT_FOUND',
        detail: { projectId, chapterId },
      })
    }
    if (chapter.planning.goal[locale].trim().length === 0) {
      throw badRequest(`Chapter ${chapterId} requires a saved ${locale} goal before backlog generation.`, {
        code: 'CHAPTER_BACKLOG_GOAL_REQUIRED',
        detail: { projectId, chapterId, locale },
      })
    }

    return repository.generateChapterBacklogProposal(projectId, chapterId)
  })

  app.patch(`${projectBase}/chapters/:chapterId/backlog-proposals/:proposalId/scenes/:proposalSceneId`, async (request) => {
    const { projectId, chapterId, proposalId, proposalSceneId } = request.params as {
      projectId: string
      chapterId: string
      proposalId: string
      proposalSceneId: string
    }
    const body = request.body as {
      locale?: unknown
      patch?: Partial<Record<'title' | 'summary' | 'purpose' | 'pov' | 'location' | 'conflict' | 'reveal' | 'plannerNotes', unknown>>
      order?: unknown
      backlogStatus?: 'planned' | 'running' | 'needs_review' | 'drafted' | 'revised'
    }
    const locale = readLocaleBody(body, 'INVALID_LOCALE')
    if (body.patch !== undefined && Object.values(body.patch).some((value) => typeof value !== 'string')) {
      throw badRequest('proposal scene patch values must be strings.', {
        code: 'INVALID_PROPOSAL_SCENE_PATCH',
        detail: { body },
      })
    }
    if (body.order !== undefined && (typeof body.order !== 'number' || Number.isNaN(body.order))) {
      throw badRequest('order must be a number when provided.', {
        code: 'INVALID_ORDER',
        detail: { body },
      })
    }

    return repository.updateChapterBacklogProposalScene(projectId, {
      chapterId,
      proposalId,
      proposalSceneId,
      patch: {
        locale,
        patch: body.patch as Partial<Record<'title' | 'summary' | 'purpose' | 'pov' | 'location' | 'conflict' | 'reveal' | 'plannerNotes', string>> | undefined,
        order: body.order as number | undefined,
        backlogStatus: body.backlogStatus,
      },
    })
  })

  app.post(`${projectBase}/chapters/:chapterId/backlog-proposals/:proposalId/accept`, async (request) => {
    const { projectId, chapterId, proposalId } = request.params as {
      projectId: string
      chapterId: string
      proposalId: string
    }
    const body = request.body as { locale?: unknown }
    readLocaleBody(body, 'INVALID_ACCEPT_LOCALE')
    const record = await repository.acceptChapterBacklogProposal(projectId, { chapterId, proposalId })
    if (record === null) {
      throw notFound(`Backlog proposal ${proposalId} was not found.`, {
        code: 'CHAPTER_BACKLOG_PROPOSAL_NOT_FOUND',
        detail: { projectId, chapterId, proposalId },
      })
    }

    return record
  })

  app.post(`${projectBase}/chapters/:chapterId/run-next-scene`, async (request) => {
    const { projectId, chapterId } = request.params as { projectId: string; chapterId: string }
    const body = request.body as { locale?: unknown; mode?: unknown; note?: unknown } | undefined
    const locale = readLocaleBody(body, 'INVALID_CHAPTER_RUN_LOCALE')
    const mode = body?.mode === undefined
      ? undefined
      : assertEnumValue(body.mode, 'mode', RUN_MODES, {
          code: 'INVALID_CHAPTER_RUN_MODE',
          detail: { body },
          allowedValuesDetailKey: 'allowedModes',
        })
    const note = assertOptionalString(body?.note, 'note', {
      code: 'INVALID_CHAPTER_RUN_NOTE',
      detail: { body },
    })

    const record = await repository.startNextChapterSceneRun(projectId, chapterId, {
      locale,
      mode,
      note,
    })
    if (record === null) {
      throw notFound(`Chapter ${chapterId} was not found.`, {
        code: 'CHAPTER_NOT_FOUND',
        detail: { projectId, chapterId },
      })
    }

    return record
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
