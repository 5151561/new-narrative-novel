import { useMemo, type PropsWithChildren } from 'react'
import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'
import { AppProviders } from '@/app/providers'
import { createStoryProjectRuntimeEnvironment } from '@/app/project-runtime'
import { Badge } from '@/components/ui/Badge'
import { ChapterBinderPane } from '@/features/chapter/components/ChapterBinderPane'
import { ChapterStructureInspectorPane } from '@/features/chapter/components/ChapterStructureInspectorPane'
import { ChapterStructureStage } from '@/features/chapter/components/ChapterStructureStage'
import type { ChapterStructureView, ChapterStructureWorkspaceViewModel } from '@/features/chapter/types/chapter-view-models'
import { TimelineList } from '@/components/ui/TimelineList'

import { WorkbenchShell } from './WorkbenchShell'

function WorkbenchStoryProviders({ children }: PropsWithChildren) {
  const storyEnvironment = useMemo(() => createStoryProjectRuntimeEnvironment(), [])

  return <AppProviders runtime={storyEnvironment.runtime} queryClient={storyEnvironment.queryClient}>{children}</AppProviders>
}

function WorkbenchShellStoryPreview() {
  const { locale } = useI18n()
  const isChinese = locale === 'zh-CN'

  return (
    <WorkbenchShell
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
                ? '这个外壳 story 用来做布局评审，不依赖 Scene 功能容器本身。'
                : 'This shell story exists so layout review does not depend on the Scene feature container.'}
            </p>
          </div>
        </div>
      }
    />
  )
}

const meta = {
  title: 'Mockups/Workbench/Shell',
  component: WorkbenchShell,
  parameters: {
    layout: 'fullscreen',
  },
  render: () => (
    <WorkbenchStoryProviders>
      <WorkbenchShellStoryPreview />
    </WorkbenchStoryProviders>
  ),
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

function ChapterWorkbenchShellStoryPreview() {
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
  render: () => (
    <WorkbenchStoryProviders>
      <ChapterWorkbenchShellStoryPreview />
    </WorkbenchStoryProviders>
  ),
}
