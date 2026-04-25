import type { PropsWithChildren } from 'react'
import { useEffect } from 'react'

import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'

import { I18nProvider, useI18n } from './i18n'
import { ProjectRuntimeProvider } from './project-runtime'
import type { ProjectRuntime } from './project-runtime'
import { useRuntimeConfig } from './runtime'
import { bookQueryKeys } from '@/features/book/hooks/book-query-keys'
import { chapterQueryKeys } from '@/features/chapter/hooks/chapter-query-keys'
import { sceneQueryKeys } from '@/features/scene/hooks/scene-query-keys'

const defaultQueryClient = new QueryClient({
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
    void queryClient.invalidateQueries({ queryKey: bookQueryKeys.all })
    void queryClient.invalidateQueries({ queryKey: sceneQueryKeys.all })
    void queryClient.invalidateQueries({ queryKey: chapterQueryKeys.all })
  }, [locale, queryClient])

  return null
}

interface AppProvidersProps {
  runtime?: ProjectRuntime
  queryClient?: QueryClient
}

export function AppProviders({
  children,
  runtime,
  queryClient = defaultQueryClient,
}: PropsWithChildren<AppProvidersProps>) {
  const runtimeConfigState = useRuntimeConfig()

  if (!runtime && runtimeConfigState.status !== 'ready') {
    return null
  }

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ProjectRuntimeProvider
          runtime={runtime}
          runtimeConfig={runtimeConfigState.status === 'ready' ? runtimeConfigState.runtimeConfig : undefined}
        >
          <LocaleQuerySync />
          {children}
        </ProjectRuntimeProvider>
      </I18nProvider>
    </QueryClientProvider>
  )
}
