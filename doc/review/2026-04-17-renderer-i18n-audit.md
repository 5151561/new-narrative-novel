# Renderer Internationalization Audit

Date: 2026-04-17
Scope: `packages/renderer` i18n coverage, with emphasis on Storybook preview behavior and chapter/scene workbench surfaces
Verdict: Not ready for i18n sign-off

## Summary

The renderer already has a working locale layer in [`packages/renderer/src/app/i18n/index.tsx`](/Users/changlepan/new-narrative-novel/packages/renderer/src/app/i18n/index.tsx) and the scene Storybook path is partly wired through [`packages/renderer/src/features/scene/containers/scene-storybook.tsx`](/Users/changlepan/new-narrative-novel/packages/renderer/src/features/scene/containers/scene-storybook.tsx). The main gap is not "no i18n exists"; it is that Storybook preview is still environment-driven and a large slice of chapter stories is fed by English-only fixture content.

Using MCP structured snapshots, the chapter draft workspace story rendered with Chinese chrome but English content in the same canvas, which matches the user's complaint that Storybook preview still reads as English-heavy.

## Findings

### 1. Storybook has no global locale wiring or locale control

Severity: Important

[`packages/renderer/.storybook/preview.ts`](/Users/changlepan/new-narrative-novel/packages/renderer/.storybook/preview.ts) only defines layout/background parameters and does not provide a global `AppProviders`/`I18nProvider` decorator or a locale toolbar. Meanwhile, locale resolution falls back to browser/storage state in [`packages/renderer/src/app/i18n/index.tsx:20`](/Users/changlepan/new-narrative-novel/packages/renderer/src/app/i18n/index.tsx:20) and [`packages/renderer/src/app/i18n/index.tsx:45`](/Users/changlepan/new-narrative-novel/packages/renderer/src/app/i18n/index.tsx:45).

Impact:
- Story language depends on the browser environment instead of Storybook controls.
- Different stories can render in different locales depending on whether they happen to include a local language toggle.
- This makes Storybook unreliable as an i18n review surface.

Evidence:
- [`packages/renderer/.storybook/preview.ts:1`](/Users/changlepan/new-narrative-novel/packages/renderer/.storybook/preview.ts:1)
- [`packages/renderer/src/app/i18n/index.tsx:20`](/Users/changlepan/new-narrative-novel/packages/renderer/src/app/i18n/index.tsx:20)

### 2. Chapter Storybook fixtures are English-only and bypass localization

Severity: Important

[`packages/renderer/src/features/chapter/components/chapter-story-fixture.ts`](/Users/changlepan/new-narrative-novel/packages/renderer/src/features/chapter/components/chapter-story-fixture.ts) hardcodes chapter titles, summaries, status labels, inspector labels, prose summaries, and draft prose in English. These builders are then reused across most chapter Storybook entries.

Impact:
- Even when UI chrome is localized, story content remains English.
- Storybook preview gives the impression that the chapter feature is not internationalized, even if the runtime data path is localized elsewhere.
- Reviewers cannot tell whether a canvas is using real localized data or just English placeholders.

Evidence:
- [`packages/renderer/src/features/chapter/components/chapter-story-fixture.ts:4`](/Users/changlepan/new-narrative-novel/packages/renderer/src/features/chapter/components/chapter-story-fixture.ts:4)
- [`packages/renderer/src/features/chapter/components/chapter-story-fixture.ts:34`](/Users/changlepan/new-narrative-novel/packages/renderer/src/features/chapter/components/chapter-story-fixture.ts:34)
- [`packages/renderer/src/features/chapter/components/chapter-story-fixture.ts:155`](/Users/changlepan/new-narrative-novel/packages/renderer/src/features/chapter/components/chapter-story-fixture.ts:155)
- [`packages/renderer/src/features/chapter/components/ChapterBinderPane.stories.tsx:24`](/Users/changlepan/new-narrative-novel/packages/renderer/src/features/chapter/components/ChapterBinderPane.stories.tsx:24)

### 3. Several chapter stories inject English activity/debug copy directly

Severity: Important

Some chapter stories do not just reuse English fixtures; they also inject story-only activity rows and descriptive copy in English. This produces mixed-language canvases even when the rest of the shell is localized.

Evidence:
- [`packages/renderer/src/features/chapter/containers/ChapterDraftWorkspace.stories.tsx:52`](/Users/changlepan/new-narrative-novel/packages/renderer/src/features/chapter/containers/ChapterDraftWorkspace.stories.tsx:52)
- [`packages/renderer/src/features/chapter/containers/ChapterDraftWorkspace.stories.tsx:62`](/Users/changlepan/new-narrative-novel/packages/renderer/src/features/chapter/containers/ChapterDraftWorkspace.stories.tsx:62)
- [`packages/renderer/src/features/chapter/components/ChapterDraftBottomDock.stories.tsx:40`](/Users/changlepan/new-narrative-novel/packages/renderer/src/features/chapter/components/ChapterDraftBottomDock.stories.tsx:40)
- [`packages/renderer/src/features/chapter/components/ChapterDraftBottomDock.stories.tsx:47`](/Users/changlepan/new-narrative-novel/packages/renderer/src/features/chapter/components/ChapterDraftBottomDock.stories.tsx:47)

### 4. Scene Storybook has a better i18n baseline than chapter Storybook

Severity: Informational

The scene Storybook path already centralizes setup through [`packages/renderer/src/features/scene/containers/scene-storybook.tsx`](/Users/changlepan/new-narrative-novel/packages/renderer/src/features/scene/containers/scene-storybook.tsx), which wraps stories with `AppProviders` and sets route/store state in one place. Scene mock data also has localized fixture content in [`packages/renderer/src/mock/scene-fixtures.locale.ts`](/Users/changlepan/new-narrative-novel/packages/renderer/src/mock/scene-fixtures.locale.ts).

This is a useful reference for how chapter Storybook should be normalized.

Evidence:
- [`packages/renderer/src/features/scene/containers/scene-storybook.tsx:57`](/Users/changlepan/new-narrative-novel/packages/renderer/src/features/scene/containers/scene-storybook.tsx:57)
- [`packages/renderer/src/mock/scene-fixtures.locale.ts:409`](/Users/changlepan/new-narrative-novel/packages/renderer/src/mock/scene-fixtures.locale.ts:409)

### 5. Runtime UI still relies on scattered inline bilingual strings

Severity: Minor

There is a functioning locale layer, but a lot of runtime text still lives in per-component `locale === 'zh-CN' ? ... : ...` branches instead of the shared dictionary. That is not the same as "not internationalized", but it increases drift risk and makes coverage auditing harder.

Representative examples:
- [`packages/renderer/src/features/chapter/components/ChapterDraftBottomDock.tsx:55`](/Users/changlepan/new-narrative-novel/packages/renderer/src/features/chapter/components/ChapterDraftBottomDock.tsx:55)
- [`packages/renderer/src/features/chapter/components/ChapterDraftInspectorPane.tsx:51`](/Users/changlepan/new-narrative-novel/packages/renderer/src/features/chapter/components/ChapterDraftInspectorPane.tsx:51)
- [`packages/renderer/src/features/scene/components/SceneProseTab.tsx:137`](/Users/changlepan/new-narrative-novel/packages/renderer/src/features/scene/components/SceneProseTab.tsx:137)

## MCP Verification Notes

Structured snapshot checks were taken with Playwright MCP:

1. App route:
   - `http://127.0.0.1:4173/workbench?scope=chapter&id=chapter-signals-in-rain&lens=draft&sceneId=scene-ticket-window`
   - Result: shell chrome localized, but content still contains mixed-language chapter data.

2. Storybook chapter draft workspace:
   - `http://127.0.0.1:6006/iframe.html?id=mockups-chapter-chapterdraftworkspace--default&viewMode=story`
   - Result: Chinese shell text with English chapter/story content in the same canvas.

3. Storybook chapter draft reader missing-drafts:
   - `http://127.0.0.1:6006/iframe.html?id=business-chapterdraftreader--missing-drafts&viewMode=story`
   - Result: chapter reader structure is present, but story body/status content remains English-heavy because it comes from chapter story fixtures.

## Recommended Fix Order

1. Add a global Storybook locale decorator/toolbar in [`packages/renderer/.storybook/preview.ts`](/Users/changlepan/new-narrative-novel/packages/renderer/.storybook/preview.ts) so preview language is explicit and reproducible.
2. Replace [`packages/renderer/src/features/chapter/components/chapter-story-fixture.ts`](/Users/changlepan/new-narrative-novel/packages/renderer/src/features/chapter/components/chapter-story-fixture.ts) with locale-aware chapter story builders, or route chapter stories through a chapter-specific story shell the way scene stories already do.
3. Remove story-only English activity strings from chapter stories and derive them from locale-aware builders.
4. After Storybook is normalized, sweep runtime components that still rely on inline ternaries and move repeated labels into the shared dictionary.

## Bottom Line

The renderer is not missing an i18n foundation. The more specific problem is:

- Storybook is not acting as a locale-controlled preview environment
- chapter story fixtures are still English-first
- some story-only copy is injected directly in English

That combination is enough to make Storybook preview look "mostly English" even when parts of the runtime shell already localize correctly.
