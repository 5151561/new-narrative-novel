import { useI18n } from '@/app/i18n'

interface SceneExportSheetProps {
  sceneTitle: string
  currentVersionLabel?: string
  onClose: () => void
}

export function SceneExportSheet({ sceneTitle, currentVersionLabel, onClose }: SceneExportSheetProps) {
  const { locale } = useI18n()

  return (
    <div className="absolute inset-0 z-10 flex items-start justify-end bg-app/70 p-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="scene-export-title"
        className="w-full max-w-md rounded-md border border-line-soft bg-surface-1 shadow-ringwarm"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line-soft px-4 py-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.05em] text-text-soft">{locale === 'zh-CN' ? '导出' : 'Export'}</p>
            <h3 id="scene-export-title" className="text-lg leading-tight">
              {locale === 'zh-CN' ? '导出场景工作区' : 'Export scene workspace'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm"
          >
            {locale === 'zh-CN' ? '关闭' : 'Close'}
          </button>
        </div>
        <div className="space-y-4 px-4 py-4 text-sm leading-6 text-text-muted">
          <p>{sceneTitle}</p>
          <p>
            {currentVersionLabel
              ? locale === 'zh-CN'
                ? `已准备把 ${currentVersionLabel} 导出为场景包或正文交接稿。`
                : `Ready to export ${currentVersionLabel} as scene package or prose handoff.`
              : locale === 'zh-CN'
                ? '已准备导出当前场景包。'
                : 'Ready to export the current scene package.'}
          </p>
          <div className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
            <p className="font-medium text-text-main">{locale === 'zh-CN' ? '本次导出包含' : 'Included in this export'}</p>
            <ul className="mt-2 space-y-1">
              <li>{locale === 'zh-CN' ? '场景摘要与已采纳事实' : 'Scene summary and accepted facts'}</li>
              <li>{locale === 'zh-CN' ? '版本检查点与补丁候选' : 'Version checkpoints and patch candidates'}</li>
              <li>{locale === 'zh-CN' ? '当前正文草稿与线程选择' : 'Current prose draft and thread selection'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
