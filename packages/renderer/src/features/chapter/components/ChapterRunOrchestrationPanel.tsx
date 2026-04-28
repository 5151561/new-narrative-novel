import { Badge } from '@/components/ui/Badge'
import { useI18n } from '@/app/i18n'

interface ChapterRunOrchestrationPanelProps {
  title: string
  description: string
  nextScene?: {
    sceneId: string
    title: string
    order: number
    summary: string
    backlogStatusLabel: string
    runStatusLabel: string
  }
  waitingReviewScenes: Array<{
    sceneId: string
    title: string
    order: number
    backlogStatus: 'running' | 'needs_review'
    runStatusLabel: string
  }>
  draftedSceneCount: number
  missingDraftCount: number
  isStarting?: boolean
  errorMessage?: string
  onStartNextScene?: () => void
}

export function ChapterRunOrchestrationPanel({
  title,
  description,
  nextScene,
  waitingReviewScenes,
  draftedSceneCount,
  missingDraftCount,
  isStarting = false,
  errorMessage,
  onStartNextScene,
}: ChapterRunOrchestrationPanelProps) {
  const { locale } = useI18n()
  const hasBlockingScenes = waitingReviewScenes.length > 0
  const hasRunningScene = waitingReviewScenes.some((scene) => scene.backlogStatus === 'running')
  const isComplete = !hasBlockingScenes && !nextScene
  const buttonLabel = hasBlockingScenes
    ? hasRunningScene
      ? (locale === 'zh-CN' ? '场景运行中' : 'Scene running')
      : (locale === 'zh-CN' ? '等待 Review' : 'Review pending')
    : isComplete
      ? (locale === 'zh-CN' ? '章节运行已完成' : 'Chapter run complete')
      : (locale === 'zh-CN' ? '启动下一场运行' : 'Start next scene run')

  return (
    <section className="rounded-lg border border-line-strong bg-surface-1 px-4 py-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-text-main">{title}</h2>
            <Badge tone="neutral">{locale === 'zh-CN' ? `已起草 ${draftedSceneCount}` : `Drafted ${draftedSceneCount}`}</Badge>
            <Badge tone={missingDraftCount > 0 ? 'warn' : 'success'}>
              {locale === 'zh-CN' ? `缺稿 ${missingDraftCount}` : `Missing ${missingDraftCount}`}
            </Badge>
            <Badge tone={hasBlockingScenes ? 'accent' : 'neutral'}>
              {hasRunningScene
                ? (locale === 'zh-CN' ? `运行中 ${waitingReviewScenes.length}` : `Running ${waitingReviewScenes.length}`)
                : (locale === 'zh-CN' ? `等待 Review ${waitingReviewScenes.length}` : `Waiting review ${waitingReviewScenes.length}`)}
            </Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-text-muted">{description}</p>
          {nextScene ? (
            <div className="mt-3 rounded-md border border-line-soft bg-surface-2 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                {locale === 'zh-CN' ? `下一场 · Scene ${nextScene.order}` : `Next scene · Scene ${nextScene.order}`}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-text-main">{nextScene.title}</p>
                <Badge tone="neutral">{nextScene.backlogStatusLabel}</Badge>
                <Badge tone="neutral">{nextScene.runStatusLabel}</Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-text-muted">{nextScene.summary}</p>
            </div>
          ) : null}
          {waitingReviewScenes.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {waitingReviewScenes.map((scene) => (
                <li key={scene.sceneId} className="rounded-md border border-line-soft bg-surface-2 px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-text-main">
                      {locale === 'zh-CN' ? `Scene ${scene.order} · ${scene.title}` : `Scene ${scene.order} · ${scene.title}`}
                    </span>
                    <Badge tone={scene.backlogStatus === 'running' ? 'neutral' : 'accent'}>{scene.runStatusLabel}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
          {errorMessage ? (
            <p className="mt-3 text-sm text-status-danger">{errorMessage}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onStartNextScene}
          disabled={hasBlockingScenes || isComplete || isStarting}
          className="min-w-[180px] rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isStarting ? (locale === 'zh-CN' ? '正在启动…' : 'Starting...') : buttonLabel}
        </button>
      </div>
    </section>
  )
}
