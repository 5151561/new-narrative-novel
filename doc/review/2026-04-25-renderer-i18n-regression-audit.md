# Renderer i18n Regression Audit

Date: 2026-04-25
Scope: `packages/renderer` i18n coverage after recent run artifact, export artifact, runtime health, and review surfaces
Verdict: i18n sign-off fails

## Summary

The renderer still has a working i18n foundation:

- `packages/renderer/src/app/i18n/index.tsx` provides `I18nProvider`, `useI18n`, dictionary entries, and common label helpers.
- `packages/renderer/.storybook/preview.ts` wires the global Storybook locale toolbar through `withStorybookLocale`.
- `packages/renderer/src/mock/scene-fixtures.locale.ts` localizes scene fixture content for zh-CN.

The current problem is coverage drift in newly added surfaces. Several new components and fixture builders render English in zh-CN Storybook previews, and some export artifact content is generated with English section headers regardless of active locale.

## MCP Storybook Evidence

Storybook was started locally at `http://127.0.0.1:6006/`. `storybook-mcp` connected but returned an empty component list, so the rendered stories were inspected through the Codex in-app browser MCP against Storybook iframe URLs, using the structured `#storybook-root` DOM text instead of screenshots.

Representative zh-CN checks:

- `business-run-artifact-inspector--context-packet`
  - Rendered English in zh-CN: `Scene context packet`, `Packed context for midnight platform.`, `CONTRACT`, `Scene brief`, `Scene setup, continuity, and editorial intent were packed.`, `Private reveal notes stay out until review lands.`
- `business-run-artifact-inspector--proposal-set`
  - Rendered English in zh-CN: `Scene proposal set`, `Proposal candidates for midnight platform are ready for review.`, `Accept`, `Apply the proposal set without further changes.`, `Request rewrite`, `Close the run without producing canon or prose artifacts.`
- `business-run-artifact-inspector--canon-patch`
  - Rendered English in zh-CN: `Canon patch`, `Accepted proposal changes were compiled into canon for midnight platform.`, `Accepted fact 1`, `The scene now opens on a stable arrival beat.`, `Trace link ids`.
- `business-bookexportartifactpanel--latest-markdown-artifact`
  - Rendered English in zh-CN: `Artifact builder`, `Artifact gate`, `Artifact build needs attention`, `Latest artifact`, `Export artifact for 归档快照.`, `Built in story session`, `Narrative editor`, `Built before the latest story pass`.
- `business-bookdraftreviewview--review-default`
  - Rendered English in zh-CN: `Open`, `Reviewed`, `Deferred`, `Dismissed`, `BLOCKER`, `EXPORT BLOCKER`, `MISSING_DRAFT`, `CURRENT MANUSCRIPT`, `Draft missing`, `Compare delta needs review`.
- `app-project-runtime-status-badge--all-states`
  - Rendered English in zh-CN: `MOCK HEALTHY`, `Using in-memory mock project runtime.`, `API HEALTHY`, `Connected to runtime gateway.`, `Project runtime is unavailable.`, `Project runtime authentication is required.`

## Findings

### 1. Run artifact and trace inspector are English-heavy in zh-CN

Severity: High

`packages/renderer/src/features/run/api/mock-run-db.ts` has many `text('English only')` records without zh-CN values. These records feed artifact summaries, context packet detail, agent invocation detail, review options, canon patch facts, prose draft excerpts, trace node/link labels, and event labels.

Evidence:

- `packages/renderer/src/features/run/api/mock-run-db.ts:285` through `315`
- `packages/renderer/src/features/run/api/mock-run-db.ts:389` through `435`
- `packages/renderer/src/features/run/api/mock-run-db.ts:447` through `453`
- `packages/renderer/src/features/run/api/mock-run-db.ts:527` through `531`
- `packages/renderer/src/features/run/api/mock-run-db.ts:546` through `581`
- `packages/renderer/src/features/run/api/mock-run-db.ts:664` through `782`

The rendering layer has its own remaining English hardcodes:

- `packages/renderer/src/features/run/components/RunArtifactDetailSections.tsx:24` uses an English-only empty message.
- `packages/renderer/src/features/run/components/RunArtifactDetailSections.tsx:67` through `79` renders `Selected variants` unchanged in zh-CN.
- `packages/renderer/src/features/run/components/RunArtifactDetailSections.tsx:103`, `111`, `124`, `131`, `144`, `163`, `173`, `176`, `179`, `205`, `213`, `250`, `269`, `293`, `305`, `315`, `318`, and `321` pass English `eyebrow` labels such as `Contract`, `Sections`, `Canon`, `Assets`, `Trace`.
- `packages/renderer/src/features/run/components/RunTracePanel.tsx:19` through `27` defines relation labels in English only.
- `packages/renderer/src/features/run/components/RunTracePanel.tsx:87` through `123` keeps zh-CN labels such as `Proposal sets`, `Canon patches`, `links`.

Impact:

Run artifact inspection is one of the newest surfaces and currently cannot pass zh-CN review. Fixing only component ternaries will not be enough; the mock/API record builders also need localized data.

### 2. Book export artifact surfaces mix Chinese UI with English product copy

Severity: High

`BookExportArtifactPanel` and `BookExportArtifactGate` use zh-CN branches in places, but key product labels remain English or mixed Chinese-English. The exported package generator itself also emits English section headers and labels.

Evidence:

- `packages/renderer/src/features/book/components/BookExportArtifactPanel.tsx:107` renders `Artifact builder` for zh-CN.
- `packages/renderer/src/features/book/components/BookExportArtifactPanel.tsx:158`, `171`, `220`, and `231` render `Artifact gate`, `Latest artifact`, `artifact`, and `Recent artifacts` in zh-CN.
- `packages/renderer/src/features/book/components/BookExportArtifactGate.tsx:63` renders `Artifact gate` in zh-CN.
- `packages/renderer/src/features/book/components/BookExportArtifactGate.stories.tsx:20`, `43`, and `48` define zh-CN story labels with English words.
- `packages/renderer/src/features/book/lib/book-export-artifact-mappers.ts:190`, `222`, `256` through `287`, and `466` generate English gate labels, warnings, and artifact summaries.
- `packages/renderer/src/features/book/lib/book-export-artifact-mappers.ts:296` through `440` generate English package content headings such as `Export package`, `Manuscript`, `Trace appendix`, `Compare summary`, `Readiness checklist`, `No readiness issues.`

Impact:

This is not only a Storybook issue. The local Markdown/plain-text artifact content produced by the renderer is English-structured even when the user is in zh-CN.

### 3. Review seed data is still English-only

Severity: High

`packages/renderer/src/features/review/api/book-review-seeds.ts` defines the review seed type as plain strings and stores all seed titles, details, recommendations, tags, source labels, excerpts, and handoff labels in English.

Evidence:

- `packages/renderer/src/features/review/api/book-review-seeds.ts:34` through `134`

Impact:

Book review pages can localize shell controls but still render English issue content in zh-CN. This is visible in `business-bookdraftreviewview--review-default`.

### 4. Runtime status summaries localize badges but not the summary payload

Severity: Medium

`ProjectRuntimeStatusBadge` localizes source/status badges through i18n helpers, but it renders `info.summary` directly. The stories and fallback health query build English summaries.

Evidence:

- `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.tsx:64`
- `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.stories.tsx:34`, `57`, `79`, `95`, `128`, `146`, and `163`
- `packages/renderer/src/app/project-runtime/useProjectRuntimeHealthQuery.ts:40`, `81`, `88`, `95`, `102`, `109`, `115`, `122`, and `128`

Impact:

The status badge looks partly localized, but error and health descriptions leak English in zh-CN. If API-provided summaries remain plain strings, the renderer needs either localized summary records or local fallback summary mapping.

### 5. Existing tests cover old locale paths but not the new surfaces

Severity: Medium

There are useful i18n tests for Storybook locale plumbing, scene/chapter fixtures, locale invalidation, and export readiness labels. The newly added run artifact, trace, export artifact, review seed, and runtime status paths are not protected by equivalent zh-CN assertions.

Representative existing coverage:

- `packages/renderer/.storybook/storybook-locale.test.ts`
- `packages/renderer/src/features/chapter/containers/ChapterDraftWorkspace.stories.test.tsx`
- `packages/renderer/src/features/book/lib/book-export-preview-mappers.test.ts`

Gaps observed:

- `packages/renderer/src/app/project-runtime/api-project-runtime.test.ts` and `fake-api-runtime.test-utils.test.ts` contain fixture examples where zh-CN equals English for run artifact records.
- Run artifact component tests assert English rendering but do not assert zh-CN alternatives.
- Book export artifact panel/gate tests do not assert that zh-CN is free of English product labels.

## Recommended Fix Order

1. Normalize localized text contracts for new data records:
   - run artifact summaries/details
   - run trace relation labels
   - review seed records
   - project runtime health summaries
   - book export artifact gate/content records

2. Move repeated new UI labels into `packages/renderer/src/app/i18n/index.tsx` instead of adding more scattered `locale === 'zh-CN' ? ... : ...` branches.

3. Localize Storybook fixtures and stories at the data-builder layer, not by patching rendered components story by story.

4. Add focused zh-CN regression tests:
   - one run artifact inspector story/component path
   - one run trace panel path
   - one book export artifact panel/gate path
   - one review seed/inbox path
   - one runtime status badge error/fallback path

5. Re-run Storybook MCP/browser structured checks on these story IDs after fixes:
   - `business-run-artifact-inspector--context-packet`
   - `business-run-artifact-inspector--proposal-set`
   - `business-run-artifact-inspector--canon-patch`
   - `business-bookexportartifactpanel--latest-markdown-artifact`
   - `business-bookdraftreviewview--review-default`
   - `app-project-runtime-status-badge--all-states`

## Bottom Line

This is a real regression, not just a perception issue. The old i18n foundation and Storybook locale toolbar are present, but several recent product surfaces were added with English-first data builders and partial inline zh-CN branches. The highest-risk fixes are run artifacts/trace and book export artifacts because they affect both Storybook preview and user-facing product outputs.
