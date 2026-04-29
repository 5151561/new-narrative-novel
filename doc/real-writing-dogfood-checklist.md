# Real Writing Dogfood Checklist

This checklist helps you verify the real writing loop works end-to-end.

## Setup

1. Install dependencies: `pnpm install`
2. Start desktop: `pnpm dev:desktop`
3. Create a Real Project (not Demo)
4. Open Model Settings
5. Enter your OpenAI API key
6. Set planner model (e.g., gpt-4o)
7. Set sceneProseWriter model (e.g., gpt-4o)
8. Run Test Connection → should pass

## First Run

9. Create Chapter 1
10. Create Scene 1
11. Fill scene objective, cast notes, location notes, and constraints
12. Click Run Scene
13. Wait for run to complete (status shows "Waiting Review")
14. Review the proposal
15. Accept or Accept with edit
16. Verify prose appears in Scene Draft tab
17. Switch to Chapter scope → verify draft assembly shows prose
18. Switch to Book scope → verify manuscript shows prose

## Export

19. Export Markdown manuscript from Book scope
20. Verify the .md file contains book, chapter, and scene content

## Persistence

21. Quit the desktop app
22. Relaunch the desktop app
23. Recent project should appear and resume
24. Prose should still be present
25. Scene setup should be preserved

## Recovery

26. Project backups are stored in `.narrative/backups/`
27. Last 10 backups are kept by default
28. If the project store file is corrupted, it is moved to `.narrative/recovery/`
    and the latest valid backup is restored automatically

## Known Limitations

- Streaming tokens (SSE) is not yet supported
- Plugin system is not yet available
- Blender/spatial layer is not yet available
- Full prompt manager is not yet available
- Character/location asset CRUD is not yet available (use scene notes for now)
- Chapter outliner polish beyond minimal object visibility

## How to Report Issues

When reporting model/run failures, include:
- The run failure message shown in the UI
- Whether the run was retryable
- The provider (OpenAI/Fixture)
- The model ID used
- Steps to reproduce

## What Fixture/Demo Means

- **Demo Project**: Uses pre-built fixture data. No API key needed. Shows product shape.
- **Real Project**: Uses your own OpenAI API key. Your data. Your writing.
- **Mock/Storybook**: Development only. Not for real use.
