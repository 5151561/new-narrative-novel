export const chapterQueryKeys = {
  all: ['chapter'] as const,
  draftAssembly: (chapterId: string, locale: 'en' | 'zh-CN') => [...chapterQueryKeys.all, 'draft-assembly', chapterId, locale] as const,
  workspace: (chapterId: string) => [...chapterQueryKeys.all, 'workspace', chapterId] as const,
}
