export const assetQueryKeys = {
  all: ['asset'] as const,
  workspace: (assetId: string, locale: 'en' | 'zh-CN') => [...assetQueryKeys.all, 'workspace', assetId, locale] as const,
}
