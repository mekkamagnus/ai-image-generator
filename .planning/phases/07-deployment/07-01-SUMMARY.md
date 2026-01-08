---
phase: 07-deployment
plan: 01
subsystem: deployment
tags: vite, production-build, security, cors, nginx

# Dependency graph
requires:
  - phase: 06-polish
    provides: polished UI with responsive design, accessibility, and E2E test coverage
provides:
  - Production build configuration with security and environment variable handling
  - .gitignore and .env.example for secure development
  - Clean TypeScript build with manual chunking
  - Production API call logic with documented CORS workaround
affects: deployment

# Tech tracking
tech-stack:
  added: none
  patterns:
    - Manual chunk splitting for better caching (React vendor, PocketBase)
    - Environment-based API endpoint selection (dev proxy vs prod direct)
    - Security-first approach (.gitignore before any commits)

key-files:
  created: .gitignore, .env.example
  modified: vite.config.ts, src/lib/qwen-api.ts, src/hooks/useImageGeneration.test.tsx, src/lib/errors.test.ts, src/hooks/useImageGeneration.ts

key-decisions:
  - "Direct API calls in production with CORS acknowledgment"
  - "Build locally, deploy static files (nginx-only deployment)"
  - "Exclude test file cleanup from production build to avoid blocking"

patterns-established:
  - "Security pattern: Always create .gitignore before first commit"
  - "Build pattern: Manual chunk splitting for vendor libraries"
  - "API pattern: Environment-based endpoint selection"

issues-created: []

# Metrics
duration: 8min
completed: 2026-01-08
---

# Phase 7 Plan 1: Production Build Configuration Summary

**Production build configured with security, environment variables, manual chunking, and CORS-documented API calls**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-08T09:29:00Z
- **Completed:** 2026-01-08T09:37:42Z
- **Tasks:** 3/3
- **Files modified:** 5

## Accomplishments

- Created comprehensive `.gitignore` securing sensitive files (.env, node_modules/, dist/)
- Created `.env.example` with documented environment variables
- Fixed all TypeScript build errors (removed unused imports, variables, parameters)
- Enhanced `vite.config.ts` with production optimizations (manual chunking, preview server)
- Implemented environment-based API endpoint selection (dev proxy vs prod direct)
- Documented CORS limitation requiring nginx proxy in deployment phase

## Task Commits

Each task was committed atomically:

1. **Task 1: Create .gitignore and secure sensitive files** - `d4def79` (feat)
2. **Task 2: Fix production build configuration** - `4884fe5` (fix)
3. **Task 3: Handle API calls in production with CORS workaround** - `bb2aa93` (feat)

**Plan metadata:** (pending - will commit after SUMMARY)

## Files Created/Modified

### Created

- `.gitignore` - Comprehensive ignores for Node.js/Vite (dependencies, build outputs, IDE files, test outputs, OS files, logs, PocketBase binaries)
- `.env.example` - Environment variable documentation with `DASHSCOPE_API_KEY=your_api_key_here` placeholder and setup instructions

### Modified

- `vite.config.ts` - Added `base: '/'` for production, manual chunk splitting (`vendor`, `pocketbase`), preview server config (port 4173), documented dev-only proxy
- `src/lib/qwen-api.ts` - Added `getApiBaseUrl()` helper for environment-based endpoint selection, production API calls with Authorization header, comprehensive CORS documentation
- `src/hooks/useImageGeneration.test.tsx` - Removed unused imports (`waitFor`, `ErrorCode`)
- `src/lib/errors.test.ts` - Removed unused variables (`consoleSpy`), added missing import (`afterEach`), fixed `.mock.calls` type casting
- `src/hooks/useImageGeneration.ts` - Removed unused `retryCount` state variable and setters

## Decisions Made

**Direct API calls in production with CORS acknowledgment**
- Implemented `getApiBaseUrl()` to select API endpoint based on environment
- Production uses `https://dashscope.aliyuncs.com/api/v1` with Authorization header
- Development continues using `/api/qwen` Vite proxy (existing behavior)
- Documented that production will fail without CORS proxy (to be added in 07-02)
- This approach acknowledges the limitation while enabling deployment phase to implement nginx proxy

**Build locally, deploy static files**
- Production build configured for local execution (Raspberry Pi)
- Static files will be uploaded to server for nginx-only deployment
- Aligns with resource constraints (961MB RAM server cannot run Node.js)

**Exclude test file cleanup from production build**
- Fixed TypeScript errors in test files (unused imports, variables)
- Did not exclude test files from tsconfig (alternatives considered)
- Test file cleanup is code quality improvement, not build blocker

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**None** - All tasks completed successfully without blockers or unexpected issues.

## Next Phase Readiness

Ready for Phase 7 Plan 2: Deploy to nginx server

**What's ready:**
- ✅ Production build configuration complete
- ✅ `.gitignore` securing sensitive files
- ✅ `.env.example` documenting environment variables
- ✅ Build succeeds without errors (`npm run build`)
- ✅ Preview server works (`npm run preview`)
- ✅ Production API call logic with documented CORS workaround

**What Plan 07-02 will address:**
- Build production bundle locally (`npm run build`)
- Install nginx on mekaelturner server
- Configure nginx to serve static React files
- Configure nginx reverse proxy for `/api/qwen/` to DashScope API
- Add DashScope API key to nginx config
- Configure DNS for `image-generator.mekaelturner.com`
- Set up SSL certificate with Let's Encrypt
- Verify deployment works end-to-end

**No blockers or concerns** - Clean execution, all verifications passed.

---
*Phase: 07-deployment*
*Completed: 2026-01-08*
