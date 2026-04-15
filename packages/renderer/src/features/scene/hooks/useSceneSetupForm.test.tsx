import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { type PropsWithChildren } from 'react'

import { I18nProvider } from '@/app/i18n'
import { createSceneClient } from '@/features/scene/api/scene-client'

import { useSceneSetupForm } from './useSceneSetupForm'

function wrapperFactory() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <I18nProvider>{children}</I18nProvider>
      </QueryClientProvider>
    )
  }
}

describe('useSceneSetupForm', () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it('tracks local draft dirty state and persists save/saveAndRun through the mock client', async () => {
    const client = createSceneClient()
    const wrapper = wrapperFactory()
    const onSaveAndRun = vi.fn()

    const hook = renderHook(
      () =>
        useSceneSetupForm({
          sceneId: 'scene-midnight-platform',
          client,
          onSaveAndRun,
        }),
      { wrapper },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.draft).toBeDefined()
    expect(hook.result.current.draft?.identity.title).toBe('Midnight Platform')
    expect(hook.result.current.isDirty).toBe(false)

    act(() => {
      hook.result.current.updateDraft((current) => ({
        ...current,
        objective: {
          ...current.objective,
          externalGoal: 'Force Mei to hand over the ledger before the bell sounds.',
        },
      }))
    })

    expect(hook.result.current.isDirty).toBe(true)

    await act(async () => {
      await hook.result.current.save()
    })

    expect(hook.result.current.isDirty).toBe(false)

    const savedSetup = await client.getSceneSetup('scene-midnight-platform')
    expect(savedSetup.objective.externalGoal).toBe('Force Mei to hand over the ledger before the bell sounds.')

    act(() => {
      hook.result.current.updateDraft((current) => ({
        ...current,
        runtimePreset: {
          ...current.runtimePreset,
          selectedPresetId: 'runtime-pressure-cooker',
        },
      }))
    })

    await act(async () => {
      await hook.result.current.saveAndRun()
    })

    expect(hook.result.current.isDirty).toBe(false)
    expect(onSaveAndRun).toHaveBeenCalledTimes(1)

    const rerunSetup = await client.getSceneSetup('scene-midnight-platform')
    expect(rerunSetup.runtimePreset.selectedPresetId).toBe('runtime-pressure-cooker')
  })

  it('discards local draft changes back to the last saved setup snapshot', async () => {
    const client = createSceneClient()
    const wrapper = wrapperFactory()

    const hook = renderHook(
      () =>
        useSceneSetupForm({
          sceneId: 'scene-midnight-platform',
          client,
        }),
      { wrapper },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    act(() => {
      hook.result.current.updateDraft((current) => ({
        ...current,
        identity: {
          ...current.identity,
          title: 'Discard Me',
        },
      }))
    })

    expect(hook.result.current.isDirty).toBe(true)
    expect(hook.result.current.draft?.identity.title).toBe('Discard Me')

    act(() => {
      hook.result.current.discardChanges()
    })

    expect(hook.result.current.isDirty).toBe(false)
    expect(hook.result.current.draft?.identity.title).toBe('Midnight Platform')
  })
})
