import { getChapterUnresolvedCountLabel, useI18n } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'

import type {
  ChapterStructureSceneViewModel,
  ChapterStructureWorkspaceViewModel,
} from '../types/chapter-view-models'

interface ChapterAssemblyViewProps {
  workspace: ChapterStructureWorkspaceViewModel
  onSelectScene?: (sceneId: string) => void
  onOpenScene?: (sceneId: string, lens: 'orchestrate' | 'draft') => void
}

interface SceneTransitionCardProps {
  heading: string
  scene: ChapterStructureSceneViewModel | null
  emptyLabel: string
  emphasized?: boolean
  onSelectScene?: (sceneId: string) => void
}

function SceneTransitionCard({
  heading,
  scene,
  emptyLabel,
  emphasized = false,
  onSelectScene,
}: SceneTransitionCardProps) {
  return (
    <section className={`rounded-md border p-4 ${emphasized ? 'border-line-strong bg-surface-1 shadow-ringwarm' : 'border-line-soft bg-surface-2'}`}>
      <h4 className="text-base text-text-main">{heading}</h4>
      {scene ? (
        <button
          type="button"
          aria-current={emphasized ? 'true' : undefined}
          onClick={() => onSelectScene?.(scene.id)}
          className={`mt-3 w-full rounded-md border px-3 py-3 text-left transition-colors focus:outline-none focus-visible:border-line-strong focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent active:bg-surface-2 ${
            emphasized
              ? 'border-line-strong bg-surface-2'
              : 'border-line-soft bg-surface-1 hover:bg-surface-2 focus-visible:bg-surface-2'
          }`}
        >
          <span className="block text-sm font-medium text-text-main">{scene.title}</span>
          <span className="mt-2 block text-sm leading-6 text-text-muted">{scene.summary}</span>
        </button>
      ) : (
        <div className="mt-3 rounded-md border border-dashed border-line-soft bg-surface-1 px-3 py-4 text-sm leading-6 text-text-muted">
          {emptyLabel}
        </div>
      )}
    </section>
  )
}

function getSelectedSceneIndex(workspace: ChapterStructureWorkspaceViewModel) {
  if (workspace.scenes.length === 0) {
    return -1
  }

  const selectedIndex = workspace.scenes.findIndex((scene) => scene.id === workspace.selectedSceneId)

  return selectedIndex >= 0 ? selectedIndex : 0
}

function getRelationshipText(
  locale: string,
  previousScene: ChapterStructureSceneViewModel | null,
  selectedScene: ChapterStructureSceneViewModel | null,
  nextScene: ChapterStructureSceneViewModel | null,
) {
  if (!selectedScene) {
    return locale === 'zh-CN' ? '当前章节里还没有可装配的场景。' : 'No scene is available for assembly yet.'
  }

  if (previousScene && nextScene) {
    return locale === 'zh-CN'
      ? `${previousScene.title} 把压力推进到 ${selectedScene.title}，随后由 ${selectedScene.title} 把出口节奏送入 ${nextScene.title}。`
      : `${previousScene.title} presses into ${selectedScene.title}, then ${selectedScene.title} exits into ${nextScene.title}.`
  }

  if (previousScene) {
    return locale === 'zh-CN'
      ? `${previousScene.title} 把压力推进到 ${selectedScene.title}，这一接缝暂时还没有后续出口。`
      : `${previousScene.title} presses into ${selectedScene.title}, and this seam has no outgoing scene yet.`
  }

  if (nextScene) {
    return locale === 'zh-CN'
      ? `${selectedScene.title} 打开本章接缝，并把节奏送入 ${nextScene.title}。`
      : `${selectedScene.title} opens the chapter seam and exits into ${nextScene.title}.`
  }

  return locale === 'zh-CN'
    ? `${selectedScene.title} 目前单独承担这一段装配。`
    : `${selectedScene.title} stands alone in the current chapter assembly.`
}

function getContinuityFocus(
  dictionary: ReturnType<typeof useI18n>['dictionary'],
  selectedScene: ChapterStructureSceneViewModel | null,
  previousScene: ChapterStructureSceneViewModel | null,
  nextScene: ChapterStructureSceneViewModel | null,
) {
  if (!selectedScene) {
    return {
      label: dictionary.app.chapterScaffold.purpose,
      detail: dictionary.common.loading,
    }
  }

  if (selectedScene.unresolvedCount > 1) {
    return {
      label: dictionary.app.chapterScaffold.conflict,
      detail: selectedScene.conflict,
    }
  }

  if (previousScene && nextScene) {
    return {
      label: dictionary.app.chapterScaffold.reveal,
      detail: selectedScene.reveal,
    }
  }

  return {
    label: dictionary.app.chapterScaffold.purpose,
    detail: selectedScene.purpose,
  }
}

function getStatusImpactText(
  locale: string,
  unresolvedLabel: string,
  selectedScene: ChapterStructureSceneViewModel | null,
) {
  if (!selectedScene) {
    return locale === 'zh-CN' ? '当前还没有可评估的状态影响。' : 'No seam status impact is available yet.'
  }

  if (locale === 'zh-CN') {
    return `${unresolvedLabel} 仍在施压，${selectedScene.statusLabel}、${selectedScene.proseStatusLabel} 和 ${selectedScene.runStatusLabel} 一起把这条接缝维持在受压状态。`
  }

  return `${unresolvedLabel} stay active while ${selectedScene.statusLabel}, ${selectedScene.proseStatusLabel}, and ${selectedScene.runStatusLabel} keep the seam under pressure.`
}

export function ChapterAssemblyView({ workspace, onSelectScene, onOpenScene }: ChapterAssemblyViewProps) {
  const { locale, dictionary } = useI18n()
  const selectedSceneIndex = getSelectedSceneIndex(workspace)
  const selectedScene = selectedSceneIndex >= 0 ? workspace.scenes[selectedSceneIndex] ?? null : null
  const previousScene = selectedSceneIndex > 0 ? workspace.scenes[selectedSceneIndex - 1] ?? null : null
  const nextScene =
    selectedSceneIndex >= 0 && selectedSceneIndex < workspace.scenes.length - 1
      ? workspace.scenes[selectedSceneIndex + 1] ?? null
      : null
  const continuityFocus = getContinuityFocus(dictionary, selectedScene, previousScene, nextScene)

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <SceneTransitionCard
        heading={dictionary.app.chapterScaffold.incoming}
        scene={previousScene}
        emptyLabel={dictionary.app.chapterScaffold.noIncomingScene}
        onSelectScene={onSelectScene}
      />
      <section className="rounded-md border border-line-strong bg-surface-1 p-4 shadow-ringwarm">
        <h4 className="text-base text-text-main">{dictionary.app.chapterScaffold.currentSeam}</h4>
        <div className="mt-3 rounded-md border border-line-strong bg-surface-2 p-3">
          {selectedScene ? (
            <>
              <button
                type="button"
                aria-current="true"
                onClick={() => onSelectScene?.(selectedScene.id)}
                className="w-full rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
              >
                <span className="block text-base font-medium text-text-main">{selectedScene.title}</span>
                <span className="mt-2 block text-sm leading-6 text-text-muted">{selectedScene.summary}</span>
                <span className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="accent">{selectedScene.statusLabel}</Badge>
                  <Badge tone="neutral">{selectedScene.proseStatusLabel}</Badge>
                  <Badge tone="neutral">{selectedScene.runStatusLabel}</Badge>
                </span>
              </button>
              {onOpenScene ? (
                <div className="mt-3 flex flex-wrap justify-end gap-1.5 border-t border-line-soft pt-2">
                  <button
                    type="button"
                    aria-label={`${dictionary.app.chapterScaffold.openInOrchestrate}: ${selectedScene.title}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onOpenScene?.(selectedScene.id, 'orchestrate')
                    }}
                    className="rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-1 hover:text-text-main"
                  >
                    {dictionary.app.chapterScaffold.openInOrchestrate}
                  </button>
                  <button
                    type="button"
                    aria-label={`${dictionary.app.chapterScaffold.openInDraft}: ${selectedScene.title}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onOpenScene?.(selectedScene.id, 'draft')
                    }}
                    className="rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-1 hover:text-text-main"
                  >
                    {dictionary.app.chapterScaffold.openInDraft}
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-sm leading-6 text-text-muted">{dictionary.common.loading}</p>
          )}
        </div>
        <dl className="mt-3 grid gap-3 text-sm leading-6 text-text-muted">
          <div className="rounded-md border border-line-soft bg-surface-2 p-3">
            <dt className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
              {dictionary.app.chapterScaffold.relationshipToAdjacent}
            </dt>
            <dd className="mt-2">{getRelationshipText(locale, previousScene, selectedScene, nextScene)}</dd>
          </div>
          <div className="rounded-md border border-line-soft bg-surface-2 p-3">
            <dt className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
              {dictionary.app.chapterScaffold.continuityFocus}
            </dt>
            <dd className="mt-2">
              <span className="font-medium text-text-main">{continuityFocus.label}</span>
              <span className="mt-1 block">{continuityFocus.detail}</span>
            </dd>
          </div>
          <div className="rounded-md border border-line-soft bg-surface-2 p-3">
            <dt className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
              {dictionary.app.chapterScaffold.statusImpact}
            </dt>
            <dd className="mt-2">
              {getStatusImpactText(
                locale,
                selectedScene ? getChapterUnresolvedCountLabel(locale, selectedScene.unresolvedCount) : dictionary.common.loading,
                selectedScene,
              )}
            </dd>
          </div>
        </dl>
      </section>
      <SceneTransitionCard
        heading={dictionary.app.chapterScaffold.outgoing}
        scene={nextScene}
        emptyLabel={dictionary.app.chapterScaffold.noOutgoingScene}
        onSelectScene={onSelectScene}
      />
      <section className="rounded-md border border-line-soft bg-surface-2 p-4 xl:col-span-3">
        <h4 className="text-base text-text-main">{dictionary.app.chapterScaffold.assemblyHints}</h4>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {workspace.inspector.assemblyHints.map((hint) => (
            <li key={hint.id} className="rounded-md border border-line-soft bg-surface-1 p-3">
              <p className="font-medium text-text-main">{hint.label}</p>
              <p className="mt-2 text-sm leading-6 text-text-muted">{hint.detail}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
