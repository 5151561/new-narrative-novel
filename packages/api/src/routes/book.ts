import { badRequest } from '../http/errors.js'

import type { ApiRouteContext } from './route-context.js'

export function registerBookRoutes({ app, apiBasePath, repository }: ApiRouteContext) {
  const projectBase = `${apiBasePath}/projects/:projectId`
  const adoptionKinds = new Set(['canon_patch', 'prose_draft'])

  function assertRouteBookId(routeBookId: string, bodyBookId: string) {
    if (bodyBookId !== routeBookId) {
      throw badRequest(`Body bookId ${bodyBookId} does not match route bookId ${routeBookId}.`, {
        code: 'BOOK_ID_MISMATCH',
        detail: { bookId: routeBookId, bodyBookId },
      })
    }
  }

  function assertAdoptionKind(kind: string): asserts kind is 'canon_patch' | 'prose_draft' {
    if (!adoptionKinds.has(kind)) {
      throw badRequest(`Adoption kind ${kind} is invalid.`, {
        code: 'BOOK_EXPERIMENT_BRANCH_ADOPTION_KIND_INVALID',
        detail: {
          kind,
          allowedKinds: [...adoptionKinds],
        },
      })
    }
  }

  app.get(`${projectBase}/books/:bookId/structure`, async (request) => {
    const { projectId, bookId } = request.params as { projectId: string; bookId: string }
    return repository.getBookStructure(projectId, bookId)
  })

  app.get(`${projectBase}/books/:bookId/draft-assembly`, async (request) => {
    const { projectId, bookId } = request.params as { projectId: string; bookId: string }
    return repository.getBookDraftAssembly(projectId, bookId)
  })

  app.get(`${projectBase}/books/:bookId/manuscript-checkpoints`, async (request) => {
    const { projectId, bookId } = request.params as { projectId: string; bookId: string }
    return repository.getBookManuscriptCheckpoints(projectId, bookId)
  })

  app.get(`${projectBase}/books/:bookId/manuscript-checkpoints/:checkpointId`, async (request) => {
    const { projectId, bookId, checkpointId } = request.params as {
      projectId: string
      bookId: string
      checkpointId: string
    }
    return repository.getBookManuscriptCheckpoint(projectId, bookId, checkpointId)
  })

  app.post(`${projectBase}/books/:bookId/manuscript-checkpoints`, async (request) => {
    const { projectId, bookId } = request.params as { projectId: string; bookId: string }
    const body = request.body as {
      bookId: string
      title: string
      summary: string
      sourceSignature: string
      selectedChapterId: string
    }

    assertRouteBookId(bookId, body.bookId)
    return repository.createBookManuscriptCheckpoint(projectId, body)
  })

  app.get(`${projectBase}/books/:bookId/export-profiles`, async (request) => {
    const { projectId, bookId } = request.params as { projectId: string; bookId: string }
    return repository.getBookExportProfiles(projectId, bookId)
  })

  app.get(`${projectBase}/books/:bookId/export-profiles/:exportProfileId`, async (request) => {
    const { projectId, bookId, exportProfileId } = request.params as {
      projectId: string
      bookId: string
      exportProfileId: string
    }
    return repository.getBookExportProfile(projectId, bookId, exportProfileId)
  })

  app.get(`${projectBase}/books/:bookId/export-artifacts`, async (request) => {
    const { projectId, bookId } = request.params as { projectId: string; bookId: string }
    const { exportProfileId, checkpointId } = request.query as {
      exportProfileId?: string
      checkpointId?: string
    }
    return repository.getBookExportArtifacts(projectId, {
      bookId,
      exportProfileId,
      checkpointId,
    })
  })

  app.post(`${projectBase}/books/:bookId/export-artifacts`, async (request) => {
    const { projectId, bookId } = request.params as { projectId: string; bookId: string }
    const body = request.body as {
      bookId: string
      exportProfileId: string
      checkpointId?: string
      format: 'markdown' | 'plain_text'
      filename: string
      mimeType: string
      title: string
      summary: string
      content: string
      sourceSignature: string
      chapterCount: number
      sceneCount: number
      wordCount: number
      readinessSnapshot: {
        status: 'ready' | 'attention' | 'blocked'
        blockerCount: number
        warningCount: number
        infoCount: number
      }
      reviewGateSnapshot: {
        openBlockerCount: number
        checkedFixCount: number
        blockedFixCount: number
        staleFixCount: number
      }
    }

    if (body.bookId !== bookId) {
      throw badRequest(`Body bookId ${body.bookId} does not match route bookId ${bookId}.`, {
        code: 'BOOK_ID_MISMATCH',
        detail: { bookId, bodyBookId: body.bookId },
      })
    }

    return repository.createBookExportArtifact(projectId, body)
  })

  app.get(`${projectBase}/books/:bookId/experiment-branches`, async (request) => {
    const { projectId, bookId } = request.params as { projectId: string; bookId: string }
    return repository.getBookExperimentBranches(projectId, bookId)
  })

  app.get(`${projectBase}/books/:bookId/experiment-branches/:branchId`, async (request) => {
    const { projectId, bookId, branchId } = request.params as {
      projectId: string
      bookId: string
      branchId: string
    }
    return repository.getBookExperimentBranch(projectId, bookId, branchId)
  })

  app.post(`${projectBase}/books/:bookId/experiment-branches`, async (request) => {
    const { projectId, bookId } = request.params as { projectId: string; bookId: string }
    const body = request.body as {
      bookId: string
      title: string
      summary: string
      rationale: string
      basedOnCheckpointId?: string
      selectedChapterId: string
    }

    assertRouteBookId(bookId, body.bookId)
    return repository.createBookExperimentBranch(projectId, body)
  })

  app.post(`${projectBase}/books/:bookId/experiment-branches/:branchId/archive`, async (request) => {
    const { projectId, bookId, branchId } = request.params as {
      projectId: string
      bookId: string
      branchId: string
    }
    const body = request.body as {
      bookId: string
      branchId: string
      archiveNote: string
    }

    assertRouteBookId(bookId, body.bookId)
    return repository.archiveBookExperimentBranch(projectId, {
      ...body,
      branchId,
    })
  })

  app.post(`${projectBase}/books/:bookId/experiment-branches/:branchId/adoptions`, async (request) => {
    const { projectId, bookId, branchId } = request.params as {
      projectId: string
      bookId: string
      branchId: string
    }
    const body = request.body as {
      bookId: string
      branchId: string
      chapterId: string
      sceneId: string
      kind: 'canon_patch' | 'prose_draft'
      summary: string
      sourceSignature: string
    }

    assertRouteBookId(bookId, body.bookId)
    assertAdoptionKind(body.kind)
    return repository.adoptBookExperimentBranch(projectId, {
      ...body,
      branchId,
    })
  })
}
