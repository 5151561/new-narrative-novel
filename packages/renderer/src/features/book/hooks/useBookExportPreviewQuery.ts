import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'

import { useI18n } from '@/app/i18n'

import { DEFAULT_BOOK_EXPORT_PROFILE_ID } from '../api/book-export-profiles'
import { bookClient, type BookClient } from '../api/book-client'
import {
  buildBookExportPreviewWorkspace,
  normalizeBookExportProfile,
} from '../lib/book-export-preview-mappers'
import type { BookManuscriptCompareWorkspaceViewModel } from '../types/book-compare-view-models'
import type { BookDraftWorkspaceViewModel } from '../types/book-draft-view-models'
import type {
  BookExportPreviewWorkspaceViewModel,
  BookExportProfileSummaryViewModel,
  BookExportProfileViewModel,
} from '../types/book-export-view-models'
import { bookQueryKeys } from './book-query-keys'

interface UseBookExportPreviewQueryInput {
  bookId: string
  currentDraftWorkspace: BookDraftWorkspaceViewModel | null | undefined
  compareWorkspace: BookManuscriptCompareWorkspaceViewModel | null | undefined
  exportProfileId?: string | null
  enabled?: boolean
}

interface UseBookExportPreviewQueryDeps {
  bookClient?: Pick<BookClient, 'getBookExportProfiles' | 'getBookExportProfile'>
}

export interface UseBookExportPreviewQueryResult {
  exportWorkspace: BookExportPreviewWorkspaceViewModel | null | undefined
  exportProfiles: BookExportProfileSummaryViewModel[] | undefined
  selectedExportProfile: BookExportProfileViewModel | null | undefined
  isLoading: boolean
  error: Error | null
}

export function useBookExportPreviewQuery(
  { bookId, currentDraftWorkspace, compareWorkspace, exportProfileId, enabled = true }: UseBookExportPreviewQueryInput,
  { bookClient: customBookClient = bookClient }: UseBookExportPreviewQueryDeps = {},
): UseBookExportPreviewQueryResult {
  const { locale } = useI18n()
  const effectiveExportProfileId = exportProfileId ?? DEFAULT_BOOK_EXPORT_PROFILE_ID

  const exportProfilesQuery = useQuery({
    queryKey: bookQueryKeys.exportProfiles(bookId, locale),
    queryFn: () => customBookClient.getBookExportProfiles({ bookId }),
    enabled,
  })

  const selectedExportProfileQuery = useQuery({
    queryKey: bookQueryKeys.exportProfile(bookId, effectiveExportProfileId, locale),
    queryFn: () => customBookClient.getBookExportProfile({ bookId, exportProfileId: effectiveExportProfileId }),
    enabled,
  })

  const exportProfiles = useMemo(
    () =>
      exportProfilesQuery.data?.map((record) => normalizeBookExportProfile(record, locale) satisfies BookExportProfileSummaryViewModel),
    [exportProfilesQuery.data, locale],
  )

  const selectedExportProfile = useMemo(
    () =>
      selectedExportProfileQuery.data === undefined
        ? undefined
        : selectedExportProfileQuery.data === null
          ? null
          : normalizeBookExportProfile(selectedExportProfileQuery.data, locale),
    [locale, selectedExportProfileQuery.data],
  )

  const exportWorkspace = useMemo(() => {
    if (!enabled) {
      return undefined
    }

    if (currentDraftWorkspace === undefined || compareWorkspace === undefined || selectedExportProfile === undefined) {
      return undefined
    }

    if (currentDraftWorkspace === null || selectedExportProfile === null) {
      return null
    }

    return buildBookExportPreviewWorkspace({
      currentDraftWorkspace,
      compareWorkspace,
      profile: selectedExportProfile,
      locale,
    })
  }, [compareWorkspace, currentDraftWorkspace, locale, selectedExportProfile])

  const missingProfileError =
    enabled && !selectedExportProfileQuery.isLoading && selectedExportProfileQuery.data === null
      ? new Error(`Book export profile "${effectiveExportProfileId}" could not be found for "${bookId}".`)
      : null

  const error =
    !enabled
      ? null
      : (exportProfilesQuery.error instanceof Error ? exportProfilesQuery.error : null) ??
        (selectedExportProfileQuery.error instanceof Error ? selectedExportProfileQuery.error : null) ??
        missingProfileError

  return {
    exportWorkspace: enabled ? exportWorkspace : undefined,
    exportProfiles: enabled ? exportProfiles : undefined,
    selectedExportProfile: enabled ? selectedExportProfile : undefined,
    isLoading:
      enabled &&
      (currentDraftWorkspace === undefined || compareWorkspace === undefined || exportProfilesQuery.isLoading || selectedExportProfileQuery.isLoading),
    error,
  }
}
