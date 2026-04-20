import type { PropsWithChildren } from 'react'
import { useEffect } from 'react'

import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'

import { I18nProvider, useI18n } from './i18n'
import { ProjectRuntimeProvider } from './project-runtime'
import { chapterQueryKeys } from '@/features/chapter/hooks/chapter-query-keys'
import { sceneQueryKeys } from '@/features/scene/hooks/scene-query-keys'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})

function LocaleQuerySync() {
  const { locale } = useI18n()
  const queryClient = useQueryClient()

  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: sceneQueryKeys.all })
    void queryClient.invalidateQueries({ queryKey: chapterQueryKeys.all })
  }, [locale, queryClient])

  return null
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ProjectRuntimeProvider>
          <LocaleQuerySync />
          {children}
        </ProjectRuntimeProvider>
      </I18nProvider>
    </QueryClientProvider>
  )
}
