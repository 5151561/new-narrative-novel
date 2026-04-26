import { useMemo, useState, type PropsWithChildren } from 'react'
import type { Meta, StoryObj } from '@storybook/react'

import { useI18n, type Locale } from '@/app/i18n'
import { AppProviders } from '@/app/providers'
import { createStoryProjectRuntimeEnvironment } from '@/app/project-runtime'
import { Badge } from '@/components/ui/Badge'
import { ChapterBinderPane } from '@/features/chapter/components/ChapterBinderPane'
import { ChapterStructureInspectorPane } from '@/features/chapter/components/ChapterStructureInspectorPane'
import { ChapterStructureStage } from '@/features/chapter/components/ChapterStructureStage'
import type { ChapterStructureView, ChapterStructureWorkspaceViewModel } from '@/features/chapter/types/chapter-view-models'
import { TimelineList } from '@/components/ui/TimelineList'
import { WorkbenchEditorProvider } from '../editor/WorkbenchEditorProvider'
import { getWorkbenchEditorContextId, type WorkbenchEditorContext } from '../editor/workbench-editor-context'
import { describeWorkbenchEditorContext, type WorkbenchEditorDictionary } from '../editor/workbench-editor-descriptors'
import { writeWorkbenchEditorStorage } from '../editor/workbench-editor-storage'
import type { WorkbenchRouteState } from '../types/workbench-route'

import {
  DEFAULT_WORKBENCH_LAYOUT_STATE,
  WORKBENCH_LAYOUT_BOUNDS,
  serializeWorkbenchLayoutState,
  type WorkbenchLayoutState,
} from '../types/workbench-layout'
import { WorkbenchBottomDockFrame } from './WorkbenchBottomDockFrame'
import { WorkbenchShell } from './WorkbenchShell'

const WORKBENCH_LAYOUT_STORY_KEYS = {
  default: 'storybook:workbench-layout:default',
  navigatorHidden: 'storybook:workbench-layout:navigator-hidden',
  inspectorHidden: 'storybook:workbench-layout:inspector-hidden',
  bottomDockHidden: 'storybook:workbench-layout:bottom-dock-hidden',
  resizedPanes: 'storybook:workbench-layout:resized-panes',
  bottomDockMaximized: 'storybook:workbench-layout:bottom-dock-maximized',
  narrowViewport: 'storybook:workbench-layout:narrow-viewport',
  chapterScope: 'storybook:workbench-layout:chapter-scope',
  manyEditorTabs: 'storybook:workbench-layout:many-editor-tabs',
  multipleEditorTabs: 'storybook:workbench-layout:multiple-editor-tabs',
  activeSceneOrchestrate: 'storybook:workbench-layout:active-scene-orchestrate',
  activeBookDraft: 'storybook:workbench-layout:active-book-draft',
  hiddenPanesWithEditorTabs: 'storybook:workbench-layout:hidden-panes-with-editor-tabs',
  editorTabsHiddenNavigator: 'storybook:workbench-layout:editor-tabs-hidden-navigator',
  editorTabsBottomDockMaximized: 'storybook:workbench-layout:editor-tabs-bottom-dock-maximized',
  editorTabsOverflow: 'storybook:workbench-layout:editor-tabs-overflow',
  overflowStress: 'storybook:workbench-layout:overflow-stress',
  bottomDockFrameContract: 'storybook:workbench-layout:bottom-dock-frame-contract',
  unifiedDockTabs: 'storybook:workbench-layout:unified-dock-tabs',
  fourScopeSurfaceContract: 'storybook:workbench-layout:four-scope-surface-contract',
} as const

const WORKBENCH_EDITOR_STORY_KEYS = {
  manyEditorTabs: 'storybook:workbench-editors:many-editor-tabs',
  multipleEditorTabs: 'storybook:workbench-editors:multiple-editor-tabs',
  activeSceneOrchestrate: 'storybook:workbench-editors:active-scene-orchestrate',
  activeBookDraft: 'storybook:workbench-editors:active-book-draft',
  hiddenPanesWithEditorTabs: 'storybook:workbench-editors:hidden-panes-with-editor-tabs',
  editorTabsHiddenNavigator: 'storybook:workbench-editors:editor-tabs-hidden-navigator',
  editorTabsBottomDockMaximized: 'storybook:workbench-editors:editor-tabs-bottom-dock-maximized',
  editorTabsOverflow: 'storybook:workbench-editors:editor-tabs-overflow',
} as const

const EDITOR_SCENE_ORCHESTRATE_ROUTE: WorkbenchRouteState = {
  scope: 'scene',
  sceneId: 'scene-midnight-platform',
  lens: 'orchestrate',
  tab: 'execution',
  beatId: 'beat-bargain',
  proposalId: 'proposal-2',
}
const EDITOR_SCENE_DRAFT_ROUTE: WorkbenchRouteState = {
  scope: 'scene',
  sceneId: 'scene-concourse-delay',
  lens: 'draft',
  tab: 'prose',
}
const EDITOR_SCENE_STRUCTURE_ROUTE: WorkbenchRouteState = {
  scope: 'scene',
  sceneId: 'scene-ticket-window',
  lens: 'structure',
  tab: 'setup',
}
const EDITOR_CHAPTER_ROUTE: WorkbenchRouteState = {
  scope: 'chapter',
  chapterId: 'chapter-signals-in-rain',
  lens: 'structure',
  view: 'sequence',
  sceneId: 'scene-midnight-platform',
}
const EDITOR_ASSET_ROUTE: WorkbenchRouteState = {
  scope: 'asset',
  assetId: 'asset-ren-voss',
  lens: 'knowledge',
  view: 'mentions',
}
const EDITOR_BOOK_DRAFT_ROUTE: WorkbenchRouteState = {
  scope: 'book',
  bookId: 'book-signal-arc',
  lens: 'draft',
  view: 'signals',
  draftView: 'review',
  reviewFilter: 'all',
  reviewStatusFilter: 'open',
  selectedChapterId: 'chapter-open-water-signals',
}
const EDITOR_BOOK_STRUCTURE_ROUTE: WorkbenchRouteState = {
  scope: 'book',
  bookId: 'book-signal-arc',
  lens: 'structure',
  view: 'signals',
  selectedChapterId: 'chapter-open-water-signals',
}

function writeWorkbenchLayoutStoryState(storageKey: string, initialLayout: WorkbenchLayoutState) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(storageKey, serializeWorkbenchLayoutState(initialLayout))
}

function createWorkbenchLayoutState(layout: Partial<WorkbenchLayoutState> = {}): WorkbenchLayoutState {
  return { ...DEFAULT_WORKBENCH_LAYOUT_STATE, ...layout }
}

function createEditorStoryContext(
  route: WorkbenchRouteState,
  index: number,
  dictionary: WorkbenchEditorDictionary,
  locale: Locale,
): WorkbenchEditorContext {
  const timestamp = 1_900_000_000_000 + index
  const descriptor = describeWorkbenchEditorContext(route, dictionary, locale)

  return {
    id: getWorkbenchEditorContextId(route),
    route,
    title: descriptor.title,
    subtitle: descriptor.subtitle,
    updatedAt: timestamp,
    lastActiveAt: timestamp,
  }
}

function writeWorkbenchEditorStoryState(
  storageKey: string,
  routes: WorkbenchRouteState[],
  activeRoute: WorkbenchRouteState,
  dictionary: WorkbenchEditorDictionary,
  locale: Locale,
) {
  const contexts = routes.map((route, index) => createEditorStoryContext(route, index + 1, dictionary, locale))

  writeWorkbenchEditorStorage(
    {
      contexts,
      contextIds: contexts.map((context) => context.id),
      activeContextId: getWorkbenchEditorContextId(activeRoute),
    },
    storageKey,
  )
}

function WorkbenchStoryProviders({ children }: PropsWithChildren) {
  const storyEnvironment = useMemo(() => createStoryProjectRuntimeEnvironment(), [])

  return <AppProviders runtime={storyEnvironment.runtime} queryClient={storyEnvironment.queryClient}>{children}</AppProviders>
}

function WorkbenchShellStoryPreview({
  layoutStorageKey = WORKBENCH_LAYOUT_STORY_KEYS.default,
}: {
  layoutStorageKey?: string
}) {
  const { locale } = useI18n()
  const isChinese = locale === 'zh-CN'

  return (
    <WorkbenchShell
      layoutStorageKey={layoutStorageKey}
      topBar={
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-text-soft">
              {isChinese ? '叙事小说' : 'Narrative Novel'}
            </p>
            <h2 className="text-xl">{isChinese ? '工作台外壳' : 'Workbench Shell'}</h2>
          </div>
          <button type="button" className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white">
            {isChinese ? '新建场景' : 'New Scene'}
          </button>
        </div>
      }
      modeRail={
        <div className="flex h-full flex-col gap-2 p-3">
          {(isChinese ? ['书籍', '章节', '场景', '正文'] : ['Book', 'Chapter', 'Scene', 'Prose']).map((item) => (
            <button
              key={item}
              type="button"
              className={`rounded-md px-2 py-3 text-sm ${
                item === (isChinese ? '场景' : 'Scene') ? 'bg-surface-2 shadow-ringwarm' : 'text-text-muted'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      }
      navigator={
        <TimelineList
          items={[
            {
              id: 'scene-a',
              title: isChinese ? '午夜站台' : 'Midnight Platform',
              detail: isChinese ? '执行评审进行中。' : 'Execution review active.',
              meta: isChinese ? '场景' : 'Scene',
              tone: 'accent',
            },
            {
              id: 'scene-b',
              title: isChinese ? '仓桥交接' : 'Warehouse Bridge',
              detail: isChinese ? '设定草稿等待中。' : 'Setup draft waiting.',
              meta: isChinese ? '草稿' : 'Draft',
              tone: 'neutral',
            },
          ]}
        />
      }
      mainStage={
        <div className="flex h-full items-center justify-center p-8 text-center">
          <div className="space-y-3">
            <h2 className="text-3xl">{isChinese ? '主舞台' : 'Main Stage'}</h2>
            <p className="max-w-xl text-sm leading-6 text-text-muted">
              {isChinese
                ? '当前任务：收束站台交易节拍，并保留公开见证压力。'
                : 'Current task: tighten the platform bargain beat while preserving public witness pressure.'}
            </p>
          </div>
        </div>
      }
      inspector={
        <div className="flex h-full flex-col gap-4 p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-text-soft">
              {isChinese ? '检查器' : 'Inspector'}
            </p>
            <h3 className="mt-1 text-lg">{isChinese ? '执行上下文' : 'Execution Context'}</h3>
          </div>
          <div className="space-y-3 text-sm text-text-muted">
            <p>{isChinese ? '当前节拍需要公开见证压力。' : 'Current beat needs public witness pressure.'}</p>
            <p>{isChinese ? '风险：铃声时点过早释放。' : 'Risk: bell timing resolves too early.'}</p>
          </div>
        </div>
      }
      bottomDock={
        <div className="grid h-full min-h-0 grid-cols-3 gap-3 p-4 text-sm">
          {[
            {
              label: isChinese ? '运行' : 'Run',
              value: isChinese ? '运行 07 已暂停' : 'Run 07 paused',
            },
            {
              label: isChinese ? '评审' : 'Review',
              value: isChinese ? '3 条未决' : '3 open items',
            },
            {
              label: isChinese ? '下一步' : 'Next',
              value: isChinese ? '收束候车厅延误' : 'Tighten concourse delay',
            },
          ].map((item) => (
            <div key={item.label} className="rounded-md border border-line-soft bg-surface-1 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-text-soft">{item.label}</p>
              <p className="mt-2 text-text-main">{item.value}</p>
            </div>
          ))}
        </div>
      }
    />
  )
}

function WorkbenchEditorShellStoryPreview({
  initialRoute,
  editorStorageKey,
  layoutStorageKey,
  routes,
}: {
  initialRoute: WorkbenchRouteState
  editorStorageKey: string
  layoutStorageKey: string
  routes: WorkbenchRouteState[]
}) {
  const { dictionary, locale } = useI18n()
  const [route, setRoute] = useState(initialRoute)

  useMemo(() => {
    writeWorkbenchEditorStoryState(editorStorageKey, routes, initialRoute, dictionary, locale)
  }, [dictionary, editorStorageKey, initialRoute, locale, routes])

  return (
    <WorkbenchEditorProvider route={route} replaceRoute={setRoute} storageKey={editorStorageKey}>
      <WorkbenchShellStoryPreview layoutStorageKey={layoutStorageKey} />
    </WorkbenchEditorProvider>
  )
}

function renderShellStory(
  storageKey: string,
  initialLayout: WorkbenchLayoutState,
  options: { narrow?: boolean } = {},
) {
  writeWorkbenchLayoutStoryState(storageKey, initialLayout)

  const preview = (
    <WorkbenchStoryProviders>
      <WorkbenchShellStoryPreview layoutStorageKey={storageKey} />
    </WorkbenchStoryProviders>
  )

  return options.narrow ? (
    <div className="min-h-screen overflow-auto bg-app">
      <div className="w-[390px] max-w-full">{preview}</div>
    </div>
  ) : (
    preview
  )
}

function OverflowStressPreview({ layoutStorageKey }: { layoutStorageKey: string }) {
  const { locale, dictionary } = useI18n()
  const rows = Array.from({ length: 32 }, (_, index) => ({
    id: `stress-${index + 1}`,
    title: locale === 'zh-CN' ? `压力条目 ${index + 1}` : `Stress item ${index + 1}`,
    detail:
      locale === 'zh-CN'
        ? '站台延误仍挂在当前审阅队列上。'
        : 'The platform delay remains attached to the active review queue.',
    meta: locale === 'zh-CN' ? '滚动' : 'Scroll',
    tone: index % 3 === 0 ? 'warn' : 'neutral',
  })) satisfies Parameters<typeof TimelineList>[0]['items']

  return (
    <WorkbenchShell
      layoutStorageKey={layoutStorageKey}
      topBar={
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-text-soft">{dictionary.app.narrativeWorkbench}</p>
            <h2 className="text-xl">{locale === 'zh-CN' ? '溢出压力' : 'Overflow Stress'}</h2>
          </div>
          <Badge tone="accent">{locale === 'zh-CN' ? '运行 07' : 'Run 07'}</Badge>
        </div>
      }
      modeRail={
        <div className="flex flex-col gap-2 p-3">
          {rows.slice(0, 18).map((row, index) => (
            <button key={row.id} type="button" className={`rounded-md px-2 py-3 text-sm ${index === 0 ? 'bg-surface-2 text-text-main shadow-ringwarm' : 'text-text-muted'}`}>
              {row.title}
            </button>
          ))}
        </div>
      }
      navigator={<TimelineList items={rows} />}
      mainStage={<TimelineList items={rows.map((row) => ({ ...row, id: `main-${row.id}` }))} />}
      inspector={<TimelineList items={rows.slice(0, 24).map((row) => ({ ...row, id: `inspector-${row.id}` }))} />}
      bottomDock={<TimelineList items={rows.slice(0, 20).map((row) => ({ ...row, id: `dock-${row.id}` }))} />}
    />
  )
}

function UnifiedDockTabsPreview({ layoutStorageKey }: { layoutStorageKey: string }) {
  const { locale } = useI18n()
  const [activeTab, setActiveTab] = useState<'problems' | 'activity' | 'trace'>('problems')

  return (
    <WorkbenchShell
      layoutStorageKey={layoutStorageKey}
      topBar={<div className="px-4 py-3 text-lg">{locale === 'zh-CN' ? '统一底部标签' : 'Unified Dock Tabs'}</div>}
      modeRail={<div className="p-3 text-sm text-text-muted">{locale === 'zh-CN' ? 'Scene / Chapter / Asset / Book' : 'Scene / Chapter / Asset / Book'}</div>}
      navigator={<TimelineList items={[{ id: 'nav', title: 'Signal Arc', detail: 'Book scope', meta: 'Book' }]} />}
      mainStage={<div className="p-4 text-sm text-text-muted">{locale === 'zh-CN' ? '当前任务：收束站台交易节拍。' : 'Current task: tighten the platform bargain beat.'}</div>}
      inspector={<div className="p-4 text-sm text-text-muted">{locale === 'zh-CN' ? '风险：铃声时点过早释放压力。' : 'Risk: bell timing releases pressure too early.'}</div>}
      bottomDock={
        <WorkbenchBottomDockFrame
          ariaLabel={locale === 'zh-CN' ? '统一底部面板' : 'Unified bottom dock'}
          tabs={[
            { id: 'problems', label: locale === 'zh-CN' ? '问题' : 'Problems', badge: 4, tone: 'warn' },
            { id: 'activity', label: locale === 'zh-CN' ? '活动' : 'Activity', badge: 8 },
            { id: 'trace', label: locale === 'zh-CN' ? '追踪' : 'Trace', badge: 2, tone: 'accent' },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        >
          <TimelineList
            items={Array.from({ length: activeTab === 'activity' ? 18 : 8 }, (_, index) => ({
              id: `${activeTab}-${index}`,
              title: `${activeTab} ${index + 1}`,
              detail: locale === 'zh-CN' ? '运行摘要已挂到当前问题队列。' : 'Run summary is attached to the active issue queue.',
              meta: activeTab,
              tone: index % 4 === 0 ? 'accent' : 'neutral',
            }))}
          />
        </WorkbenchBottomDockFrame>
      }
    />
  )
}

type ScopeContractSurface = {
  id: WorkbenchRouteState['scope']
  route: WorkbenchRouteState
  title: string
  lens: string
  navigator: string
  mainTask: string
  inspector: string
  dock: string
}

function getScopeContractSurfaces(locale: 'en' | 'zh-CN'): ScopeContractSurface[] {
  const isChinese = locale === 'zh-CN'

  return [
    {
      id: 'scene',
      route: EDITOR_SCENE_ORCHESTRATE_ROUTE,
      title: isChinese ? '午夜站台' : 'Midnight Platform',
      lens: isChinese ? '场景 / 编排' : 'Scene / Orchestrate',
      navigator: isChinese ? '场景队列与当前节拍。' : 'Scene queue and active beat.',
      mainTask: isChinese ? '审阅 proposal 变化是否能进入 accepted canon。' : 'Review whether proposal changes can enter accepted canon.',
      inspector: isChinese ? '已采纳状态、版本和运行上下文。' : 'Accepted state, versions, and runtime context.',
      dock: isChinese ? '事件、问题和 trace 仍停在支持面。' : 'Events, problems, and trace stay in support.',
    },
    {
      id: 'chapter',
      route: EDITOR_CHAPTER_ROUTE,
      title: isChinese ? '雨中信号' : 'Signals in Rain',
      lens: isChinese ? '章节 / 结构' : 'Chapter / Structure',
      navigator: isChinese ? '章节 binder 与 scene 顺序。' : 'Chapter binder and scene order.',
      mainTask: isChinese ? '比较章节节奏和 scene 编排顺序。' : 'Compare chapter rhythm and scene sequence.',
      inspector: isChinese ? '选中 scene 的结构判断和拼接提示。' : 'Selected scene judgment and assembly hints.',
      dock: isChinese ? '结构问题与活动摘要。' : 'Structure problems and activity summary.',
    },
    {
      id: 'asset',
      route: EDITOR_ASSET_ROUTE,
      title: isChinese ? '任·沃斯' : 'Ren Voss',
      lens: isChinese ? '资产 / 知识' : 'Asset / Knowledge',
      navigator: isChinese ? '类型化资产、mentions 与 relations。' : 'Typed assets, mentions, and relations.',
      mainTask: isChinese ? '阅读 canonical profile 并核对跨 scope 引用。' : 'Read the canonical profile and check cross-scope references.',
      inspector: isChinese ? '关系、状态和来源链摘要。' : 'Relations, status, and traceability summary.',
      dock: isChinese ? '知识冲突和引用活动。' : 'Knowledge conflicts and reference activity.',
    },
    {
      id: 'book',
      route: EDITOR_BOOK_DRAFT_ROUTE,
      title: isChinese ? '信号弧线' : 'Signal Arc',
      lens: isChinese ? '书籍 / 成稿' : 'Book / Draft',
      navigator: isChinese ? '章节顺序和 manuscript 检查点。' : 'Chapter order and manuscript checkpoints.',
      mainTask: isChinese ? '对照 manuscript review issue 与章节来源。' : 'Compare manuscript review issues with chapter sources.',
      inspector: isChinese ? '导出准备度、分支和 review 证据。' : 'Export readiness, branches, and review evidence.',
      dock: isChinese ? '问题、活动和产物 trace。' : 'Problems, activity, and artifact trace.',
    },
  ]
}

function FourScopeSurfaceContractPreview({ layoutStorageKey }: { layoutStorageKey: string }) {
  const { locale, dictionary } = useI18n()
  const surfaces = getScopeContractSurfaces(locale)
  const activeSurface = surfaces[0]

  return (
    <WorkbenchShell
      layoutStorageKey={layoutStorageKey}
      topBar={
        <div className="flex items-center justify-between px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.08em] text-text-soft">
              {dictionary.app.narrativeWorkbench}
            </p>
            <h2 className="mt-1 text-xl">
              {locale === 'zh-CN' ? '四种 scope 共用工作台壳' : 'Four-scope Workbench shell'}
            </h2>
          </div>
          <Badge tone="accent">{activeSurface.lens}</Badge>
        </div>
      }
      modeRail={
        <div className="flex h-full flex-col gap-2 p-3">
          {surfaces.map((surface) => (
            <button
              key={surface.id}
              type="button"
              className={`rounded-md px-2 py-3 text-sm ${
                surface.id === activeSurface.id ? 'bg-surface-2 text-text-main shadow-ringwarm' : 'text-text-muted'
              }`}
            >
              {surface.id}
            </button>
          ))}
        </div>
      }
      navigator={
        <TimelineList
          items={surfaces.map((surface) => ({
            id: surface.id,
            title: surface.title,
            detail: surface.navigator,
            meta: surface.lens,
            tone: surface.id === activeSurface.id ? 'accent' : 'neutral',
          }))}
        />
      }
      mainStage={
        <div className="flex h-full min-h-0 flex-col gap-4 p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-text-soft">
              {locale === 'zh-CN' ? '主舞台任务' : 'Main Stage task'}
            </p>
            <h3 className="mt-2 text-2xl">{activeSurface.title}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">{activeSurface.mainTask}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {surfaces.map((surface) => (
              <div key={surface.id} className="rounded-md border border-line-soft bg-surface-1 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-text-main">{surface.title}</p>
                  <Badge tone={surface.id === activeSurface.id ? 'accent' : 'neutral'}>{surface.lens}</Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-text-muted">{surface.mainTask}</p>
              </div>
            ))}
          </div>
        </div>
      }
      inspector={
        <div className="flex h-full flex-col gap-4 p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-text-soft">
              {dictionary.shell.inspectorTitle}
            </p>
            <h3 className="mt-1 text-lg">{activeSurface.title}</h3>
          </div>
          <TimelineList
            items={surfaces.map((surface) => ({
              id: `${surface.id}-inspector`,
              title: surface.lens,
              detail: surface.inspector,
              meta: dictionary.shell.inspectorTitle,
              tone: surface.id === activeSurface.id ? 'accent' : 'neutral',
            }))}
          />
        </div>
      }
      bottomDock={
        <WorkbenchBottomDockFrame
          ariaLabel={dictionary.shell.bottomDockTitle}
          tabs={[
            { id: 'problems', label: locale === 'zh-CN' ? '问题' : 'Problems', badge: 4, tone: 'warn' },
            { id: 'activity', label: locale === 'zh-CN' ? '活动' : 'Activity', badge: 4 },
            { id: 'trace', label: locale === 'zh-CN' ? '追踪' : 'Trace', badge: 4, tone: 'accent' },
          ]}
          activeTab="problems"
          onTabChange={() => {}}
        >
          <TimelineList
            items={surfaces.map((surface) => ({
              id: `${surface.id}-dock`,
              title: surface.lens,
              detail: surface.dock,
              meta: dictionary.shell.bottomDockTitle,
              tone: surface.id === activeSurface.id ? 'accent' : 'neutral',
            }))}
          />
        </WorkbenchBottomDockFrame>
      }
    />
  )
}

function renderEditorShellStory({
  layoutStorageKey,
  editorStorageKey,
  initialLayout,
  routes,
  activeRoute,
}: {
  layoutStorageKey: string
  editorStorageKey: string
  initialLayout: WorkbenchLayoutState
  routes: WorkbenchRouteState[]
  activeRoute: WorkbenchRouteState
}) {
  writeWorkbenchLayoutStoryState(layoutStorageKey, initialLayout)

  return (
    <WorkbenchStoryProviders>
      <WorkbenchEditorShellStoryPreview
        initialRoute={activeRoute}
        editorStorageKey={editorStorageKey}
        layoutStorageKey={layoutStorageKey}
        routes={routes}
      />
    </WorkbenchStoryProviders>
  )
}

const meta = {
  title: 'Mockups/Workbench/Shell',
  component: WorkbenchShell,
  parameters: {
    layout: 'fullscreen',
  },
  render: () => renderShellStory(WORKBENCH_LAYOUT_STORY_KEYS.default, createWorkbenchLayoutState()),
  args: {
    topBar: <></>,
    modeRail: <></>,
    navigator: <></>,
    mainStage: <></>,
  },
} satisfies Meta<typeof WorkbenchShell>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const NavigatorHidden: Story = {
  render: () =>
    renderShellStory(
      WORKBENCH_LAYOUT_STORY_KEYS.navigatorHidden,
      createWorkbenchLayoutState({ navigatorVisible: false }),
    ),
}

export const InspectorHidden: Story = {
  render: () =>
    renderShellStory(
      WORKBENCH_LAYOUT_STORY_KEYS.inspectorHidden,
      createWorkbenchLayoutState({ inspectorVisible: false }),
    ),
}

export const BottomDockHidden: Story = {
  render: () =>
    renderShellStory(
      WORKBENCH_LAYOUT_STORY_KEYS.bottomDockHidden,
      createWorkbenchLayoutState({ bottomDockVisible: false }),
    ),
}

export const ResizedPanes: Story = {
  render: () =>
    renderShellStory(
      WORKBENCH_LAYOUT_STORY_KEYS.resizedPanes,
      createWorkbenchLayoutState({
        navigatorWidth: WORKBENCH_LAYOUT_BOUNDS.navigator.max,
        inspectorWidth: WORKBENCH_LAYOUT_BOUNDS.inspector.min,
        bottomDockHeight: WORKBENCH_LAYOUT_BOUNDS.bottomDock.max,
      }),
    ),
}

export const BottomDockMaximized: Story = {
  render: () =>
    renderShellStory(
      WORKBENCH_LAYOUT_STORY_KEYS.bottomDockMaximized,
      createWorkbenchLayoutState({
        bottomDockHeight: WORKBENCH_LAYOUT_BOUNDS.bottomDock.defaultSize,
        bottomDockMaximized: true,
      }),
    ),
}

export const OverflowStress: Story = {
  render: () => {
    writeWorkbenchLayoutStoryState(WORKBENCH_LAYOUT_STORY_KEYS.overflowStress, createWorkbenchLayoutState())

    return (
      <WorkbenchStoryProviders>
        <OverflowStressPreview layoutStorageKey={WORKBENCH_LAYOUT_STORY_KEYS.overflowStress} />
      </WorkbenchStoryProviders>
    )
  },
}

export const UnifiedDockTabs: Story = {
  render: () => {
    writeWorkbenchLayoutStoryState(WORKBENCH_LAYOUT_STORY_KEYS.unifiedDockTabs, createWorkbenchLayoutState())

    return (
      <WorkbenchStoryProviders>
        <UnifiedDockTabsPreview layoutStorageKey={WORKBENCH_LAYOUT_STORY_KEYS.unifiedDockTabs} />
      </WorkbenchStoryProviders>
    )
  },
}

export const BottomDockFrameContract: Story = {
  render: () => {
    writeWorkbenchLayoutStoryState(
      WORKBENCH_LAYOUT_STORY_KEYS.bottomDockFrameContract,
      createWorkbenchLayoutState(),
    )

    return (
      <WorkbenchStoryProviders>
        <UnifiedDockTabsPreview layoutStorageKey={WORKBENCH_LAYOUT_STORY_KEYS.bottomDockFrameContract} />
      </WorkbenchStoryProviders>
    )
  },
}

export const MultipleEditorTabs: Story = {
  render: () =>
    renderEditorShellStory({
      layoutStorageKey: WORKBENCH_LAYOUT_STORY_KEYS.multipleEditorTabs,
      editorStorageKey: WORKBENCH_EDITOR_STORY_KEYS.multipleEditorTabs,
      initialLayout: createWorkbenchLayoutState(),
      routes: [
        EDITOR_SCENE_ORCHESTRATE_ROUTE,
        EDITOR_CHAPTER_ROUTE,
        EDITOR_ASSET_ROUTE,
        EDITOR_BOOK_DRAFT_ROUTE,
      ],
      activeRoute: EDITOR_ASSET_ROUTE,
    }),
}

export const ManyEditorTabs: Story = {
  render: () =>
    renderEditorShellStory({
      layoutStorageKey: WORKBENCH_LAYOUT_STORY_KEYS.manyEditorTabs,
      editorStorageKey: WORKBENCH_EDITOR_STORY_KEYS.manyEditorTabs,
      initialLayout: createWorkbenchLayoutState(),
      routes: [
        EDITOR_SCENE_ORCHESTRATE_ROUTE,
        EDITOR_SCENE_DRAFT_ROUTE,
        EDITOR_SCENE_STRUCTURE_ROUTE,
        EDITOR_CHAPTER_ROUTE,
        {
          scope: 'chapter',
          chapterId: 'chapter-open-water-signals',
          lens: 'draft',
          view: 'sequence',
        },
        EDITOR_ASSET_ROUTE,
        {
          scope: 'asset',
          assetId: 'asset-mei-arden',
          lens: 'knowledge',
          view: 'relations',
        },
        {
          scope: 'asset',
          assetId: 'asset-eastbound-platform',
          lens: 'knowledge',
          view: 'context',
        },
        EDITOR_BOOK_STRUCTURE_ROUTE,
        EDITOR_BOOK_DRAFT_ROUTE,
        {
          scope: 'book',
          bookId: 'book-signal-arc',
          lens: 'draft',
          view: 'signals',
          draftView: 'compare',
          checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
          selectedChapterId: 'chapter-open-water-signals',
        },
      ],
      activeRoute: EDITOR_BOOK_DRAFT_ROUTE,
    }),
}

export const ActiveSceneOrchestrate: Story = {
  render: () =>
    renderEditorShellStory({
      layoutStorageKey: WORKBENCH_LAYOUT_STORY_KEYS.activeSceneOrchestrate,
      editorStorageKey: WORKBENCH_EDITOR_STORY_KEYS.activeSceneOrchestrate,
      initialLayout: createWorkbenchLayoutState(),
      routes: [
        EDITOR_SCENE_ORCHESTRATE_ROUTE,
        EDITOR_CHAPTER_ROUTE,
        EDITOR_ASSET_ROUTE,
        EDITOR_BOOK_DRAFT_ROUTE,
      ],
      activeRoute: EDITOR_SCENE_ORCHESTRATE_ROUTE,
    }),
}

export const ActiveBookDraft: Story = {
  render: () =>
    renderEditorShellStory({
      layoutStorageKey: WORKBENCH_LAYOUT_STORY_KEYS.activeBookDraft,
      editorStorageKey: WORKBENCH_EDITOR_STORY_KEYS.activeBookDraft,
      initialLayout: createWorkbenchLayoutState(),
      routes: [
        EDITOR_SCENE_ORCHESTRATE_ROUTE,
        EDITOR_CHAPTER_ROUTE,
        EDITOR_ASSET_ROUTE,
        EDITOR_BOOK_DRAFT_ROUTE,
      ],
      activeRoute: EDITOR_BOOK_DRAFT_ROUTE,
    }),
}

export const EditorTabsWithHiddenNavigator: Story = {
  render: () =>
    renderEditorShellStory({
      layoutStorageKey: WORKBENCH_LAYOUT_STORY_KEYS.editorTabsHiddenNavigator,
      editorStorageKey: WORKBENCH_EDITOR_STORY_KEYS.editorTabsHiddenNavigator,
      initialLayout: createWorkbenchLayoutState({ navigatorVisible: false }),
      routes: [
        EDITOR_SCENE_ORCHESTRATE_ROUTE,
        EDITOR_CHAPTER_ROUTE,
        EDITOR_ASSET_ROUTE,
        EDITOR_BOOK_DRAFT_ROUTE,
      ],
      activeRoute: EDITOR_SCENE_ORCHESTRATE_ROUTE,
    }),
}

export const HiddenPanesWithEditorTabs: Story = {
  render: () =>
    renderEditorShellStory({
      layoutStorageKey: WORKBENCH_LAYOUT_STORY_KEYS.hiddenPanesWithEditorTabs,
      editorStorageKey: WORKBENCH_EDITOR_STORY_KEYS.hiddenPanesWithEditorTabs,
      initialLayout: createWorkbenchLayoutState({
        navigatorVisible: false,
        inspectorVisible: false,
        bottomDockVisible: false,
      }),
      routes: [
        EDITOR_SCENE_ORCHESTRATE_ROUTE,
        EDITOR_CHAPTER_ROUTE,
        EDITOR_ASSET_ROUTE,
        EDITOR_BOOK_DRAFT_ROUTE,
      ],
      activeRoute: EDITOR_SCENE_ORCHESTRATE_ROUTE,
    }),
}

export const EditorTabsWithBottomDockMaximized: Story = {
  render: () =>
    renderEditorShellStory({
      layoutStorageKey: WORKBENCH_LAYOUT_STORY_KEYS.editorTabsBottomDockMaximized,
      editorStorageKey: WORKBENCH_EDITOR_STORY_KEYS.editorTabsBottomDockMaximized,
      initialLayout: createWorkbenchLayoutState({
        bottomDockHeight: WORKBENCH_LAYOUT_BOUNDS.bottomDock.defaultSize,
        bottomDockMaximized: true,
      }),
      routes: [
        EDITOR_SCENE_ORCHESTRATE_ROUTE,
        EDITOR_CHAPTER_ROUTE,
        EDITOR_ASSET_ROUTE,
        EDITOR_BOOK_DRAFT_ROUTE,
      ],
      activeRoute: EDITOR_BOOK_DRAFT_ROUTE,
    }),
}

export const EditorTabsOverflow: Story = {
  render: () =>
    renderEditorShellStory({
      layoutStorageKey: WORKBENCH_LAYOUT_STORY_KEYS.editorTabsOverflow,
      editorStorageKey: WORKBENCH_EDITOR_STORY_KEYS.editorTabsOverflow,
      initialLayout: createWorkbenchLayoutState(),
      routes: [
        EDITOR_SCENE_ORCHESTRATE_ROUTE,
        EDITOR_SCENE_DRAFT_ROUTE,
        EDITOR_SCENE_STRUCTURE_ROUTE,
        EDITOR_CHAPTER_ROUTE,
        {
          scope: 'chapter',
          chapterId: 'chapter-open-water-signals',
          lens: 'draft',
          view: 'sequence',
        },
        EDITOR_ASSET_ROUTE,
        {
          scope: 'asset',
          assetId: 'asset-mei-arden',
          lens: 'knowledge',
          view: 'relations',
        },
        {
          scope: 'asset',
          assetId: 'asset-eastbound-platform',
          lens: 'knowledge',
          view: 'context',
        },
        EDITOR_BOOK_STRUCTURE_ROUTE,
        EDITOR_BOOK_DRAFT_ROUTE,
        {
          scope: 'book',
          bookId: 'book-signal-arc',
          lens: 'draft',
          view: 'signals',
          draftView: 'compare',
          checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
          selectedChapterId: 'chapter-open-water-signals',
        },
      ],
      activeRoute: EDITOR_BOOK_DRAFT_ROUTE,
    }),
}

export const NarrowViewport: Story = {
  render: () =>
    renderShellStory(WORKBENCH_LAYOUT_STORY_KEYS.narrowViewport, createWorkbenchLayoutState(), {
      narrow: true,
    }),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
}

function ChapterWorkbenchShellStoryPreview({
  layoutStorageKey = WORKBENCH_LAYOUT_STORY_KEYS.chapterScope,
}: {
  layoutStorageKey?: string
}) {
  const { locale, dictionary } = useI18n()
  const activeView: ChapterStructureView = 'sequence'
  const model: ChapterStructureWorkspaceViewModel = {
    chapterId: 'chapter-signals-in-rain',
    title: locale === 'zh-CN' ? '雨中信号' : 'Signals in Rain',
    summary: locale === 'zh-CN' ? '把章节结构、密度和拼接压力放在同一个工作面里。' : 'Keep structure, density, and assembly pressure in the same chapter workbench.',
    sceneCount: 4,
    unresolvedCount: 8,
    selectedSceneId: 'scene-midnight-platform',
    scenes: [
      {
        id: 'scene-midnight-platform',
        order: 1,
        title: locale === 'zh-CN' ? '午夜站台' : 'Midnight Platform',
        summary: locale === 'zh-CN' ? '让公开场景压缩每一次让步空间。' : 'Keep the bargain public and constrained.',
        purpose: locale === 'zh-CN' ? '把交易推进到公开的僵局。' : 'Push the bargain into a public stalemate.',
        pov: locale === 'zh-CN' ? '任·沃斯' : 'Ren Voss',
        location: locale === 'zh-CN' ? '东行月台' : 'Eastbound platform',
        conflict: locale === 'zh-CN' ? '任需要筹码，美伊需要更高代价。' : 'Ren needs leverage, Mei needs a higher price.',
        reveal: locale === 'zh-CN' ? '信使暗号仍只对任可读。' : 'The courier signal stays readable only to Ren.',
        statusLabel: locale === 'zh-CN' ? '当前' : 'Current',
        proseStatusLabel: locale === 'zh-CN' ? '待起草' : 'Needs draft',
        runStatusLabel: locale === 'zh-CN' ? '已暂停' : 'Paused',
        unresolvedCount: 3,
        lastRunLabel: locale === 'zh-CN' ? '运行 07' : 'Run 07',
      },
      {
        id: 'scene-concourse-delay',
        order: 2,
        title: locale === 'zh-CN' ? '候车厅延误' : 'Concourse Delay',
        summary: locale === 'zh-CN' ? '继续拖住离场节奏。' : 'Hold the exit timing back a little longer.',
        purpose: locale === 'zh-CN' ? '把压力留到下一场。' : 'Hold pressure for the next scene.',
        pov: locale === 'zh-CN' ? '美伊·阿登' : 'Mei Arden',
        location: locale === 'zh-CN' ? '候车大厅' : 'Concourse hall',
        conflict: locale === 'zh-CN' ? '人潮拖慢所有人。' : 'The crowd slows everyone down.',
        reveal: locale === 'zh-CN' ? '目击压力延续到室内。' : 'Witness pressure carries inward.',
        statusLabel: locale === 'zh-CN' ? '排队中' : 'Queued',
        proseStatusLabel: locale === 'zh-CN' ? '待起草' : 'Queued for draft',
        runStatusLabel: locale === 'zh-CN' ? '未开始' : 'Idle',
        unresolvedCount: 2,
        lastRunLabel: locale === 'zh-CN' ? '未运行' : 'Not run',
      },
      {
        id: 'scene-ticket-window',
        order: 3,
        title: locale === 'zh-CN' ? '售票窗' : 'Ticket Window',
        summary: locale === 'zh-CN' ? '别名继续留在台外。' : 'Keep the alias offstage.',
        purpose: locale === 'zh-CN' ? '把速度和确定性放进同一节拍。' : 'Bring speed and certainty into one beat.',
        pov: locale === 'zh-CN' ? '任·沃斯' : 'Ren Voss',
        location: locale === 'zh-CN' ? '售票窗' : 'Ticket window',
        conflict: locale === 'zh-CN' ? '任想加速，美伊要先要承诺。' : 'Ren wants speed, Mei wants commitment first.',
        reveal: locale === 'zh-CN' ? '化名仍未进入公开层。' : 'The alias still has not entered public knowledge.',
        statusLabel: locale === 'zh-CN' ? '受控' : 'Guarded',
        proseStatusLabel: locale === 'zh-CN' ? '待起草' : 'Needs draft',
        runStatusLabel: locale === 'zh-CN' ? '已守护' : 'Guarded',
        unresolvedCount: 1,
        lastRunLabel: locale === 'zh-CN' ? '运行 03' : 'Run 03',
      },
    ],
    inspector: {
      selectedSceneBrief: {
        sceneId: 'scene-midnight-platform',
        title: locale === 'zh-CN' ? '午夜站台' : 'Midnight Platform',
        summary: locale === 'zh-CN' ? '让公共见证继续存在于场景边缘。' : 'Keep public witness pressure alive at the edge of the scene.',
        unresolvedCount: 3,
        unresolvedLabel: locale === 'zh-CN' ? '未决 3' : 'Unresolved 3',
      },
      chapterNotes: locale === 'zh-CN' ? ['排序属于结构层。'] : ['Ordering remains structural.'],
      problemsSummary: [
        {
          id: 'bell-timing',
          label: locale === 'zh-CN' ? '铃声时点' : 'Bell timing',
          detail: locale === 'zh-CN' ? '主要风险在铃声时点和别名曝光。' : 'Main risks cluster around bell timing and alias exposure.',
        },
      ],
      assemblyHints: [
        {
          id: 'carry-pressure',
          label: locale === 'zh-CN' ? '延续站台压力' : 'Carry platform pressure',
          detail: locale === 'zh-CN' ? '把站台压力延续到候车厅。' : 'Carry platform pressure into the concourse.',
        },
      ],
    },
    viewsMeta: {
      availableViews: ['sequence', 'outliner', 'assembly'],
    },
  }

  return (
    <WorkbenchShell
      layoutStorageKey={layoutStorageKey}
      topBar={
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-text-soft">{dictionary.app.narrativeWorkbench}</p>
            <div className="mt-1 flex items-center gap-2">
              <h2 className="text-xl">{dictionary.app.chapterWorkbench}</h2>
              <Badge tone="neutral">{dictionary.common.chapter}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge tone="neutral">{dictionary.app.chapterStructure}</Badge>
            <Badge tone="accent">{dictionary.app.sequence}</Badge>
          </div>
        </div>
      }
      modeRail={
        <div className="flex h-full flex-col gap-2 p-3">
          {[
            { label: dictionary.common.scene, active: false },
            { label: dictionary.common.chapter, active: true },
            { label: dictionary.app.chapterStructure, active: true },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              className={`rounded-md px-2 py-3 text-sm ${item.active ? 'bg-surface-2 text-text-main shadow-ringwarm' : 'text-text-muted'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      }
      navigator={
        <ChapterBinderPane
          title={dictionary.app.chapters}
          description={dictionary.app.chapterNavigatorDescription}
          workspace={model}
          activeView={activeView}
          onOpenScene={() => {}}
        />
      }
      mainStage={
        <ChapterStructureStage
          activeView={activeView}
          labels={{
            sequence: dictionary.app.sequence,
            outliner: dictionary.app.outliner,
            assembly: dictionary.app.assembly,
          }}
          availableViews={model.viewsMeta?.availableViews}
          workspace={model}
          title={dictionary.app.chapterStructure}
          onViewChange={() => {}}
          onSelectScene={() => {}}
          onOpenScene={() => {}}
        />
      }
      inspector={
        <ChapterStructureInspectorPane
          chapterTitle={model.title}
          chapterSummary={model.summary}
          unresolvedCount={model.unresolvedCount}
          inspector={model.inspector}
        />
      }
    />
  )
}

export const ChapterScope: Story = {
  render: () => {
    writeWorkbenchLayoutStoryState(WORKBENCH_LAYOUT_STORY_KEYS.chapterScope, createWorkbenchLayoutState())

    return (
      <WorkbenchStoryProviders>
        <ChapterWorkbenchShellStoryPreview layoutStorageKey={WORKBENCH_LAYOUT_STORY_KEYS.chapterScope} />
      </WorkbenchStoryProviders>
    )
  },
}

export const FourScopeSurfaceContract: Story = {
  render: () => {
    writeWorkbenchLayoutStoryState(
      WORKBENCH_LAYOUT_STORY_KEYS.fourScopeSurfaceContract,
      createWorkbenchLayoutState(),
    )

    return (
      <WorkbenchStoryProviders>
        <FourScopeSurfaceContractPreview
          layoutStorageKey={WORKBENCH_LAYOUT_STORY_KEYS.fourScopeSurfaceContract}
        />
      </WorkbenchStoryProviders>
    )
  },
}
