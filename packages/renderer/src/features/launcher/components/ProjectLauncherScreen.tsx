import { useI18n } from '@/app/i18n'

type ProjectLauncherAction = 'create-real-project' | 'open-demo-project' | 'open-existing-project'

interface ProjectLauncherScreenProps {
  activeAction?: ProjectLauncherAction | null
  errorMessage?: string | null
  onCreateRealProject: () => void | Promise<void>
  onOpenDemoProject: () => void | Promise<void>
  onOpenExistingProject: () => void | Promise<void>
}

export function ProjectLauncherScreen({
  activeAction = null,
  errorMessage = null,
  onCreateRealProject,
  onOpenDemoProject,
  onOpenExistingProject,
}: ProjectLauncherScreenProps) {
  const { dictionary } = useI18n()
  const isBusy = activeAction !== null

  return (
    <main className="min-h-screen bg-app px-6 py-10 text-text-main">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-6 rounded-3xl border border-line-soft bg-surface-1/95 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.18)] lg:grid-cols-[1.3fr_0.9fr]">
          <section className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-soft">
              {dictionary.launcher.eyebrow}
            </p>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-text-main">
                {dictionary.launcher.title}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-text-muted">
                {dictionary.launcher.description}
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => {
                  void onOpenDemoProject()
                }}
                className="rounded-2xl border border-line-strong bg-surface-2 px-4 py-4 text-left transition hover:border-line-stronger hover:bg-surface-3 disabled:cursor-wait disabled:opacity-60"
              >
                <span className="block text-sm font-semibold">{dictionary.launcher.openDemoProject}</span>
                <span className="mt-2 block text-xs leading-6 text-text-muted">{dictionary.launcher.openDemoDescription}</span>
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => {
                  void onCreateRealProject()
                }}
                className="rounded-2xl border border-line-soft bg-surface-1 px-4 py-4 text-left transition hover:border-line-strong hover:bg-surface-2 disabled:cursor-wait disabled:opacity-60"
              >
                <span className="block text-sm font-semibold">{dictionary.launcher.createRealProject}</span>
                <span className="mt-2 block text-xs leading-6 text-text-muted">{dictionary.launcher.createRealDescription}</span>
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => {
                  void onOpenExistingProject()
                }}
                className="rounded-2xl border border-line-soft bg-surface-1 px-4 py-4 text-left transition hover:border-line-strong hover:bg-surface-2 disabled:cursor-wait disabled:opacity-60"
              >
                <span className="block text-sm font-semibold">{dictionary.launcher.openExistingProject}</span>
                <span className="mt-2 block text-xs leading-6 text-text-muted">{dictionary.launcher.openExistingDescription}</span>
              </button>
            </div>
            {errorMessage ? (
              <div
                role="alert"
                className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-text-main"
              >
                <p className="font-medium">{dictionary.launcher.actionFailedTitle}</p>
                <p className="mt-1 text-text-muted">{errorMessage}</p>
              </div>
            ) : null}
          </section>
          <aside className="rounded-3xl border border-line-soft bg-surface-2/85 p-6">
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-text-main">{dictionary.launcher.workspaceTitle}</h2>
              <p className="text-sm leading-7 text-text-muted">{dictionary.launcher.workspaceDescription}</p>
              <div className="rounded-2xl border border-line-soft bg-surface-1 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-soft">
                  {dictionary.launcher.currentStateLabel}
                </p>
                <p className="mt-3 text-sm text-text-main">
                  {isBusy ? dictionary.launcher.loading : dictionary.launcher.idleHint}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
