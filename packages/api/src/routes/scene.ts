import { badRequest } from '../http/errors.js'

import type { ApiRouteContext } from './route-context.js'
import { assertEnumValue, assertOptionalString, assertRequiredString } from './validation.js'

const SCENE_PROSE_REVISION_MODES = ['rewrite', 'compress', 'expand', 'tone_adjust', 'continuity_fix'] as const
const MAX_SCENE_PROSE_REVISION_INSTRUCTION_LENGTH = 280

export function registerSceneRoutes({ app, apiBasePath, repository }: ApiRouteContext) {
  const projectBase = `${apiBasePath}/projects/:projectId`

  app.get(`${projectBase}/scenes/:sceneId/workspace`, async (request) => {
    const { projectId, sceneId } = request.params as { projectId: string; sceneId: string }
    return repository.getSceneWorkspace(projectId, sceneId)
  })

  app.get(`${projectBase}/scenes/:sceneId/setup`, async (request) => {
    const { projectId, sceneId } = request.params as { projectId: string; sceneId: string }
    return repository.getSceneSetup(projectId, sceneId)
  })

  app.patch(`${projectBase}/scenes/:sceneId/setup`, async (request, reply) => {
    const { projectId, sceneId } = request.params as { projectId: string; sceneId: string }
    const body = request.body as { sceneId?: string }
    if (body?.sceneId !== sceneId) {
      throw badRequest(`Body sceneId ${body?.sceneId ?? '<missing>'} does not match route sceneId ${sceneId}.`, {
        code: 'SCENE_ID_MISMATCH',
        detail: { sceneId, body },
      })
    }

    await repository.updateSceneSetup(projectId, sceneId, request.body as Parameters<typeof repository.updateSceneSetup>[2])
    return reply.status(204).send()
  })

  app.get(`${projectBase}/scenes/:sceneId/execution`, async (request) => {
    const { projectId, sceneId } = request.params as { projectId: string; sceneId: string }
    return repository.getSceneExecution(projectId, sceneId)
  })

  app.post(`${projectBase}/scenes/:sceneId/execution/continue`, async (request, reply) => {
    const { projectId, sceneId } = request.params as { projectId: string; sceneId: string }
    repository.continueSceneRun(projectId, sceneId)
    return reply.status(204).send()
  })

  app.post(`${projectBase}/scenes/:sceneId/execution/thread`, async (request, reply) => {
    const { projectId, sceneId } = request.params as { projectId: string; sceneId: string }
    const body = request.body as { threadId?: string }
    if (typeof body?.threadId !== 'string' || body.threadId.trim() === '') {
      throw badRequest('threadId is required.', {
        code: 'INVALID_THREAD_ID',
        detail: { body },
      })
    }

    await repository.switchSceneThread(projectId, sceneId, body.threadId)
    return reply.status(204).send()
  })

  app.get(`${projectBase}/scenes/:sceneId/prose`, async (request) => {
    const { projectId, sceneId } = request.params as { projectId: string; sceneId: string }
    return repository.getSceneProse(projectId, sceneId)
  })

  app.post(`${projectBase}/scenes/:sceneId/prose/revision`, async (request, reply) => {
    const { projectId, sceneId } = request.params as { projectId: string; sceneId: string }
    const body = request.body as { revisionMode?: unknown; instruction?: unknown }
    const revisionMode = assertEnumValue(body?.revisionMode, 'revisionMode', SCENE_PROSE_REVISION_MODES, {
      code: 'INVALID_REVISION_MODE',
      detail: { body },
      allowedValuesDetailKey: 'allowedRevisionModes',
    })
    const instruction = assertOptionalString(body?.instruction, 'instruction', {
      code: 'INVALID_REVISION_INSTRUCTION',
      detail: { body },
    })?.trim()
    if (instruction && instruction.length > MAX_SCENE_PROSE_REVISION_INSTRUCTION_LENGTH) {
      throw badRequest(
        `instruction must be at most ${MAX_SCENE_PROSE_REVISION_INSTRUCTION_LENGTH} characters.`,
        {
          code: 'INVALID_REVISION_INSTRUCTION',
          detail: {
            body,
            maxLength: MAX_SCENE_PROSE_REVISION_INSTRUCTION_LENGTH,
          },
        },
      )
    }

    await repository.reviseSceneProse(projectId, sceneId, {
      revisionMode,
      instruction,
    })
    return reply.status(204).send()
  })

  app.post(`${projectBase}/scenes/:sceneId/prose/revision/accept`, async (request, reply) => {
    const { projectId, sceneId } = request.params as { projectId: string; sceneId: string }
    const body = request.body as { revisionId?: unknown }
    const revisionId = assertRequiredString(body?.revisionId, 'revisionId', {
      code: 'INVALID_REVISION_ID',
      detail: { body },
    }).trim()

    await repository.acceptSceneProseRevision(projectId, sceneId, revisionId)
    return reply.status(204).send()
  })

  app.get(`${projectBase}/scenes/:sceneId/inspector`, async (request) => {
    const { projectId, sceneId } = request.params as { projectId: string; sceneId: string }
    return repository.getSceneInspector(projectId, sceneId)
  })

  app.get(`${projectBase}/scenes/:sceneId/dock-summary`, async (request) => {
    const { projectId, sceneId } = request.params as { projectId: string; sceneId: string }
    return repository.getSceneDockSummary(projectId, sceneId)
  })

  app.get(`${projectBase}/scenes/:sceneId/dock-tabs/:tab`, async (request) => {
    const { projectId, sceneId, tab } = request.params as {
      projectId: string
      sceneId: string
      tab: 'events' | 'trace' | 'consistency' | 'problems' | 'cost'
    }
    return repository.getSceneDockTab(projectId, sceneId, tab)
  })

  app.get(`${projectBase}/scenes/:sceneId/patch-preview`, async (request) => {
    const { projectId, sceneId } = request.params as { projectId: string; sceneId: string }
    return repository.getScenePatchPreview(projectId, sceneId)
  })

  app.post(`${projectBase}/scenes/:sceneId/patch-commit`, async (request, reply) => {
    const { projectId, sceneId } = request.params as { projectId: string; sceneId: string }
    const body = request.body as { patchId?: string }
    if (typeof body?.patchId !== 'string' || body.patchId.trim() === '') {
      throw badRequest('patchId is required.', {
        code: 'INVALID_PATCH_ID',
        detail: { body },
      })
    }

    repository.commitScenePatch(projectId, sceneId, body.patchId)
    return reply.status(204).send()
  })

  app.post(`${projectBase}/scenes/:sceneId/proposals/accept`, async (request, reply) => {
    const { projectId, sceneId } = request.params as { projectId: string; sceneId: string }
    repository.applySceneProposalAction(projectId, sceneId, 'accept', request.body as { proposalId: string })
    return reply.status(204).send()
  })

  app.post(`${projectBase}/scenes/:sceneId/proposals/edit-accept`, async (request, reply) => {
    const { projectId, sceneId } = request.params as { projectId: string; sceneId: string }
    repository.applySceneProposalAction(projectId, sceneId, 'edit-accept', request.body as { proposalId: string })
    return reply.status(204).send()
  })

  app.post(`${projectBase}/scenes/:sceneId/proposals/request-rewrite`, async (request, reply) => {
    const { projectId, sceneId } = request.params as { projectId: string; sceneId: string }
    repository.applySceneProposalAction(projectId, sceneId, 'request-rewrite', request.body as { proposalId: string })
    return reply.status(204).send()
  })

  app.post(`${projectBase}/scenes/:sceneId/proposals/reject`, async (request, reply) => {
    const { projectId, sceneId } = request.params as { projectId: string; sceneId: string }
    repository.applySceneProposalAction(projectId, sceneId, 'reject', request.body as { proposalId: string })
    return reply.status(204).send()
  })
}
