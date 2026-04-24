import { notFound } from '../http/errors.js'

import type { ApiRouteContext } from './route-context.js'

function requireRun(
  repository: ApiRouteContext['repository'],
  projectId: string,
  runId: string,
) {
  const run = repository.getRun(projectId, runId)
  if (!run) {
    throw notFound(`Run ${runId} was not found.`, {
      code: 'RUN_NOT_FOUND',
      detail: { projectId, runId },
    })
  }

  return run
}

export function registerRunArtifactRoutes({ app, apiBasePath, repository }: ApiRouteContext) {
  const projectBase = `${apiBasePath}/projects/:projectId`

  app.get(`${projectBase}/runs/:runId/artifacts`, async (request) => {
    const { projectId, runId } = request.params as { projectId: string; runId: string }
    requireRun(repository, projectId, runId)

    const artifacts = repository.listRunArtifacts(projectId, runId)
    if (!artifacts) {
      throw notFound(`Run artifacts for ${runId} were not found.`, {
        code: 'RUN_ARTIFACTS_NOT_FOUND',
        detail: { projectId, runId },
      })
    }

    return {
      runId,
      artifacts,
    }
  })

  app.get(`${projectBase}/runs/:runId/trace`, async (request) => {
    const { projectId, runId } = request.params as { projectId: string; runId: string }
    requireRun(repository, projectId, runId)

    const trace = repository.getRunTrace(projectId, runId)
    if (!trace) {
      throw notFound(`Run trace for ${runId} was not found.`, {
        code: 'RUN_TRACE_NOT_FOUND',
        detail: { projectId, runId },
      })
    }

    return trace
  })

  app.get(`${projectBase}/runs/:runId/artifacts/:artifactId`, async (request) => {
    const { projectId, runId, artifactId } = request.params as {
      projectId: string
      runId: string
      artifactId: string
    }
    requireRun(repository, projectId, runId)

    const artifact = repository.getRunArtifact(projectId, runId, artifactId)
    if (!artifact) {
      throw notFound(`Run artifact ${artifactId} was not found.`, {
        code: 'RUN_ARTIFACT_NOT_FOUND',
        detail: { projectId, runId, artifactId },
      })
    }

    return { artifact }
  })
}
