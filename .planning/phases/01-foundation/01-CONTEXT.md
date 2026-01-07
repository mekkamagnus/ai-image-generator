# Phase 1: Foundation - Context

**Gathered:** 2026-01-07
**Status:** Ready for planning

<vision>
## How This Should Work

Full-stack web application setup with Vite, React, and Tailwind on the frontend, PocketBase and SQLite on the backend. The foundation should be fully integrated — frontend can talk to backend, development server runs smoothly with hot reload, and everything just works together.

This is the groundwork that all other phases build on. When this phase is complete, we should have a working development environment where we can start building features immediately.

</vision>

<essential>
## What Must Be Nailed

- **Everything integrated** — All parts of the stack working together (Vite + React + Tailwind frontend, PocketBase + SQLite backend)
- **Working dev server** — Vite development server with hot reload for fast iteration
- **Backend connectivity** — Frontend can successfully communicate with PocketBase backend

</essential>

<boundaries>
## What's Out of Scope

- No API calls to Qwen yet — just set up project structure and backend connectivity
- No UI components beyond basic setup — don't build the generation interface yet
- No database schemas or migrations — just PocketBase + SQLite running

</boundaries>

<specifics>
## Specific Ideas

- Dark mode support should be built in from the start
- Tech stack: Vite (build tool), React (framework), Tailwind (styling), PocketBase (backend), SQLite (database)
- Standard Vite React setup is fine — no particular project structure preferences

</specifics>

<notes>
## Additional Context

User wants a complete, working foundation where all pieces are connected. The emphasis is on integration and having everything ready for feature development.

Personal tool context from PROJECT.md: Simple workflow is the core value, so the foundation should support fast development and iteration.

</notes>

---

*Phase: 01-foundation*
*Context gathered: 2026-01-07*
