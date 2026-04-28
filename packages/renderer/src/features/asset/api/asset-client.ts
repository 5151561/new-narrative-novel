import type {
  AssetContextVisibilityRecord,
  AssetKnowledgeWorkspaceRecord,
  AssetNavigatorGroupsRecord,
} from './asset-records'
import { getMockAssetKnowledgeWorkspace } from './mock-asset-db'
import { listMockAssetNavigatorGroups } from './mock-asset-db'

export interface GetAssetKnowledgeWorkspaceInput {
  assetId: string
  locale?: 'en' | 'zh-CN'
  visibility?: AssetContextVisibilityRecord
}

export interface AssetClient {
  getAssetKnowledgeWorkspace(input: GetAssetKnowledgeWorkspaceInput): Promise<AssetKnowledgeWorkspaceRecord | null>
  getAssetNavigatorGroups(): Promise<AssetNavigatorGroupsRecord>
}

interface CreateAssetClientOptions {
  getAssetKnowledgeWorkspace?: (
    assetId: string,
    options?: { visibility?: AssetContextVisibilityRecord },
  ) => AssetKnowledgeWorkspaceRecord | null
  getAssetNavigatorGroups?: () => AssetNavigatorGroupsRecord
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

export function createAssetClient({
  getAssetKnowledgeWorkspace = getMockAssetKnowledgeWorkspace,
  getAssetNavigatorGroups = listMockAssetNavigatorGroups,
}: CreateAssetClientOptions = {}): AssetClient {
  return {
    async getAssetKnowledgeWorkspace({ assetId, visibility }) {
      const workspace = getAssetKnowledgeWorkspace(assetId, { visibility })
      return workspace ? clone(workspace) : null
    },
    async getAssetNavigatorGroups() {
      return clone(getAssetNavigatorGroups())
    },
  }
}

export const assetClient = createAssetClient()
