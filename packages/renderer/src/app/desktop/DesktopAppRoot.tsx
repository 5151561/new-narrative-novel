import { useEffect, useState, type ReactNode } from 'react'

import App from '@/App'
import { AppProviders } from '@/app/providers'
import { ProjectLauncherScreen } from '@/features/launcher/components/ProjectLauncherScreen'

type DesktopLauncherAction = 'create-real-project' | 'open-demo-project' | 'open-existing-project'

interface DesktopBootstrapBridge {
  getCurrentProject?: () => Promise<unknown>
  openDemoProject?: () => Promise<unknown>
  createRealProject?: () => Promise<unknown>
  openExistingProject?: () => Promise<unknown>
}

interface DesktopAppRootProps {
  desktopBridge?: DesktopBootstrapBridge
  renderWorkbench?: () => ReactNode
}

type DesktopAppRootState =
  | { status: 'loading'; activeAction: DesktopLauncherAction | null; errorMessage: string | null }
  | { status: 'launcher'; activeAction: DesktopLauncherAction | null; errorMessage: string | null }
  | { status: 'ready' }

function defaultRenderWorkbench() {
  return (
    <AppProviders>
      <App />
    </AppProviders>
  )
}

function getDesktopBridge(): DesktopBootstrapBridge | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  return window.narrativeDesktop
}

function isCurrentProjectSnapshot(value: unknown) {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as { projectId?: unknown; projectMode?: unknown; projectTitle?: unknown }
  return (
    typeof candidate.projectId === 'string'
    && (candidate.projectMode === 'demo-fixture' || candidate.projectMode === 'real-project')
    && typeof candidate.projectTitle === 'string'
  )
}

export function DesktopAppRoot({
  desktopBridge = getDesktopBridge(),
  renderWorkbench = defaultRenderWorkbench,
}: DesktopAppRootProps) {
  const [state, setState] = useState<DesktopAppRootState>(() => (
    desktopBridge?.getCurrentProject
      ? { activeAction: null, errorMessage: null, status: 'loading' }
      : { status: 'ready' }
  ))

  useEffect(() => {
    let cancelled = false

    if (!desktopBridge?.getCurrentProject) {
      return () => {
        cancelled = true
      }
    }

    void desktopBridge.getCurrentProject()
      .then((currentProject) => {
        if (cancelled) {
          return
        }

        setState(
          isCurrentProjectSnapshot(currentProject)
            ? { status: 'ready' }
            : { activeAction: null, errorMessage: null, status: 'launcher' },
        )
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return
        }

        setState({
          activeAction: null,
          errorMessage: error instanceof Error ? error.message : String(error),
          status: 'launcher',
        })
      })

    return () => {
      cancelled = true
    }
  }, [desktopBridge])

  async function runLauncherAction(
    action: DesktopLauncherAction,
    runner: (() => Promise<unknown>) | undefined,
  ): Promise<void> {
    if (!runner) {
      setState({
        activeAction: null,
        errorMessage: 'Desktop launcher action is unavailable.',
        status: 'launcher',
      })
      return
    }

    setState({
      activeAction: action,
      errorMessage: null,
      status: 'launcher',
    })

    try {
      const result = await runner()
      if (isCurrentProjectSnapshot(result)) {
        setState({ status: 'ready' })
        return
      }

      const refreshedProject = await desktopBridge?.getCurrentProject?.()
      if (isCurrentProjectSnapshot(refreshedProject)) {
        setState({ status: 'ready' })
        return
      }

      setState({
        activeAction: null,
        errorMessage: null,
        status: 'launcher',
      })
    } catch (error) {
      setState({
        activeAction: null,
        errorMessage: error instanceof Error ? error.message : String(error),
        status: 'launcher',
      })
    }
  }

  if (state.status === 'ready') {
    return <>{renderWorkbench()}</>
  }

  return (
    <ProjectLauncherScreen
      activeAction={state.activeAction}
      errorMessage={state.errorMessage}
      onCreateRealProject={() => runLauncherAction('create-real-project', desktopBridge?.createRealProject)}
      onOpenDemoProject={() => runLauncherAction('open-demo-project', desktopBridge?.openDemoProject)}
      onOpenExistingProject={() => runLauncherAction('open-existing-project', desktopBridge?.openExistingProject)}
    />
  )
}
