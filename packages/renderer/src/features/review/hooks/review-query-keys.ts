export const reviewQueryKeys = {
  all: ['review'] as const,
  decisions: (bookId: string) => [...reviewQueryKeys.all, 'decisions', bookId] as const,
}
