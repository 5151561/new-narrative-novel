import { useProjectRuntime } from '@/app/project-runtime'
import { Badge } from '@/components/ui/Badge'
import { useWorkbenchRouteState } from '../hooks/useWorkbenchRouteState'
import { useProjectFirstObjectIds } from '../hooks/useProjectFirstObjectIds'

interface ChecklistStep {
  key: string
  label: string
  labelZh: string
  done: boolean
  action?: () => void
  actionLabel?: string
  actionLabelZh?: string
}

interface Props {
  onCreateChapter?: () => void
  onCreateScene?: () => void
}

export function WorkbenchFirstRunChecklist({ onCreateChapter, onCreateScene }: Props) {
  const runtime = useProjectRuntime()
  const { replaceRoute } = useWorkbenchRouteState()
  const { bookId, chapterId, sceneId } = useProjectFirstObjectIds()
  const locale = (typeof window !== 'undefined' && document.documentElement.lang === 'zh-CN') ? 'zh-CN' : 'en' as const

  const isReal = runtime.info?.projectMode === 'real-project'
  if (!isReal) {
    return null
  }

  const hasModelConfig = runtime.info?.modelBindings?.usable === true
  const hasChapter = Boolean(chapterId)
  const hasScene = Boolean(sceneId)

  const steps: ChecklistStep[] = [
    {
      key: 'model',
      label: 'Model configured',
      labelZh: '模型已配置',
      done: hasModelConfig,
      action: () => replaceRoute({ scope: 'scene' }),
      actionLabel: 'Open Model Settings',
      actionLabelZh: '打开模型设置',
    },
    {
      key: 'chapter',
      label: 'Chapter created',
      labelZh: '已创建章节',
      done: hasChapter,
      action: onCreateChapter,
      actionLabel: 'Create Chapter',
      actionLabelZh: '创建章节',
    },
    {
      key: 'scene',
      label: 'Scene created',
      labelZh: '已创建场景',
      done: hasScene,
      action: onCreateScene,
      actionLabel: 'Create Scene',
      actionLabelZh: '创建场景',
    },
  ]

  const allDone = steps.every((s) => s.done)
  if (allDone) {
    return null
  }

  return (
    <div className="rounded-md border border-line-soft bg-surface-1 px-5 py-4">
      <h3 className="text-sm font-medium text-text-main">
        {locale === 'zh-CN' ? '准备就绪' : 'Getting Started'}
      </h3>
      <div className="mt-3 grid gap-2">
        {steps.map((step) => (
          <div key={step.key} className="flex items-center gap-3">
            <Badge tone={step.done ? 'success' : 'neutral'}>
              {step.done ? '✓' : '○'}
            </Badge>
            <span className={`flex-1 text-sm ${step.done ? 'text-text-muted' : 'text-text-main'}`}>
              {locale === 'zh-CN' ? step.labelZh : step.label}
            </span>
            {!step.done && step.action ? (
              <button
                type="button"
                onClick={step.action}
                className="rounded-md border border-line-strong bg-surface-2 px-3 py-1 text-sm font-medium text-text-main hover:bg-surface-1"
              >
                {locale === 'zh-CN' ? step.actionLabelZh : step.actionLabel}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
