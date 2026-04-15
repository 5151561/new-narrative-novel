import type { Locale } from '@/app/i18n'
import type { SceneDockTabId } from '../types/scene-view-models'

export const sceneQueryKeys = {
  all: ['scene'] as const,
  runtimeInfo: (locale?: Locale) =>
    locale ? ([...sceneQueryKeys.all, 'runtime-info', locale] as const) : ([...sceneQueryKeys.all, 'runtime-info'] as const),
  workspace: (sceneId: string, locale?: Locale) =>
    locale ? ([...sceneQueryKeys.all, 'workspace', sceneId, locale] as const) : ([...sceneQueryKeys.all, 'workspace', sceneId] as const),
  setup: (sceneId: string, locale?: Locale) =>
    locale ? ([...sceneQueryKeys.all, 'setup', sceneId, locale] as const) : ([...sceneQueryKeys.all, 'setup', sceneId] as const),
  execution: (sceneId: string, locale?: Locale) =>
    locale ? ([...sceneQueryKeys.all, 'execution', sceneId, locale] as const) : ([...sceneQueryKeys.all, 'execution', sceneId] as const),
  prose: (sceneId: string, locale?: Locale) =>
    locale ? ([...sceneQueryKeys.all, 'prose', sceneId, locale] as const) : ([...sceneQueryKeys.all, 'prose', sceneId] as const),
  inspector: (sceneId: string, locale?: Locale) =>
    locale ? ([...sceneQueryKeys.all, 'inspector', sceneId, locale] as const) : ([...sceneQueryKeys.all, 'inspector', sceneId] as const),
  dock: (sceneId: string, locale?: Locale) =>
    locale ? ([...sceneQueryKeys.all, 'dock', sceneId, locale] as const) : ([...sceneQueryKeys.all, 'dock', sceneId] as const),
  dockSummary: (sceneId: string, locale?: Locale) =>
    locale ? ([...sceneQueryKeys.dock(sceneId, locale), 'summary'] as const) : ([...sceneQueryKeys.dock(sceneId), 'summary'] as const),
  dockTab: (sceneId: string, tab: SceneDockTabId, locale?: Locale) =>
    locale ? ([...sceneQueryKeys.dock(sceneId, locale), 'tab', tab] as const) : ([...sceneQueryKeys.dock(sceneId), 'tab', tab] as const),
  patchPreview: (sceneId: string, locale?: Locale) =>
    locale ? ([...sceneQueryKeys.all, 'patchPreview', sceneId, locale] as const) : ([...sceneQueryKeys.all, 'patchPreview', sceneId] as const),
}
