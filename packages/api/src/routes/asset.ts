import type { ApiRouteContext } from './route-context.js'

export function registerAssetRoutes({ app, apiBasePath, repository }: ApiRouteContext) {
  const projectBase = `${apiBasePath}/projects/:projectId`

  app.get(`${projectBase}/assets`, async (request) => {
    const { projectId } = request.params as { projectId: string }
    return repository.listAssets(projectId)
  })

  app.get(`${projectBase}/assets/:assetId/knowledge`, async (request) => {
    const { projectId, assetId } = request.params as { projectId: string; assetId: string }
    const { visibility } = request.query as { visibility?: 'public' | 'character-known' | 'private' | 'spoiler' | 'editor-only' }
    return repository.getAssetKnowledge(projectId, assetId, { visibility })
  })
}
