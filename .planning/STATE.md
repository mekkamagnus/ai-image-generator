# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-07)

**Core value:** Simple workflow above all else. The path from "idea" to "generated image" must be fast, intuitive, and require minimal clicks or cognitive load.
**Current focus:** Phase 7 — Deployment

## Current Position

Phase: 7 of 8 (Deployment)
Plan: 2 of 3 in current phase
Status: In progress
Last activity: 2026-01-09 — Completed 07-02 (Deploy to nginx Server)

Progress: ██████████░ 10/24 plans complete (42%)

## Performance Metrics

**Velocity:**
- Total plans completed: 9
- Average duration: ~1 session
- Total execution time: ~6 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 1 | 1 | 1 session |
| 2. Qwen Integration | 1 | 1 | 1 session |
| 3. Generation UI | 1 | 1 | 1 session |
| 4. Image Display | 0 | — | — |
| 5. Error Handling | 1 | 1 | 12 min |
| 5.1. Testing | 3 | 3 | 15 min |
| 6. Polish | 1 | 1 | 1 session |
| 7. Deployment | 2 | 3 | 8 min, 47 min |
| 8. China Access | 0 | — | — |

**Recent Trend:**
- Last 5 plans: 5.1-02, 5.1-03, 06-01, 07-01, 07-02 (complete)
- Trend: Stable (consistent execution)

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

**From Phase 1 (Foundation):**
1. **Tailwind CSS v4 CSS-first approach** — Used @import "tailwindcss" and @theme instead of tailwind.config.js for 10x faster builds
2. **Class-based dark mode strategy** — Manual control via .dark class on html element, persists in localStorage
3. **PocketBase singleton pattern** — Single instance at http://127.0.0.1:8090 prevents auth state issues
4. **Path alias @/ configuration** — Maps to ./src for cleaner imports, configured in both vite.config.ts and tsconfig
5. **Project structure** — components/ui/, components/layout/, lib/, hooks/ following React best practices

**From Phase 2 (Qwen Integration):**
1. **Qwen-Image-Plus model** — Chosen for simplicity and pricing (0.2 RMB/image) over Wan2.6
2. **Beijing region** — Default for China deployment with free tier access (cheaper than Singapore)
3. **Backend proxy pattern** — Required due to CORS policies blocking direct browser calls to DashScope API
4. **5-second polling interval** — Balance between responsiveness and API load (DashScope docs recommend 5-10s)
5. **PocketBase Go extension** — Custom endpoints in pb_data/hooks/extend.go for /api/qwen/generate and /api/qwen/task/:taskId
6. **Async-first architecture** — Required by DashScope API (image generation takes 1-2 minutes)
7. **TypeScript-first API client** — Proper interfaces for GenerateImageOptions, GenerateImageResponse, TaskResult
8. **React hook polling pattern** — State management with useRef for taskId to avoid stale closures

**From Phase 3 (Generation UI):**
1. **Textarea over text input** — Better UX for descriptive prompts (100-500 characters)
2. **Status-based button text** — Clear feedback during 1-2 minute generation process
3. **Download button** — DashScope URLs expire in 24h, users need to save images
4. **Error display inline** — Shows API failures immediately without breaking flow
5. **Start over button** — Cleans state for new generation, resets form
6. **Controlled component pattern** — Prompt state managed in parent App.tsx for hook integration

**From Phase 5 (Error Handling):**
1. **Exponential backoff retry** — 2s initial delay with 1.5x multiplier (2s → 3s → 4.5s) prevents API overload
2. **Selective retry logic** — Only retry isRetryable=true errors (rate limits, network, server errors), not user errors
3. **ParsedError interface** — Structured error objects with userMessage, technicalMessage, suggestion, isRetryable
4. **User-friendly error messages** — Display userMessage with 💡 emoji suggestions, hide technical details
5. **AI-optimized console logging** — Structured objects with ISO timestamps, "action" field, consistent prefixes for agent analysis
6. **Log prefixes** — [API Error], [Network Error], [Retry], [Image Generation], [UI Error Displayed] for easy filtering

**From Phase 5.1 (TDD Testing):**
1. **Vitest over Jest** — Vite-native test framework with faster execution, better TypeScript support, and ESM compatibility
2. **Playwright over Cypress** — Better TypeScript support, faster execution, multi-browser support, and Vite compatibility
3. **jsdom environment** — Fast DOM testing without browser overhead for unit tests
4. **Sequential E2E execution** — Single worker prevents hitting DashScope API rate limits during testing
5. **Test utilities pattern** — DRY principle with centralized mocking, consistent test data, and single source of truth
6. **120 second E2E timeout** — DashScope API takes 1-2 minutes for image generation, Playwright default 30s is too short
7. **Playwright route mocking** — Use `page.route()` to intercept API calls and return mock responses for error testing
8. **Console log capture** — Monitor `console` events to validate AI-optimized logging from Phase 5
9. **Screenshot on failure** — Automatic screenshots help debug failing tests by showing browser state

**From Phase 6 (Polish):**
1. **Progress bar over spinner** — Visual timeline better communicates 1-2 minute wait than simple spinner
2. **44px minimum touch targets** — WCAG AA requirement for mobile accessibility, ensures all buttons are tappable
3. **Stacked mobile buttons** — Vertical stacking on small screens (375px) provides better spacing than cramped side-by-side layout
4. **focus-visible over focus** — Distinguishes keyboard from mouse navigation, better UX by not showing focus ring for mouse clicks
5. **Safe area support** — CSS `env(safe-area-inset-*)` prevents content from being hidden by mobile browser UI (notches, home indicators)
6. **Keyboard shortcuts** — Enter to generate, Escape to clear follow standard form patterns for power users
7. **Smooth transitions and hover effects** — `transition-all duration-200`, `hover:scale-[1.02]`, `active:scale-[0.98]` for polished feel
8. **ARIA live regions** — `role="status"` and `role="alert"` with `aria-live="polite"` for screen reader announcements

**From Phase 7 (Deployment):**
1. **nginx-only deployment** — Lightweight server (30-50MB RAM) vs Node.js backend (200-300MB), essential for 961MB RAM constraint
2. **Build locally, deploy static files** — Build on Raspberry Pi, upload dist/ to server via rsync
3. **nginx reverse proxy for API calls** — Both dev and production use `/api/qwen`, nginx proxies to DashScope API server-side with authentication
4. **Server-side API authentication** — DashScope API key stored in nginx config (server-side proxy adds `Authorization` header automatically)
5. **Manual chunk splitting for caching** — Separate `vendor` (React) and `pocketbase` chunks for better long-term caching
6. **Security-first .gitignore** — Created before first deployment commit to prevent API key exposure
7. **Let's Encrypt SSL with certbot** — Free SSL certificates with automatic nginx configuration and auto-renewal via systemd timer
8. **DigitalOcean DNS management via CLI** — Used doctl for automated DNS A record creation (image-generator → 137.184.143.235)

### Deferred Issues

None yet.

### Roadmap Evolution

- Phase 5.1 inserted after Phase 5: "Add TDD Testing Including UI Testing with Playwright" (INSERTED)
  - Rationale: Comprehensive test coverage needed before deployment
  - Includes: Vitest for unit/integration tests, Playwright for E2E UI testing
  - Impact: Phase 6 now depends on Phase 5.1 instead of Phase 5

- Phase 7.1 inserted after Phase 7: "Add CI/CD Integration for Automated Deployment" (INSERTED)
  - Rationale: Automate deployment workflow - local → GitHub → production (image-generator.mekaelturner.com)
  - Includes: GitHub Actions workflow, automated testing integration, environment variable management
  - Impact: Streamlines deployment process after Phase 7 completion

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-01-09
Stopped at: Completed 07-02 (Deploy to nginx Server)
Resume file: None

## Next Actions

Phase 7 Plan 2 complete! Application deployed to production at https://image-generator.mekaelturner.com with:
- nginx 1.24.0 serving static files (2.3M RAM usage)
- nginx reverse proxy handling DashScope API calls server-side
- SSL certificate from Let's Encrypt (valid until 2026-04-09, auto-renewal enabled)
- DNS configured via DigitalOcean (image-generator → 137.184.143.235)
- Image generation working end-to-end (user verified "it's working")
- Fixed production API calls to use nginx proxy instead of direct DashScope API

**Next: Plan 07-03** - China Access Verification
- Test application accessibility from China network
- Verify DashScope API connectivity from China region
- Test image generation performance from China
- Document any regional issues or optimizations needed
- Confirm deployment works for target audience

Recommended next step: `/gsd:execute-plan .planning/phases/07-deployment/07-03-PLAN.md`

