import type { Locale } from '@/app/i18n'

export const bookQueryKeys = {
  all: ['book'] as const,
  checkpointRecords: (bookId: string) => [...bookQueryKeys.all, 'checkpoints', bookId] as const,
  draftAssembly: (bookId: string, locale?: Locale) =>
    locale
      ? ([...bookQueryKeys.all, 'draftAssembly', bookId, locale] as const)
      : ([...bookQueryKeys.all, 'draftAssembly', bookId] as const),
  workspace: (bookId: string, locale?: Locale) =>
    locale ? ([...bookQueryKeys.all, 'workspace', bookId, locale] as const) : ([...bookQueryKeys.all, 'workspace', bookId] as const),
  checkpoints: (bookId: string, locale?: Locale) =>
    locale
      ? ([...bookQueryKeys.checkpointRecords(bookId), locale] as const)
      : bookQueryKeys.checkpointRecords(bookId),
  checkpoint: (bookId: string, checkpointId: string, locale?: Locale) =>
    locale
      ? ([...bookQueryKeys.all, 'checkpoint', bookId, checkpointId, locale] as const)
      : ([...bookQueryKeys.all, 'checkpoint', bookId, checkpointId] as const),
  branchRecords: (bookId: string) => [...bookQueryKeys.all, 'branches', bookId] as const,
  selectedBranchRecord: (bookId: string, branchId: string) => [...bookQueryKeys.all, 'branch', bookId, branchId] as const,
  branches: (bookId: string, locale?: Locale) =>
    locale
      ? ([...bookQueryKeys.branchRecords(bookId), locale] as const)
      : bookQueryKeys.branchRecords(bookId),
  branch: (bookId: string, branchId: string, locale?: Locale) =>
    locale
      ? ([...bookQueryKeys.selectedBranchRecord(bookId, branchId), locale] as const)
      : bookQueryKeys.selectedBranchRecord(bookId, branchId),
  exportProfiles: (bookId: string, locale?: Locale) =>
    locale
      ? ([...bookQueryKeys.all, 'exportProfiles', bookId, locale] as const)
      : ([...bookQueryKeys.all, 'exportProfiles', bookId] as const),
  exportProfile: (bookId: string, exportProfileId: string, locale?: Locale) =>
    locale
      ? ([...bookQueryKeys.all, 'exportProfile', bookId, exportProfileId, locale] as const)
      : ([...bookQueryKeys.all, 'exportProfile', bookId, exportProfileId] as const),
  exportArtifacts: (bookId: string, exportProfileId?: string | null, checkpointId?: string | null) =>
    [...bookQueryKeys.all, 'exportArtifacts', bookId, exportProfileId ?? 'all', checkpointId ?? 'current'] as const,
}
