import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'
import { AppProviders } from '@/app/providers'
import { Badge } from '@/components/ui/Badge'
import { ChapterBinderPlaceholder } from '@/features/chapter/components/ChapterBinderPlaceholder'
import { ChapterStructureWorkspace } from '@/features/chapter/containers/ChapterStructureWorkspace'
import { TimelineList } from '@/components/ui/TimelineList'

import { WorkbenchShell } from './WorkbenchShell'

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
    <AppProviders>
      <WorkbenchShellStoryPreview />
    </AppProviders>
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
        <ChapterBinderPlaceholder
          title={dictionary.app.chapters}
          description={dictionary.app.chapterNavigatorDescription}
          model={{
            chapterId: 'chapter-signals-in-rain',
            title: locale === 'zh-CN' ? '雨中信号' : 'Signals in Rain',
            sceneCount: 4,
            unresolvedCount: 8,
            activeView: 'sequence',
            currentSceneId: 'scene-midnight-platform',
            scenes: [
              {
                id: 'scene-midnight-platform',
                title: locale === 'zh-CN' ? '午夜站台' : 'Midnight Platform',
                statusLabel: locale === 'zh-CN' ? '当前' : 'Current',
                summary: locale === 'zh-CN' ? '让公开场景压缩每一次让步空间。' : 'Keep the bargain public and constrained.',
                unresolvedCount: 3,
              },
              {
                id: 'scene-concourse-delay',
                title: locale === 'zh-CN' ? '候车厅延误' : 'Concourse Delay',
                statusLabel: locale === 'zh-CN' ? '排队中' : 'Queued',
                summary: locale === 'zh-CN' ? '继续拖住离场节奏。' : 'Hold the exit timing back a little longer.',
                unresolvedCount: 2,
              },
              {
                id: 'scene-ticket-window',
                title: locale === 'zh-CN' ? '售票窗' : 'Ticket Window',
                statusLabel: locale === 'zh-CN' ? '受控' : 'Guarded',
                summary: locale === 'zh-CN' ? '别名继续留在台外。' : 'Keep the alias offstage.',
                unresolvedCount: 1,
              },
            ],
            inspector: {
              selectedSceneTitle: locale === 'zh-CN' ? '午夜站台' : 'Midnight Platform',
              selectedSceneBrief: '',
              unresolvedSummary: '',
              chapterNotes: [],
            },
          }}
        />
      }
      mainStage={
        <ChapterStructureWorkspace
          route={{
            scope: 'chapter',
            chapterId: 'chapter-signals-in-rain',
            lens: 'structure',
            view: 'sequence',
          }}
          onViewChange={() => {}}
        />
      }
      inspector={
        <div className="p-4 text-sm text-text-muted">
          {locale === 'zh-CN' ? '章节检查器占位。' : 'Chapter inspector placeholder.'}
        </div>
      }
    />
  )
}

export const ChapterScope: Story = {
  render: () => (
    <AppProviders>
      <ChapterWorkbenchShellStoryPreview />
    </AppProviders>
  ),
}
