import type { AssetKnowledgeWorkspaceRecord } from './asset-records'
import { getMockAssetKnowledgeWorkspace } from './mock-asset-db'

export interface GetAssetKnowledgeWorkspaceInput {
  assetId: string
  locale?: 'en' | 'zh-CN'
}

export interface AssetClient {
  getAssetKnowledgeWorkspace(input: GetAssetKnowledgeWorkspaceInput): Promise<AssetKnowledgeWorkspaceRecord | null>
}

interface CreateAssetClientOptions {
  getAssetKnowledgeWorkspace?: (assetId: string) => AssetKnowledgeWorkspaceRecord | null
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

export function createAssetClient({
  getAssetKnowledgeWorkspace = getMockAssetKnowledgeWorkspace,
}: CreateAssetClientOptions = {}): AssetClient {
  return {
    async getAssetKnowledgeWorkspace({ assetId }) {
      const workspace = getAssetKnowledgeWorkspace(assetId)
      return workspace ? clone(workspace) : null
    },
  }
}

export const assetClient = createAssetClient()
