export const chapterQueryKeys = {
  all: ['chapter'] as const,
  workspace: (chapterId: string) => [...chapterQueryKeys.all, 'workspace', chapterId] as const,
}
