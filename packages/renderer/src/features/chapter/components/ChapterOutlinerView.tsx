import { useEffect, useState } from 'react'

import {
  getChapterBeatLineLabel,
  getChapterUnresolvedCountLabel,
  useI18n,
} from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'

import type { ChapterSceneStructurePatch } from '../api/chapter-record-mutations'
import type { ChapterStructureWorkspaceViewModel } from '../types/chapter-view-models'

const editableSceneFields = ['summary', 'purpose', 'pov', 'location', 'conflict', 'reveal'] as const

type EditableSceneField = (typeof editableSceneFields)[number]
type ChapterSceneDraft = Record<EditableSceneField, string>
type ChapterSceneViewModel = ChapterStructureWorkspaceViewModel['scenes'][number]

interface ChapterOutlinerViewProps {
  workspace: ChapterStructureWorkspaceViewModel
  onSelectScene?: (sceneId: string) => void
  onSaveScenePatch?: (sceneId: string, patch: ChapterSceneStructurePatch) => Promise<void> | void
  savingSceneId?: string | null
  onOpenScene?: (sceneId: string, lens: 'orchestrate' | 'draft') => void
}

interface OutlinerFieldProps {
  label: string
  value: string
}

function OutlinerField({ label, value }: OutlinerFieldProps) {
  return (
    <span className="block min-w-0">
      <span className="block text-[11px] uppercase tracking-[0.08em] text-text-soft">{label}</span>
      <span className="mt-1 block break-words text-sm leading-5 text-text-muted">{value}</span>
    </span>
  )
}

function buildSceneDraft(scene: ChapterSceneViewModel): ChapterSceneDraft {
  return {
    summary: scene.summary,
    purpose: scene.purpose,
    pov: scene.pov,
    location: scene.location,
    conflict: scene.conflict,
    reveal: scene.reveal,
  }
}

function trimSceneDraft(draft: ChapterSceneDraft): ChapterSceneDraft {
  return editableSceneFields.reduce<ChapterSceneDraft>((result, field) => {
    result[field] = draft[field].trim()
    return result
  }, {} as ChapterSceneDraft)
}

function buildScenePatch(scene: ChapterSceneViewModel, nextDraft: ChapterSceneDraft): ChapterSceneStructurePatch {
  return editableSceneFields.reduce<ChapterSceneStructurePatch>((patch, field) => {
    if (nextDraft[field] !== scene[field]) {
      patch[field] = nextDraft[field]
    }
    return patch
  }, {})
}

export function ChapterOutlinerView({
  workspace,
  onSelectScene,
  onSaveScenePatch,
  savingSceneId = null,
  onOpenScene,
}: ChapterOutlinerViewProps) {
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null)
  const [draft, setDraft] = useState<ChapterSceneDraft | null>(null)
  const { locale, dictionary } = useI18n()
  const selectedScene = workspace.scenes.find((scene) => scene.id === workspace.selectedSceneId) ?? null

  useEffect(() => {
    setEditingSceneId(null)
    setDraft(null)
  }, [locale, workspace.chapterId, selectedScene?.id])

  return (
    <div className="overflow-hidden rounded-md border border-line-soft bg-surface-2">
      <ul className="divide-y divide-line-soft">
        {workspace.scenes.map((scene) => {
          const active = scene.id === workspace.selectedSceneId
          const showOpenActions = onOpenScene !== undefined
          const showEditAction = active && onSaveScenePatch !== undefined
          const isEditing = editingSceneId === scene.id
          const currentDraft = isEditing && draft ? draft : buildSceneDraft(scene)
          const trimmedDraft = trimSceneDraft(currentDraft)
          const patch = buildScenePatch(scene, trimmedDraft)
          const isValid = editableSceneFields.every((field) => trimmedDraft[field].length > 0)
          const isSaving = savingSceneId === scene.id

          return (
            <li key={scene.id}>
              <div
                className={`border-l-2 px-3 py-3 transition-colors ${
                  active
                    ? 'border-l-accent bg-surface-1 shadow-ringwarm'
                    : 'border-l-transparent bg-surface-2 hover:bg-surface-1'
                }`}
              >
                <button
                  type="button"
                  aria-current={active ? 'true' : undefined}
                  onClick={() => onSelectScene?.(scene.id)}
                  className="w-full rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                >
                  <span className="grid gap-3 lg:grid-cols-[88px_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.75fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)]">
                    <span className="block min-w-0">
                      <span className="block text-[11px] uppercase tracking-[0.08em] text-text-soft">
                        {getChapterBeatLineLabel(locale, scene.order)}
                      </span>
                      <span className="mt-1 block break-words text-sm font-medium text-text-main">{scene.title}</span>
                    </span>
                    <OutlinerField label={dictionary.app.chapterScaffold.purpose} value={scene.purpose} />
                    <OutlinerField label={dictionary.app.chapterScaffold.pov} value={scene.pov} />
                    <OutlinerField label={dictionary.app.chapterScaffold.location} value={scene.location} />
                    <OutlinerField label={dictionary.app.chapterScaffold.conflict} value={scene.conflict} />
                    <OutlinerField label={dictionary.app.chapterScaffold.reveal} value={scene.reveal} />
                    <span className="block min-w-0">
                      <span className="block text-[11px] uppercase tracking-[0.08em] text-text-soft">
                        {dictionary.app.chapterScaffold.statusSnapshot}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-2">
                        <Badge tone={active ? 'accent' : 'neutral'}>{scene.statusLabel}</Badge>
                        <Badge tone="neutral">{scene.proseStatusLabel}</Badge>
                        <Badge tone="neutral">{scene.runStatusLabel}</Badge>
                        <Badge tone={scene.unresolvedCount > 0 ? 'warn' : 'success'}>
                          {getChapterUnresolvedCountLabel(locale, scene.unresolvedCount)}
                        </Badge>
                        <Badge tone="neutral">{scene.lastRunLabel}</Badge>
                      </span>
                    </span>
                  </span>
                </button>
                {showOpenActions || showEditAction ? (
                  <div className="mt-2 flex flex-wrap justify-end gap-1.5">
                    {showEditAction ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          if (isEditing) {
                            setEditingSceneId(null)
                            setDraft(null)
                            return
                          }
                          setEditingSceneId(scene.id)
                          setDraft(buildSceneDraft(scene))
                        }}
                        className="rounded-md px-2 py-1 text-[11px] font-medium text-text-muted hover:bg-surface-1 hover:text-text-main"
                      >
                        {dictionary.app.chapterScaffold.editStructure}
                      </button>
                    ) : null}
                    {showOpenActions ? (
                      <>
                        <button
                          type="button"
                          aria-label={`${dictionary.app.chapterScaffold.openInOrchestrate}: ${scene.title}`}
                          onClick={(event) => {
                            event.stopPropagation()
                            onOpenScene?.(scene.id, 'orchestrate')
                          }}
                          className="rounded-md px-2 py-1 text-[11px] font-medium text-text-muted hover:bg-surface-1 hover:text-text-main"
                        >
                          {dictionary.app.chapterScaffold.openInOrchestrate}
                        </button>
                        <button
                          type="button"
                          aria-label={`${dictionary.app.chapterScaffold.openInDraft}: ${scene.title}`}
                          onClick={(event) => {
                            event.stopPropagation()
                            onOpenScene?.(scene.id, 'draft')
                          }}
                          className="rounded-md px-2 py-1 text-[11px] font-medium text-text-muted hover:bg-surface-1 hover:text-text-main"
                        >
                          {dictionary.app.chapterScaffold.openInDraft}
                        </button>
                      </>
                    ) : null}
                  </div>
                ) : null}
                {isEditing ? (
                  <form
                    aria-label={`${dictionary.app.chapterScaffold.editStructure}: ${scene.title}`}
                    className="mt-3 space-y-3 rounded-md border border-line-soft bg-surface-2 px-3 py-3"
                    onSubmit={async (event) => {
                      event.preventDefault()

                      if (!isValid || isSaving) {
                        return
                      }

                      if (Object.keys(patch).length === 0) {
                        setEditingSceneId(null)
                        setDraft(null)
                        return
                      }

                      try {
                        await onSaveScenePatch?.(scene.id, patch)
                        setEditingSceneId(null)
                        setDraft(null)
                      } catch {
                        // Preserve the current draft so the user can retry after a failed save.
                      }
                    }}
                  >
                    <div className="grid gap-3 lg:grid-cols-2">
                      {editableSceneFields.map((field) => (
                        <label key={field} className="space-y-2 text-xs uppercase tracking-[0.05em] text-text-soft">
                          <span>{dictionary.app.chapterScaffold[field]}</span>
                          <textarea
                            value={currentDraft[field]}
                            rows={field === 'pov' || field === 'location' ? 2 : 3}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...(current ?? buildSceneDraft(scene)),
                                [field]: event.target.value,
                              }))
                            }
                            aria-invalid={trimmedDraft[field].length === 0}
                            className="w-full rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm leading-6 normal-case text-text-main focus:border-line-strong focus:ring-0"
                          />
                        </label>
                      ))}
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="submit"
                        disabled={!isValid || isSaving}
                        className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {dictionary.app.chapterScaffold.save}
                      </button>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => {
                          setEditingSceneId(null)
                          setDraft(null)
                        }}
                        className="rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-muted disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {dictionary.app.chapterScaffold.cancel}
                      </button>
                    </div>
                  </form>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
