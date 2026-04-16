import {
  getChapterStructureViewLabel,
  getLocaleName,
  useI18n,
} from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { WorkbenchShell } from '@/features/workbench/components/WorkbenchShell'
import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'

import { ChapterBinderPlaceholder } from '../components/ChapterBinderPlaceholder'
import { ChapterStructureInspectorPlaceholder } from '../components/ChapterStructureInspectorPlaceholder'
import { ChapterStructureStagePlaceholder } from '../components/ChapterStructureStagePlaceholder'
import { useChapterStructureWorkspaceQuery } from '../hooks/useChapterStructureWorkspaceQuery'
import type { ChapterStructureView, ChapterStructureWorkspaceViewModel } from '../types/chapter-view-models'

const defaultChapterViews: ChapterStructureView[] = ['sequence', 'outliner', 'assembly']

function LanguageToggle() {
  const { locale, setLocale, dictionary } = useI18n()

  return (
    <div className="flex items-center gap-1 rounded-md border border-line-soft bg-surface-2 p-1">
      <span className="px-2 text-[11px] uppercase tracking-[0.05em] text-text-soft">{dictionary.common.language}</span>
      {(['en', 'zh-CN'] as const).map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={locale === value}
          onClick={() => setLocale(value)}
          className={`rounded-md px-2 py-1 text-xs font-medium ${
            locale === value ? 'bg-surface-1 text-text-main shadow-ringwarm' : 'text-text-muted'
          }`}
        >
          {getLocaleName(locale, value)}
        </button>
      ))}
    </div>
  )
}

function ChapterTopCommandBar({
  activeView,
  workspace,
}: {
  activeView: ChapterStructureView
  workspace?: ChapterStructureWorkspaceViewModel | null
}) {
  const { locale, dictionary } = useI18n()

  return (
    <div className="flex h-full flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.narrativeWorkbench}</p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg leading-tight text-text-main">{dictionary.app.chapterWorkbench}</h1>
          <Badge tone="neutral">{dictionary.common.chapter}</Badge>
          <Badge tone="accent">{getChapterStructureViewLabel(locale, activeView)}</Badge>
        </div>
        <p className="text-sm text-text-muted">
          {workspace?.title ?? dictionary.common.chapter} / {dictionary.app.chapterStructure} / {getChapterStructureViewLabel(locale, activeView)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <LanguageToggle />
        <Badge tone="neutral">{dictionary.app.chapterStructure}</Badge>
        <Badge tone="neutral">{getChapterStructureViewLabel(locale, activeView)}</Badge>
      </div>
    </div>
  )
}

function ChapterModeRail({ onSwitchScope }: { onSwitchScope: () => void }) {
  const { dictionary } = useI18n()

  return (
    <div className="flex h-full flex-col gap-2 px-2 py-3">
      <div className="rounded-md border border-line-soft bg-surface-1 p-2">
        <p className="text-center text-[10px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.scope}</p>
        <div className="mt-2 grid gap-2">
          <button
            type="button"
            aria-pressed="false"
            onClick={onSwitchScope}
            className="rounded-md border border-transparent px-2 py-2 text-sm text-text-muted hover:border-line-soft hover:bg-surface-2"
          >
            {dictionary.common.scene}
          </button>
          <button
            type="button"
            aria-pressed="true"
            className="rounded-md border border-line-strong bg-surface-1 px-2 py-2 text-sm text-text-main"
          >
            {dictionary.common.chapter}
          </button>
        </div>
      </div>
      <button
        type="button"
        aria-pressed="true"
        className="rounded-md border border-line-strong bg-surface-1 px-2 py-3 text-left text-text-main"
      >
        <span className="block text-sm font-medium">{dictionary.app.chapterStructure}</span>
      </button>
    </div>
  )
}

function ChapterPaneState({ title, message }: { title: string; message: string }) {
  return (
    <div className="p-4">
      <EmptyState title={title} message={message} />
    </div>
  )
}

export function ChapterStructureWorkspace() {
  const { route, replaceRoute, patchChapterRoute } = useWorkbenchRouteState()
  const { locale, dictionary } = useI18n()

  if (route.scope !== 'chapter') {
    return null
  }

  const { workspace, isLoading, error } = useChapterStructureWorkspaceQuery({
    chapterId: route.chapterId,
    selectedSceneId: route.sceneId ?? null,
  })

  const shellModeRail = <ChapterModeRail onSwitchScope={() => replaceRoute({ scope: 'scene' })} />

  if (error) {
    const message = error.message

    return (
      <WorkbenchShell
        topBar={<ChapterTopCommandBar activeView={route.view} workspace={null} />}
        modeRail={shellModeRail}
        navigator={<ChapterPaneState title={locale === 'zh-CN' ? '章节不可用' : 'Chapter unavailable'} message={message} />}
        mainStage={<ChapterPaneState title={locale === 'zh-CN' ? '章节不可用' : 'Chapter unavailable'} message={message} />}
        inspector={<ChapterPaneState title={locale === 'zh-CN' ? '检查器不可用' : 'Inspector unavailable'} message={message} />}
      />
    )
  }

  if (isLoading || workspace === undefined) {
    const message =
      locale === 'zh-CN'
        ? '正在准备章节结构工作区、装配视图和检查器摘要。'
        : 'Preparing the chapter structure workspace, assembly view, and inspector summary.'

    return (
      <WorkbenchShell
        topBar={<ChapterTopCommandBar activeView={route.view} workspace={workspace} />}
        modeRail={shellModeRail}
        navigator={<ChapterPaneState title={dictionary.common.loading} message={message} />}
        mainStage={<ChapterPaneState title={dictionary.common.loading} message={message} />}
        inspector={<ChapterPaneState title={dictionary.common.loading} message={message} />}
      />
    )
  }

  if (workspace === null) {
    const message =
      locale === 'zh-CN'
        ? `未找到章节 ${route.chapterId}。`
        : `Chapter ${route.chapterId} could not be found.`

    return (
      <WorkbenchShell
        topBar={<ChapterTopCommandBar activeView={route.view} workspace={workspace} />}
        modeRail={shellModeRail}
        navigator={<ChapterPaneState title={locale === 'zh-CN' ? '章节不存在' : 'Chapter not found'} message={message} />}
        mainStage={<ChapterPaneState title={locale === 'zh-CN' ? '章节不存在' : 'Chapter not found'} message={message} />}
        inspector={<ChapterPaneState title={locale === 'zh-CN' ? '章节不存在' : 'Chapter not found'} message={message} />}
      />
    )
  }

  const availableViews = workspace.viewsMeta?.availableViews ?? defaultChapterViews

  return (
    <WorkbenchShell
      topBar={<ChapterTopCommandBar activeView={route.view} workspace={workspace} />}
      modeRail={shellModeRail}
      navigator={
        <ChapterBinderPlaceholder
          title={dictionary.app.chapters}
          description={dictionary.app.chapterNavigatorDescription}
          workspace={workspace}
          activeView={route.view}
          onSelectScene={(sceneId) => patchChapterRoute({ sceneId })}
        />
      }
      mainStage={
        <ChapterStructureStagePlaceholder
          activeView={route.view}
          labels={{
            sequence: dictionary.app.sequence,
            outliner: dictionary.app.outliner,
            assembly: dictionary.app.assembly,
          }}
          availableViews={availableViews}
          workspace={workspace}
          title={dictionary.app.chapterStructure}
          onViewChange={(view) => patchChapterRoute({ view })}
        />
      }
      inspector={
        <ChapterStructureInspectorPlaceholder
          chapterId={workspace.chapterId}
          unresolvedCount={workspace.unresolvedCount}
          inspector={workspace.inspector}
        />
      }
    />
  )
}
