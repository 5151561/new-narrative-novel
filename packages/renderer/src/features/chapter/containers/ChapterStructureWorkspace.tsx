import { getChapterUnresolvedCountLabel } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { PaneHeader } from '@/components/ui/PaneHeader'
import { useI18n, type Locale } from '@/app/i18n'
import type { ChapterRouteState, ChapterStructureView } from '@/features/workbench/types/workbench-route'

import { ChapterStructureStagePlaceholder } from '../components/ChapterStructureStagePlaceholder'
import type { ChapterStructureWorkspaceViewModel } from '../types/chapter-view-models'

interface ChapterStructureWorkspaceProps {
  route: ChapterRouteState
  onViewChange: (view: ChapterStructureView) => void
}

interface ChapterRecord {
  title: Record<Locale, string>
  scenes: Array<{
    id: string
    title: Record<Locale, string>
    statusLabel: Record<Locale, string>
    summary: Record<Locale, string>
    unresolvedCount: number
  }>
  inspector: {
    chapterNotes: Record<Locale, string[]>
  }
}

const chapterRecords: Record<string, ChapterRecord> = {
  'chapter-signals-in-rain': {
    title: {
      en: 'Signals in Rain',
      'zh-CN': '雨中信号',
    },
    scenes: [
      {
        id: 'scene-midnight-platform',
        title: { en: 'Midnight Platform', 'zh-CN': '午夜站台' },
        statusLabel: { en: 'Current', 'zh-CN': '当前' },
        summary: {
          en: 'Ren has to lock the bargain before the platform witness turns the ledger into public leverage.',
          'zh-CN': 'Ren 必须在站台目击者把账本变成公开筹码之前锁定交易。',
        },
        unresolvedCount: 3,
      },
      {
        id: 'scene-concourse-delay',
        title: { en: 'Concourse Delay', 'zh-CN': '候车厅延误' },
        statusLabel: { en: 'Queued', 'zh-CN': '排队中' },
        summary: {
          en: 'A crowd bottleneck should slow the exit without resolving who controls the courier line.',
          'zh-CN': '人潮阻塞会拖慢离场，但不会解决谁掌控信使线索。',
        },
        unresolvedCount: 2,
      },
      {
        id: 'scene-ticket-window',
        title: { en: 'Ticket Window', 'zh-CN': '售票窗' },
        statusLabel: { en: 'Guarded', 'zh-CN': '受控' },
        summary: {
          en: 'The alias stays offstage while Mei tests whether Ren will trade certainty for speed.',
          'zh-CN': '别名继续留在台外，Mei 试探 Ren 是否会拿确定性交换速度。',
        },
        unresolvedCount: 1,
      },
      {
        id: 'scene-departure-bell',
        title: { en: 'Departure Bell', 'zh-CN': '发车钟' },
        statusLabel: { en: 'Pending', 'zh-CN': '待定' },
        summary: {
          en: 'The chapter still needs a final bell placement that does not collapse the witness pressure too early.',
          'zh-CN': '本章仍需要一个不会过早压垮目击者压力的终局钟声位置。',
        },
        unresolvedCount: 2,
      },
    ],
    inspector: {
      chapterNotes: {
        en: [
          'Witness scrutiny belongs in the auxiliary context, not the stage copy.',
          'Ordering remains structural; no prose merge is implied here.',
        ],
        'zh-CN': ['目击者压力放在辅助上下文，不放进主舞台文案。', '排序属于结构层，这里不引入正文合并。'],
      },
    },
  },
  'chapter-open-water-signals': {
    title: {
      en: 'Open Water Signals',
      'zh-CN': '开阔水域信号',
    },
    scenes: [
      {
        id: 'scene-warehouse-bridge',
        title: { en: 'Warehouse Bridge', 'zh-CN': '仓桥交接' },
        statusLabel: { en: 'Current', 'zh-CN': '当前' },
        summary: {
          en: 'The first handoff stays tentative so the betrayal beat can remain deferred.',
          'zh-CN': '第一次交接保持试探性，让背叛节拍继续延后。',
        },
        unresolvedCount: 2,
      },
      {
        id: 'scene-canal-watch',
        title: { en: 'Canal Watch', 'zh-CN': '运河哨位' },
        statusLabel: { en: 'Queued', 'zh-CN': '排队中' },
        summary: {
          en: 'A watchpoint scene should tighten trust pressure without proving the package owner.',
          'zh-CN': '哨位场景会收紧信任压力，但不会坐实包裹归属。',
        },
        unresolvedCount: 1,
      },
      {
        id: 'scene-dawn-slip',
        title: { en: 'Dawn Slip', 'zh-CN': '黎明滑道' },
        statusLabel: { en: 'Pending', 'zh-CN': '待定' },
        summary: {
          en: 'The slipway exit still needs a cleaner transition between suspicion and motion.',
          'zh-CN': '滑道离场仍需要一个更清晰的怀疑到行动过渡。',
        },
        unresolvedCount: 1,
      },
    ],
    inspector: {
      chapterNotes: {
        en: ['Keep alternate views pointed at the same chapter identity.', 'No dock runtime is introduced in this scaffold.'],
        'zh-CN': ['不同视图仍然指向同一个章节身份。', '这个脚手架不引入运行态底部面板。'],
      },
    },
  },
}

function buildChapterStructureWorkspaceModel(locale: Locale, route: ChapterRouteState): ChapterStructureWorkspaceViewModel {
  const record = chapterRecords[route.chapterId] ?? chapterRecords['chapter-signals-in-rain']
  const scenes = record.scenes.map((scene) => ({
    id: scene.id,
    title: scene.title[locale],
    statusLabel: scene.statusLabel[locale],
    summary: scene.summary[locale],
    unresolvedCount: scene.unresolvedCount,
  }))
  const selectedScene = scenes.find((scene) => scene.id === route.sceneId) ?? scenes[0]
  const unresolvedSummary =
    locale === 'zh-CN'
      ? `${selectedScene ? `${selectedScene.title} 仍有 ${selectedScene.unresolvedCount} 个未决结构信号。` : '当前场景仍有未决结构信号。'}`
      : `${selectedScene ? `${selectedScene.title} still carries ${selectedScene.unresolvedCount} unresolved structure signals.` : 'The current scene still carries unresolved structure signals.'}`

  return {
    chapterId: route.chapterId,
    title: record.title[locale],
    sceneCount: scenes.length,
    unresolvedCount: scenes.reduce((total, scene) => total + scene.unresolvedCount, 0),
    activeView: route.view,
    currentSceneId: selectedScene?.id ?? 'scene-midnight-platform',
    scenes,
    inspector: {
      selectedSceneTitle: selectedScene?.title ?? record.title[locale],
      selectedSceneBrief: selectedScene?.summary ?? '',
      unresolvedSummary,
      chapterNotes: record.inspector.chapterNotes[locale],
    },
  }
}

export function useChapterStructureWorkspaceModel(route: ChapterRouteState) {
  const { locale } = useI18n()

  return buildChapterStructureWorkspaceModel(locale, route)
}

export function ChapterStructureInspectorPlaceholder({ route }: { route: ChapterRouteState }) {
  const { locale, dictionary } = useI18n()
  const model = useChapterStructureWorkspaceModel(route)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PaneHeader title={model.inspector.selectedSceneTitle} description={model.chapterId} />
      <div className="min-h-0 flex-1 space-y-3 overflow-auto p-4">
        <section className="rounded-md border border-line-soft bg-surface-2 p-3">
          <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.chapterScaffold.selectedSceneBrief}</p>
          <p className="mt-2 text-sm leading-6 text-text-muted">{model.inspector.selectedSceneBrief}</p>
        </section>
        <section className="rounded-md border border-line-soft bg-surface-2 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.chapterScaffold.unresolvedSummary}</p>
            <Badge tone={model.unresolvedCount > 0 ? 'warn' : 'success'}>
              {getChapterUnresolvedCountLabel(locale, model.unresolvedCount)}
            </Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-text-muted">{model.inspector.unresolvedSummary}</p>
        </section>
        <section className="rounded-md border border-line-soft bg-surface-2 p-3">
          <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.chapterScaffold.chapterNotes}</p>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-text-muted">
            {model.inspector.chapterNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

export function ChapterStructureWorkspace({ route, onViewChange }: ChapterStructureWorkspaceProps) {
  const { dictionary } = useI18n()
  const model = useChapterStructureWorkspaceModel(route)

  return (
    <ChapterStructureStagePlaceholder
      activeView={route.view}
      labels={{
        sequence: dictionary.app.sequence,
        outliner: dictionary.app.outliner,
        assembly: dictionary.app.assembly,
      }}
      model={model}
      title={dictionary.app.chapterStructure}
      onViewChange={onViewChange}
    />
  )
}
