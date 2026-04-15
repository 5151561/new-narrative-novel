import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'
import { AppProviders } from '@/app/providers'
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
