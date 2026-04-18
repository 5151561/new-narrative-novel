import { Badge } from '@/components/ui/Badge'

import { useI18n } from '@/app/i18n'

import type { BookExportProfileSummaryViewModel } from '../types/book-export-view-models'

interface BookExportProfilePickerProps {
  profiles: BookExportProfileSummaryViewModel[]
  selectedExportProfileId: string
  onSelectExportProfile: (exportProfileId: string) => void
}

function getKindLabel(locale: 'en' | 'zh-CN', kind: BookExportProfileSummaryViewModel['kind']) {
  if (locale === 'zh-CN') {
    return kind === 'review_packet' ? '审阅包' : kind === 'submission_preview' ? '投稿预览' : '归档快照'
  }

  return kind === 'review_packet' ? 'Review packet' : kind === 'submission_preview' ? 'Submission preview' : 'Archive snapshot'
}

export function BookExportProfilePicker({
  profiles,
  selectedExportProfileId,
  onSelectExportProfile,
}: BookExportProfilePickerProps) {
  const { locale } = useI18n()

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-base text-text-main">{locale === 'zh-CN' ? '导出配置' : 'Export profile'}</h4>
          <p className="mt-1 text-sm leading-6 text-text-muted">
            {locale === 'zh-CN' ? '保持导出预览与 route.exportProfileId 对齐。' : 'Keep export preview aligned with route.exportProfileId.'}
          </p>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {profiles.map((profile) => {
          const active = profile.exportProfileId === selectedExportProfileId

          return (
            <button
              key={profile.exportProfileId}
              type="button"
              aria-pressed={active}
              onClick={() => onSelectExportProfile(profile.exportProfileId)}
              className={`rounded-md border px-4 py-4 text-left ${
                active ? 'border-line-strong bg-surface-1 shadow-sm' : 'border-line-soft bg-surface-2'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-main">{profile.title}</p>
                  <p className="mt-1 text-sm leading-6 text-text-muted">{profile.summary}</p>
                </div>
                <Badge tone={active ? 'accent' : 'neutral'}>{getKindLabel(locale, profile.kind)}</Badge>
              </div>
              <p className="mt-3 text-xs uppercase tracking-[0.05em] text-text-soft">{profile.createdAtLabel}</p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
