import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID } from '@/features/book/api/book-manuscript-checkpoints'

import {
  type AssetRouteState,
  type BookRouteState,
  type ChapterRouteState,
  type SceneRouteState,
  type WorkbenchRouteState,
} from '../types/workbench-route'
import { readWorkbenchRouteState, useWorkbenchRouteState } from './useWorkbenchRouteState'

const DEFAULT_BOOK_EXPORT_PROFILE_ID = 'export-review-packet'
const DEFAULT_BOOK_EXPERIMENT_BRANCH_ID = 'branch-book-signal-arc-quiet-ending'

function RouteHarness() {
  const { route, replaceRoute, patchBookRoute, patchChapterRoute, patchSceneRoute } = useWorkbenchRouteState()

  return (
    <div>
      <pre data-testid="route">{JSON.stringify(route)}</pre>
      <button
        type="button"
        onClick={() =>
          patchSceneRoute({
            sceneId: 'scene-warehouse-bridge',
            lens: 'draft',
            tab: 'prose',
            proposalId: 'proposal-2',
          } satisfies Partial<SceneRouteState>)
        }
      >
        Scene Draft
      </button>
      <button
        type="button"
        onClick={() =>
          patchSceneRoute({
            sceneId: 'scene-midnight-platform',
            lens: 'orchestrate',
            tab: 'execution',
            proposalId: undefined,
            beatId: undefined,
            modal: undefined,
          } satisfies Partial<SceneRouteState>)
        }
      >
        Scene Default
      </button>
      <button
        type="button"
        onClick={() =>
          patchChapterRoute({
            chapterId: 'chapter-open-water-signals',
            lens: 'structure',
            view: 'assembly',
            sceneId: 'scene-dawn-slip',
          } satisfies Partial<ChapterRouteState>)
        }
      >
        Chapter Assembly
      </button>
      <button
        type="button"
        onClick={() =>
          patchChapterRoute({
            chapterId: 'chapter-open-water-signals',
            lens: 'draft',
            view: 'assembly',
            sceneId: 'scene-dawn-slip',
          } satisfies Partial<ChapterRouteState>)
        }
      >
        Chapter Draft
      </button>
      <button
        type="button"
        onClick={() =>
          patchChapterRoute({
            lens: 'structure',
          } satisfies Partial<ChapterRouteState>)
        }
      >
        Chapter Structure
      </button>
      <button
        type="button"
        onClick={() => replaceRoute({ scope: 'chapter' })}
      >
        Open Chapter
      </button>
      <button
        type="button"
        onClick={() => replaceRoute({ scope: 'scene' })}
      >
        Open Scene
      </button>
      <button
        type="button"
        onClick={() =>
          replaceRoute({
            scope: 'asset',
            assetId: 'asset-ren-voss',
            lens: 'knowledge',
            view: 'relations',
          } satisfies { scope: 'asset' } & Partial<Omit<AssetRouteState, 'scope'>>)
        }
      >
        Asset Relations
      </button>
      <button
        type="button"
        onClick={() =>
          replaceRoute({
            scope: 'asset',
          } satisfies { scope: 'asset' } & Partial<Omit<AssetRouteState, 'scope'>>)
        }
      >
        Open Asset
      </button>
      <button
        type="button"
        onClick={() =>
          patchBookRoute({
            bookId: 'book-signal-arc',
            lens: 'draft',
            draftView: 'read',
            selectedChapterId: 'chapter-open-water-signals',
          } satisfies Partial<BookRouteState>)
        }
      >
        Book Draft
      </button>
      <button
        type="button"
        onClick={() =>
          patchBookRoute({
            bookId: 'book-signal-arc',
            lens: 'draft',
            draftView: 'compare',
            checkpointId: DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
            selectedChapterId: 'chapter-open-water-signals',
          } satisfies Partial<BookRouteState>)
        }
      >
        Book Compare
      </button>
      <button
        type="button"
        onClick={() =>
          patchBookRoute({
            bookId: 'book-signal-arc',
            lens: 'draft',
            draftView: 'export',
            exportProfileId: DEFAULT_BOOK_EXPORT_PROFILE_ID,
            selectedChapterId: 'chapter-open-water-signals',
          } satisfies Partial<BookRouteState>)
        }
      >
        Book Export
      </button>
      <button
        type="button"
        onClick={() =>
          patchBookRoute({
            bookId: 'book-signal-arc',
            lens: 'draft',
            draftView: 'review',
            reviewFilter: 'blockers',
            reviewIssueId: 'issue-export-blocker',
            selectedChapterId: 'chapter-open-water-signals',
          } satisfies Partial<BookRouteState>)
        }
      >
        Book Review
      </button>
      <button
        type="button"
        onClick={() =>
          patchBookRoute({
            bookId: 'book-signal-arc',
            lens: 'draft',
            draftView: 'branch',
            branchId: DEFAULT_BOOK_EXPERIMENT_BRANCH_ID,
            branchBaseline: 'current',
            selectedChapterId: 'chapter-open-water-signals',
          } satisfies Partial<BookRouteState>)
        }
      >
        Book Branch Current
      </button>
      <button
        type="button"
        onClick={() =>
          patchBookRoute({
            bookId: 'book-signal-arc',
            lens: 'draft',
            draftView: 'branch',
            branchId: 'branch-book-signal-arc-high-pressure',
            branchBaseline: 'checkpoint',
            checkpointId: DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
            selectedChapterId: 'chapter-open-water-signals',
          } satisfies Partial<BookRouteState>)
        }
      >
        Book Branch Checkpoint
      </button>
      <button
        type="button"
        onClick={() =>
          patchBookRoute({
            lens: 'draft',
            draftView: 'compare',
            checkpointId: undefined,
          } satisfies Partial<BookRouteState>)
        }
      >
        Book Compare Default Checkpoint
      </button>
      <button
        type="button"
        onClick={() =>
          patchBookRoute({
            lens: 'draft',
            draftView: 'export',
            exportProfileId: undefined,
          } satisfies Partial<BookRouteState>)
        }
      >
        Book Export Default Profile
      </button>
      <button
        type="button"
        onClick={() =>
          patchBookRoute({
            lens: 'draft',
            draftView: 'branch',
            branchId: undefined,
            branchBaseline: undefined,
            checkpointId: undefined,
          } satisfies Partial<BookRouteState>)
        }
      >
        Book Branch Default
      </button>
      <button
        type="button"
        onClick={() =>
          patchBookRoute({
            lens: 'structure',
          } satisfies Partial<BookRouteState>)
        }
      >
        Book Structure
      </button>
      <button
        type="button"
        onClick={() =>
          patchBookRoute({
            bookId: 'book-signal-arc',
            lens: 'structure',
            view: 'signals',
            selectedChapterId: 'chapter-open-water-signals',
          } satisfies Partial<BookRouteState>)
        }
      >
        Book Signals
      </button>
      <button
        type="button"
        onClick={() =>
          replaceRoute({
            scope: 'book',
          } satisfies { scope: 'book' } & Partial<Omit<BookRouteState, 'scope'>>)
        }
      >
        Open Book
      </button>
    </div>
  )
}

function readRoute() {
  return JSON.parse(screen.getByTestId('route').textContent ?? 'null') as WorkbenchRouteState
}

describe('useWorkbenchRouteState', () => {
  it('normalizes chapter deep links and ignores scene-only params while preserving a valid draft lens', () => {
    window.history.replaceState(
      {},
      '',
      '/workbench?scope=chapter&id=chapter-signals-in-rain&lens=draft&view=invalid&sceneId=scene-ticket-window&tab=prose&beatId=beat-bargain&proposalId=proposal-2&modal=export',
    )

    render(<RouteHarness />)

    expect(readRoute()).toEqual({
      scope: 'chapter',
      chapterId: 'chapter-signals-in-rain',
      lens: 'draft',
      view: 'sequence',
      sceneId: 'scene-ticket-window',
    })
  })

  it('keeps scene and chapter params isolated while preserving both scope states across switches', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=scene&id=scene-midnight-platform&lens=draft&tab=prose&proposalId=proposal-2&chapterId=chapter-open-water-signals&chapterView=assembly',
    )

    render(<RouteHarness />)

    expect(readRoute()).toEqual({
      scope: 'scene',
      sceneId: 'scene-midnight-platform',
      lens: 'draft',
      tab: 'prose',
      proposalId: 'proposal-2',
    })

    await user.click(screen.getByRole('button', { name: 'Chapter Assembly' }))

    expect(readRoute()).toEqual({
      scope: 'scene',
      sceneId: 'scene-midnight-platform',
      lens: 'draft',
      tab: 'prose',
      proposalId: 'proposal-2',
    })

    await user.click(screen.getByRole('button', { name: 'Open Chapter' }))

    expect(readRoute()).toEqual({
      scope: 'chapter',
      chapterId: 'chapter-open-water-signals',
      lens: 'structure',
      view: 'assembly',
      sceneId: 'scene-dawn-slip',
    })

    let params = new URLSearchParams(window.location.search)
    expect(params.get('scope')).toBe('chapter')
    expect(params.get('id')).toBe('chapter-open-water-signals')
    expect(params.get('lens')).toBe('structure')
    expect(params.get('view')).toBe('assembly')
    expect(params.get('sceneId')).toBe('scene-dawn-slip')
    expect(params.get('tab')).toBeNull()
    expect(params.get('proposalId')).toBeNull()
    expect(params.get('sceneLens')).toBeNull()
    expect(params.get('sceneTab')).toBeNull()
    expect(params.get('sceneProposalId')).toBeNull()
    expect(params.get('chapterId')).toBeNull()
    expect(params.get('chapterView')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Open Scene' }))

    expect(readRoute()).toEqual({
      scope: 'scene',
      sceneId: 'scene-midnight-platform',
      lens: 'draft',
      tab: 'prose',
      proposalId: 'proposal-2',
    })

    params = new URLSearchParams(window.location.search)
    expect(params.get('scope')).toBe('scene')
    expect(params.get('id')).toBe('scene-midnight-platform')
    expect(params.get('lens')).toBe('draft')
    expect(params.get('tab')).toBe('prose')
    expect(params.get('proposalId')).toBe('proposal-2')
    expect(params.get('view')).toBeNull()
    expect(params.get('chapterId')).toBeNull()
    expect(params.get('chapterView')).toBeNull()
  })

  it('writes and restores the chapter draft lens while preserving the dormant structure view', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=chapter&id=chapter-signals-in-rain&lens=structure&view=outliner&sceneId=scene-midnight-platform',
    )

    render(<RouteHarness />)

    await user.click(screen.getByRole('button', { name: 'Chapter Draft' }))

    expect(readRoute()).toEqual({
      scope: 'chapter',
      chapterId: 'chapter-open-water-signals',
      lens: 'draft',
      view: 'assembly',
      sceneId: 'scene-dawn-slip',
    })

    let params = new URLSearchParams(window.location.search)
    expect(params.get('scope')).toBe('chapter')
    expect(params.get('id')).toBe('chapter-open-water-signals')
    expect(params.get('lens')).toBe('draft')
    expect(params.get('view')).toBe('assembly')
    expect(params.get('sceneId')).toBe('scene-dawn-slip')

    await user.click(screen.getByRole('button', { name: 'Chapter Structure' }))

    expect(readRoute()).toEqual({
      scope: 'chapter',
      chapterId: 'chapter-open-water-signals',
      lens: 'structure',
      view: 'assembly',
      sceneId: 'scene-dawn-slip',
    })

    params = new URLSearchParams(window.location.search)
    expect(params.get('lens')).toBe('structure')
    expect(params.get('view')).toBe('assembly')
    expect(params.get('sceneId')).toBe('scene-dawn-slip')
  })

  it('normalizes asset deep links and defaults invalid asset params to the knowledge profile view', () => {
    window.history.replaceState(
      {},
      '',
      '/workbench?scope=asset&id=asset-ren-voss&lens=invalid&view=mentions&tab=prose&proposalId=proposal-2',
    )

    render(<RouteHarness />)

    expect(readRoute()).toEqual({
      scope: 'asset',
      assetId: 'asset-ren-voss',
      lens: 'knowledge',
      view: 'mentions',
    })
  })

  it('preserves the dormant asset snapshot when switching away and back through other scopes', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=scene&id=scene-midnight-platform&lens=draft&tab=prose&proposalId=proposal-2',
    )

    render(<RouteHarness />)

    await user.click(screen.getByRole('button', { name: 'Chapter Assembly' }))

    await user.click(screen.getByRole('button', { name: 'Asset Relations' }))

    expect(readRoute()).toEqual({
      scope: 'asset',
      assetId: 'asset-ren-voss',
      lens: 'knowledge',
      view: 'relations',
    })

    let params = new URLSearchParams(window.location.search)
    expect(params.get('scope')).toBe('asset')
    expect(params.get('id')).toBe('asset-ren-voss')
    expect(params.get('lens')).toBe('knowledge')
    expect(params.get('view')).toBe('relations')
    expect(params.get('tab')).toBeNull()
    expect(params.get('proposalId')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Open Chapter' }))

    expect(readRoute()).toEqual({
      scope: 'chapter',
      chapterId: 'chapter-open-water-signals',
      lens: 'structure',
      view: 'assembly',
      sceneId: 'scene-dawn-slip',
    })

    await user.click(screen.getByRole('button', { name: 'Open Asset' }))

    expect(readRoute()).toEqual({
      scope: 'asset',
      assetId: 'asset-ren-voss',
      lens: 'knowledge',
      view: 'relations',
    })

    params = new URLSearchParams(window.location.search)
    expect(params.get('scope')).toBe('asset')
    expect(params.get('id')).toBe('asset-ren-voss')
    expect(params.get('lens')).toBe('knowledge')
    expect(params.get('view')).toBe('relations')

    await user.click(screen.getByRole('button', { name: 'Open Scene' }))

    expect(readRoute()).toEqual({
      scope: 'scene',
      sceneId: 'scene-midnight-platform',
      lens: 'draft',
      tab: 'prose',
      proposalId: 'proposal-2',
    })
  })

  it('normalizes book deep links and ignores non-book params while keeping selectedChapterId', () => {
    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=invalid&view=signals&selectedChapterId=chapter-open-water-signals&tab=prose&proposalId=proposal-2',
    )

    render(<RouteHarness />)

    expect(readRoute()).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'structure',
      view: 'signals',
      selectedChapterId: 'chapter-open-water-signals',
    })
  })

  it('accepts the book draft lens in deep links while preserving the dormant structure view', () => {
    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=read&selectedChapterId=chapter-open-water-signals&tab=prose&proposalId=proposal-2',
    )

    render(<RouteHarness />)

    expect(readRoute()).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'draft',
      view: 'signals',
      draftView: 'read',
      selectedChapterId: 'chapter-open-water-signals',
    })
  })

  it('reads export draft links while preserving dormant structure view and export profile id', () => {
    window.history.replaceState(
      {},
      '',
      `/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=export&exportProfileId=${DEFAULT_BOOK_EXPORT_PROFILE_ID}&selectedChapterId=chapter-open-water-signals`,
    )

    render(<RouteHarness />)

    expect(readRoute()).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'draft',
      view: 'signals',
      draftView: 'export',
      exportProfileId: DEFAULT_BOOK_EXPORT_PROFILE_ID,
      selectedChapterId: 'chapter-open-water-signals',
    })
  })

  it('reads review draft links with reviewFilter and reviewIssueId while preserving dormant structure view', () => {
    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=review&reviewFilter=trace-gaps&reviewIssueId=issue-trace-gap&selectedChapterId=chapter-open-water-signals',
    )

    render(<RouteHarness />)

    expect(readRoute()).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'draft',
      view: 'signals',
      draftView: 'review',
      reviewFilter: 'trace-gaps',
      reviewIssueId: 'issue-trace-gap',
      selectedChapterId: 'chapter-open-water-signals',
    })
  })

  it('reads branch draft links with branchId and current baseline while retaining structure view state', () => {
    window.history.replaceState(
      {},
      '',
      `/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=branch&branchId=${DEFAULT_BOOK_EXPERIMENT_BRANCH_ID}&branchBaseline=current&selectedChapterId=chapter-open-water-signals`,
    )

    render(<RouteHarness />)

    expect(readRoute()).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'draft',
      view: 'signals',
      draftView: 'branch',
      branchId: DEFAULT_BOOK_EXPERIMENT_BRANCH_ID,
      branchBaseline: 'current',
      selectedChapterId: 'chapter-open-water-signals',
    })
  })

  it('reads branch draft checkpoint links and falls back the checkpoint id when missing', () => {
    expect(
      readWorkbenchRouteState(
        '?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=branch&branchId=branch-book-signal-arc-high-pressure&branchBaseline=checkpoint',
      ),
    ).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'draft',
      view: 'signals',
      draftView: 'branch',
      branchId: 'branch-book-signal-arc-high-pressure',
      branchBaseline: 'checkpoint',
      checkpointId: DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
    })
  })

  it('writes and restores the book draft lens while keeping the dormant structure view stable', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=structure&view=signals&selectedChapterId=chapter-signals-in-rain',
    )

    render(<RouteHarness />)

    await user.click(screen.getByRole('button', { name: 'Book Draft' }))

    expect(readRoute()).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'draft',
      view: 'signals',
      draftView: 'read',
      selectedChapterId: 'chapter-open-water-signals',
    })

    let params = new URLSearchParams(window.location.search)
    expect(params.get('scope')).toBe('book')
    expect(params.get('id')).toBe('book-signal-arc')
    expect(params.get('lens')).toBe('draft')
    expect(params.get('view')).toBe('signals')
    expect(params.get('draftView')).toBe('read')
    expect(params.get('selectedChapterId')).toBe('chapter-open-water-signals')

    await user.click(screen.getByRole('button', { name: 'Book Structure' }))

    expect(readRoute()).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'structure',
      view: 'signals',
      draftView: 'read',
      selectedChapterId: 'chapter-open-water-signals',
    })

    params = new URLSearchParams(window.location.search)
    expect(params.get('lens')).toBe('structure')
    expect(params.get('view')).toBe('signals')
    expect(params.get('draftView')).toBe('read')
    expect(params.get('selectedChapterId')).toBe('chapter-open-water-signals')
  })

  it('writes and restores book compare draftView with checkpointId while preserving dormant structure view', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=structure&view=outliner&selectedChapterId=chapter-signals-in-rain',
    )

    render(<RouteHarness />)

    await user.click(screen.getByRole('button', { name: 'Book Compare' }))

    expect(readRoute()).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'draft',
      view: 'outliner',
      draftView: 'compare',
      checkpointId: DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
      selectedChapterId: 'chapter-open-water-signals',
    })

    let params = new URLSearchParams(window.location.search)
    expect(params.get('draftView')).toBe('compare')
    expect(params.get('checkpointId')).toBe(DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID)
    expect(params.get('view')).toBe('outliner')

    await user.click(screen.getByRole('button', { name: 'Book Structure' }))

    expect(readRoute()).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'structure',
      view: 'outliner',
      draftView: 'compare',
      checkpointId: DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
      selectedChapterId: 'chapter-open-water-signals',
    })

    params = new URLSearchParams(window.location.search)
    expect(params.get('lens')).toBe('structure')
    expect(params.get('draftView')).toBe('compare')
    expect(params.get('checkpointId')).toBe(DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID)
  })

  it('writes and restores book export draftView with exportProfileId while preserving dormant compare checkpoint', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      `/workbench?scope=book&id=book-signal-arc&lens=structure&view=outliner&draftView=compare&checkpointId=${DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID}&selectedChapterId=chapter-signals-in-rain`,
    )

    render(<RouteHarness />)

    await user.click(screen.getByRole('button', { name: 'Book Export' }))

    expect(readRoute()).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'draft',
      view: 'outliner',
      draftView: 'export',
      checkpointId: DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
      exportProfileId: DEFAULT_BOOK_EXPORT_PROFILE_ID,
      selectedChapterId: 'chapter-open-water-signals',
    })

    let params = new URLSearchParams(window.location.search)
    expect(params.get('draftView')).toBe('export')
    expect(params.get('exportProfileId')).toBe(DEFAULT_BOOK_EXPORT_PROFILE_ID)
    expect(params.get('checkpointId')).toBe(DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID)
    expect(params.get('view')).toBe('outliner')

    await user.click(screen.getByRole('button', { name: 'Book Structure' }))

    expect(readRoute()).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'structure',
      view: 'outliner',
      draftView: 'export',
      checkpointId: DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
      exportProfileId: DEFAULT_BOOK_EXPORT_PROFILE_ID,
      selectedChapterId: 'chapter-open-water-signals',
    })

    params = new URLSearchParams(window.location.search)
    expect(params.get('lens')).toBe('structure')
    expect(params.get('draftView')).toBe('export')
    expect(params.get('exportProfileId')).toBe(DEFAULT_BOOK_EXPORT_PROFILE_ID)
    expect(params.get('checkpointId')).toBe(DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID)
  })

  it('writes and restores book review draftView with reviewFilter and reviewIssueId while preserving the dormant structure view', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=structure&view=outliner&selectedChapterId=chapter-signals-in-rain',
    )

    render(<RouteHarness />)

    await user.click(screen.getByRole('button', { name: 'Book Review' }))

    expect(readRoute()).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'draft',
      view: 'outliner',
      draftView: 'review',
      reviewFilter: 'blockers',
      reviewIssueId: 'issue-export-blocker',
      selectedChapterId: 'chapter-open-water-signals',
    })

    let params = new URLSearchParams(window.location.search)
    expect(params.get('draftView')).toBe('review')
    expect(params.get('reviewFilter')).toBe('blockers')
    expect(params.get('reviewIssueId')).toBe('issue-export-blocker')
    expect(params.get('view')).toBe('outliner')

    await user.click(screen.getByRole('button', { name: 'Book Structure' }))

    expect(readRoute()).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'structure',
      view: 'outliner',
      draftView: 'review',
      reviewFilter: 'blockers',
      reviewIssueId: 'issue-export-blocker',
      selectedChapterId: 'chapter-open-water-signals',
    })

    params = new URLSearchParams(window.location.search)
    expect(params.get('lens')).toBe('structure')
    expect(params.get('view')).toBe('outliner')
    expect(params.get('draftView')).toBe('review')
    expect(params.get('reviewFilter')).toBe('blockers')
    expect(params.get('reviewIssueId')).toBe('issue-export-blocker')
  })

  it('writes and restores book branch draftView with current baseline while keeping structure view stable', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=structure&view=signals&selectedChapterId=chapter-signals-in-rain',
    )

    render(<RouteHarness />)

    await user.click(screen.getByRole('button', { name: 'Book Branch Current' }))

    expect(readRoute()).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'draft',
      view: 'signals',
      draftView: 'branch',
      branchId: DEFAULT_BOOK_EXPERIMENT_BRANCH_ID,
      branchBaseline: 'current',
      selectedChapterId: 'chapter-open-water-signals',
    })

    let params = new URLSearchParams(window.location.search)
    expect(params.get('draftView')).toBe('branch')
    expect(params.get('branchId')).toBe(DEFAULT_BOOK_EXPERIMENT_BRANCH_ID)
    expect(params.get('branchBaseline')).toBe('current')
    expect(params.get('view')).toBe('signals')

    await user.click(screen.getByRole('button', { name: 'Book Structure' }))

    expect(readRoute()).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'structure',
      view: 'signals',
      draftView: 'branch',
      branchId: DEFAULT_BOOK_EXPERIMENT_BRANCH_ID,
      branchBaseline: 'current',
      selectedChapterId: 'chapter-open-water-signals',
    })

    params = new URLSearchParams(window.location.search)
    expect(params.get('lens')).toBe('structure')
    expect(params.get('view')).toBe('signals')
    expect(params.get('draftView')).toBe('branch')
    expect(params.get('branchId')).toBe(DEFAULT_BOOK_EXPERIMENT_BRANCH_ID)
    expect(params.get('branchBaseline')).toBe('current')
  })

  it('writes and restores book branch checkpoint baseline while preserving compare checkpoint semantics', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      `/workbench?scope=book&id=book-signal-arc&lens=draft&view=outliner&draftView=export&exportProfileId=${DEFAULT_BOOK_EXPORT_PROFILE_ID}&selectedChapterId=chapter-signals-in-rain`,
    )

    render(<RouteHarness />)

    await user.click(screen.getByRole('button', { name: 'Book Branch Checkpoint' }))

    expect(readRoute()).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'draft',
      view: 'outliner',
      draftView: 'branch',
      branchId: 'branch-book-signal-arc-high-pressure',
      branchBaseline: 'checkpoint',
      checkpointId: DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
      exportProfileId: DEFAULT_BOOK_EXPORT_PROFILE_ID,
      selectedChapterId: 'chapter-open-water-signals',
    })

    let params = new URLSearchParams(window.location.search)
    expect(params.get('draftView')).toBe('branch')
    expect(params.get('branchId')).toBe('branch-book-signal-arc-high-pressure')
    expect(params.get('branchBaseline')).toBe('checkpoint')
    expect(params.get('checkpointId')).toBe(DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID)
    expect(params.get('exportProfileId')).toBe(DEFAULT_BOOK_EXPORT_PROFILE_ID)
    expect(params.get('view')).toBe('outliner')

    await user.click(screen.getByRole('button', { name: 'Book Structure' }))

    expect(readRoute()).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'structure',
      view: 'outliner',
      draftView: 'branch',
      branchId: 'branch-book-signal-arc-high-pressure',
      branchBaseline: 'checkpoint',
      checkpointId: DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
      exportProfileId: DEFAULT_BOOK_EXPORT_PROFILE_ID,
      selectedChapterId: 'chapter-open-water-signals',
    })

    params = new URLSearchParams(window.location.search)
    expect(params.get('lens')).toBe('structure')
    expect(params.get('draftView')).toBe('branch')
    expect(params.get('branchId')).toBe('branch-book-signal-arc-high-pressure')
    expect(params.get('branchBaseline')).toBe('checkpoint')
    expect(params.get('checkpointId')).toBe(DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID)
  })

  it('keeps dormant checkpoint export and branch state intact when switching into review draftView', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      `/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=branch&branchId=${DEFAULT_BOOK_EXPERIMENT_BRANCH_ID}&branchBaseline=checkpoint&checkpointId=${DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID}&exportProfileId=${DEFAULT_BOOK_EXPORT_PROFILE_ID}&selectedChapterId=chapter-signals-in-rain`,
    )

    render(<RouteHarness />)

    await user.click(screen.getByRole('button', { name: 'Book Review' }))

    expect(readRoute()).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'draft',
      view: 'signals',
      draftView: 'review',
      reviewFilter: 'blockers',
      reviewIssueId: 'issue-export-blocker',
      branchId: DEFAULT_BOOK_EXPERIMENT_BRANCH_ID,
      branchBaseline: 'checkpoint',
      checkpointId: DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
      exportProfileId: DEFAULT_BOOK_EXPORT_PROFILE_ID,
      selectedChapterId: 'chapter-open-water-signals',
    })

    const params = new URLSearchParams(window.location.search)
    expect(params.get('draftView')).toBe('review')
    expect(params.get('reviewFilter')).toBe('blockers')
    expect(params.get('reviewIssueId')).toBe('issue-export-blocker')
    expect(params.get('branchId')).toBe(DEFAULT_BOOK_EXPERIMENT_BRANCH_ID)
    expect(params.get('branchBaseline')).toBe('checkpoint')
    expect(params.get('checkpointId')).toBe(DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID)
    expect(params.get('exportProfileId')).toBe(DEFAULT_BOOK_EXPORT_PROFILE_ID)
  })

  it('falls back missing draftView to read and missing compare checkpointId to the default checkpoint id', () => {
    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals',
    )

    render(<RouteHarness />)

    expect(readRoute()).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'draft',
      view: 'signals',
      draftView: 'read',
    })

    expect(
      readWorkbenchRouteState(
        '?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=compare',
      ),
    ).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'draft',
      view: 'signals',
      draftView: 'compare',
      checkpointId: DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
    })

    expect(
      readWorkbenchRouteState(
        '?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=export',
      ),
    ).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'draft',
      view: 'signals',
      draftView: 'export',
      exportProfileId: DEFAULT_BOOK_EXPORT_PROFILE_ID,
    })

    expect(
      readWorkbenchRouteState(
        '?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=branch',
      ),
    ).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'draft',
      view: 'signals',
      draftView: 'branch',
      branchId: DEFAULT_BOOK_EXPERIMENT_BRANCH_ID,
      branchBaseline: 'current',
    })

    expect(
      readWorkbenchRouteState(
        '?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=branch&branchBaseline=checkpoint',
      ),
    ).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'draft',
      view: 'signals',
      draftView: 'branch',
      branchId: DEFAULT_BOOK_EXPERIMENT_BRANCH_ID,
      branchBaseline: 'checkpoint',
      checkpointId: DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
    })
  })

  it('keeps dormant draftView and checkpointId from breaking book structure mode', () => {
    window.history.replaceState(
      {},
      '',
      `/workbench?scope=book&id=book-signal-arc&lens=structure&view=signals&draftView=compare&checkpointId=${DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID}&selectedChapterId=chapter-signals-in-rain`,
    )

    render(<RouteHarness />)

    expect(readRoute()).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'structure',
      view: 'signals',
      draftView: 'compare',
      checkpointId: DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
      selectedChapterId: 'chapter-signals-in-rain',
    })
  })

  it('keeps dormant exportProfileId and compare checkpoint state intact in structure mode', () => {
    window.history.replaceState(
      {},
      '',
      `/workbench?scope=book&id=book-signal-arc&lens=structure&view=signals&draftView=export&checkpointId=${DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID}&exportProfileId=${DEFAULT_BOOK_EXPORT_PROFILE_ID}&selectedChapterId=chapter-signals-in-rain`,
    )

    render(<RouteHarness />)

    expect(readRoute()).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'structure',
      view: 'signals',
      draftView: 'export',
      checkpointId: DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
      exportProfileId: DEFAULT_BOOK_EXPORT_PROFILE_ID,
      selectedChapterId: 'chapter-signals-in-rain',
    })
  })

  it('keeps dormant branchId and branchBaseline intact in structure mode without changing the structure view', () => {
    window.history.replaceState(
      {},
      '',
      `/workbench?scope=book&id=book-signal-arc&lens=structure&view=signals&draftView=branch&branchId=${DEFAULT_BOOK_EXPERIMENT_BRANCH_ID}&branchBaseline=checkpoint&checkpointId=${DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID}&selectedChapterId=chapter-signals-in-rain`,
    )

    render(<RouteHarness />)

    expect(readRoute()).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'structure',
      view: 'signals',
      draftView: 'branch',
      branchId: DEFAULT_BOOK_EXPERIMENT_BRANCH_ID,
      branchBaseline: 'checkpoint',
      checkpointId: DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
      selectedChapterId: 'chapter-signals-in-rain',
    })
  })

  it('falls back reviewFilter to all when the review draftView deep link omits it', () => {
    expect(
      readWorkbenchRouteState(
        '?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=review&reviewIssueId=issue-trace-gap',
      ),
    ).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'draft',
      view: 'signals',
      draftView: 'review',
      reviewFilter: 'all',
      reviewIssueId: 'issue-trace-gap',
    })
  })

  it('preserves the dormant book snapshot when switching away and restores it after returning', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=structure&view=outliner&selectedChapterId=chapter-signals-in-rain',
    )

    render(<RouteHarness />)

    expect(readRoute()).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'structure',
      view: 'outliner',
      selectedChapterId: 'chapter-signals-in-rain',
    })

    await user.click(screen.getByRole('button', { name: 'Scene Default' }))
    await user.click(screen.getByRole('button', { name: 'Chapter Assembly' }))
    await user.click(screen.getByRole('button', { name: 'Open Scene' }))

    expect(readRoute()).toEqual({
      scope: 'scene',
      sceneId: 'scene-midnight-platform',
      lens: 'orchestrate',
      tab: 'execution',
    })

    await user.click(screen.getByRole('button', { name: 'Open Book' }))

    expect(readRoute()).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'structure',
      view: 'outliner',
      selectedChapterId: 'chapter-signals-in-rain',
    })

    let params = new URLSearchParams(window.location.search)
    expect(params.get('scope')).toBe('book')
    expect(params.get('id')).toBe('book-signal-arc')
    expect(params.get('lens')).toBe('structure')
    expect(params.get('view')).toBe('outliner')
    expect(params.get('selectedChapterId')).toBe('chapter-signals-in-rain')
    expect(params.get('tab')).toBeNull()
    expect(params.get('proposalId')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Book Signals' }))

    expect(readRoute()).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'structure',
      view: 'signals',
      selectedChapterId: 'chapter-open-water-signals',
    })

    params = new URLSearchParams(window.location.search)
    expect(params.get('scope')).toBe('book')
    expect(params.get('id')).toBe('book-signal-arc')
    expect(params.get('lens')).toBe('structure')
    expect(params.get('view')).toBe('signals')
    expect(params.get('selectedChapterId')).toBe('chapter-open-water-signals')

    await user.click(screen.getByRole('button', { name: 'Open Chapter' }))
    await user.click(screen.getByRole('button', { name: 'Open Book' }))

    expect(readRoute()).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'structure',
      view: 'signals',
      selectedChapterId: 'chapter-open-water-signals',
    })
  })

  it('keeps scene chapter and asset dormant snapshots stable while book switches between structure and draft', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=scene&id=scene-midnight-platform&lens=draft&tab=prose&proposalId=proposal-2',
    )

    render(<RouteHarness />)

    await user.click(screen.getByRole('button', { name: 'Chapter Assembly' }))
    await user.click(screen.getByRole('button', { name: 'Asset Relations' }))
    await user.click(screen.getByRole('button', { name: 'Book Signals' }))
    await user.click(screen.getByRole('button', { name: 'Book Review' }))
    await user.click(screen.getByRole('button', { name: 'Book Structure' }))

    await user.click(screen.getByRole('button', { name: 'Open Scene' }))
    expect(readRoute()).toEqual({
      scope: 'scene',
      sceneId: 'scene-midnight-platform',
      lens: 'draft',
      tab: 'prose',
      proposalId: 'proposal-2',
    })

    await user.click(screen.getByRole('button', { name: 'Open Chapter' }))
    expect(readRoute()).toEqual({
      scope: 'chapter',
      chapterId: 'chapter-open-water-signals',
      lens: 'structure',
      view: 'assembly',
      sceneId: 'scene-dawn-slip',
    })

    await user.click(screen.getByRole('button', { name: 'Open Asset' }))
    expect(readRoute()).toEqual({
      scope: 'asset',
      assetId: 'asset-ren-voss',
      lens: 'knowledge',
      view: 'relations',
    })

    await user.click(screen.getByRole('button', { name: 'Open Book' }))
    expect(readRoute()).toEqual({
      scope: 'book',
      bookId: 'book-signal-arc',
      lens: 'structure',
      view: 'signals',
      draftView: 'review',
      reviewFilter: 'blockers',
      reviewIssueId: 'issue-export-blocker',
      selectedChapterId: 'chapter-open-water-signals',
    })
  })
})
