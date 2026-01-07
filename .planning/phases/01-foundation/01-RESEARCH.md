# Phase 1: Foundation - Research

**Researched:** 2026-01-07
**Domain:** Vite + React + Tailwind + PocketBase full-stack setup
**Confidence:** HIGH

<research_summary>
## Summary

Researched the current best practices for setting up a full-stack web application with Vite, React, Tailwind CSS (with dark mode), and PocketBase with SQLite in 2025.

Key findings:
- **Tailwind v4** is the new standard with major performance improvements (10x faster builds via Oxide engine) and CSS-first configuration
- **Vite + React** remains the standard for fast development with hot reload
- **PocketBase** provides a complete backend solution with SQLite, auth, and file storage via a single binary
- **Dark mode** should use `darkMode: 'class'` strategy with Tailwind for manual control

**Primary recommendation:** Use Vite 5+ with React 18+, Tailwind CSS v4 for best performance and modern CSS-first config, and PocketBase official JavaScript SDK for backend integration. Implement dark mode with Tailwind's class-based strategy from the start.
</research_summary>

<standard_stack>
## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vite | 5.x | Build tool & dev server | Fast HMR, optimized builds, industry standard |
| React | 18.x | UI framework | Declarative components, massive ecosystem |
| Tailwind CSS | 4.x | Utility-first styling | 10x faster builds (v4 Oxide engine), CSS-first config |
| PocketBase | latest | Backend BaaS | Single binary, SQLite, auth, realtime, file storage |
| pocketbase (JS SDK) | latest | PocketBase client for JS | Official SDK for browser/Node.js |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TypeScript | 5.x | Type safety | Recommended for all new React projects |
| PostCSS | 8.x | CSS processing | Required by Tailwind |
| Autoprefixer | 10.x | Vendor prefixes | Required by Tailwind |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tailwind v4 | Tailwind v3 | v3 is stable but slower; v4 requires newer browsers (Safari 16.4+, Chrome 111+, Firefox 128+) |
| PocketBase | Supabase/Firebase | PocketBase is self-hosted, simpler; others are cloud-hosted with more features |
| Vite | Next.js/Remix | Use frameworks if you need SSR/routing; Vite is simpler for SPAs |

**Installation:**
```bash
# Create Vite + React project
npm create vite@latest . -- --template react-ts

# Install Tailwind CSS v4
npm install -D tailwindcss@next postcss autoprefixer

# Install PocketBase SDK
npm install pocketbase
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/      # Reusable UI components
│   ├── ui/         # Basic UI components (Button, Input, etc.)
│   └── layout/     # Layout components (Header, Main, Footer)
├── lib/            # External library configurations
│   ├── pocketbase.ts   # PocketBase client instance
│   └── utils.ts        # Utility functions
├── hooks/          # Custom React hooks
├── App.tsx         # Root component
└── main.tsx        # Entry point
public/
└── pocketbase/     # PocketBase executable (for local dev)
```

### Pattern 1: PocketBase Client Singleton
**What:** Create a single PocketBase instance exported from a module
**When to use:** Always - PocketBase SDK should be a singleton
**Example:**
```typescript
// src/lib/pocketbase.ts
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

export default pb;
```

### Pattern 2: Tailwind v4 CSS-First Configuration
**What:** Configure Tailwind directly in CSS files instead of JavaScript
**When to use:** Always with Tailwind v4
**Example:**
```css
/* src/index.css */
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;
}

@custom-variant dark (&:where(.dark, .dark *));
```

### Pattern 3: Dark Mode with Class Strategy
**What:** Toggle `dark` class on HTML element for dark mode
**When to use:** When you want manual dark mode control (not system-only)
**Example:**
```typescript
// src/hooks/useDarkMode.ts
import { useEffect } from 'react';

export function useDarkMode() {
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('darkMode', String(isDark));
  };

  return { toggleDarkMode };
}
```

### Anti-Patterns to Avoid
- **Creating multiple PocketBase instances:** Always use singleton pattern - multiple instances cause auth issues
- **Using Tailwind v3 config with v4:** v4 uses CSS-first config, not `tailwind.config.js`
- **Dark mode with `media` strategy:** Use `class` strategy for manual control in apps
- **Not setting up CORS:** PocketBase requires proper CORS configuration for frontend
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Build tooling | Custom webpack/rollup config | Vite | HMR, optimization, dev server all handled |
| Dark mode theming | Manual CSS variables | Tailwind v4 CSS variables | Built-in, battle-tested, consistent |
| State management | Custom Context stores | PocketBase SDK + React Context | PB handles auth, DB sync, realtime |
| API client | fetch wrappers | PocketBase JS SDK | Auth, file upload, realtime all included |
| PostCSS processing | Manual PostCSS setup | Tailwind CLI/init | Autoprefixer, plugins configured automatically |
| Hot reload | Custom file watchers | Vite dev server | Instant HMR, ESM-native, fast |

**Key insight:** Vite and PocketBase are both "batteries included" tools. They handle the hard parts (HMR, auth, DB, realtime) so you don't have to. Fighting them to build custom solutions is wasted effort.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Tailwind v4 Dark Mode Flicker
**What goes wrong:** Page loads in light mode, then flashes to dark mode
**Why it happens:** Dark mode class added after initial render via useEffect
**How to avoid:**
1. Add inline script to check localStorage before React loads
2. Use `classList.add('dark')` in `<head>` before body renders
**Warning signs:** Visible flash of wrong theme on page load

### Pitfall 2: PocketBase CORS Errors
**What goes wrong:** Frontend can't connect to PocketBase API
**Why it happens:** PocketBase defaults to localhost only, needs CORS config
**How to avoid:**
1. Configure `CORS_ALLOWED_ORIGINS` in PocketBase
2. Use correct URL (http://127.0.0.1:8090 not localhost)
**Warning signs:** "CORS policy" errors in browser console

### Pitfall 3: Tailwind v4 Browser Incompatibility
**What goes wrong:** Styles don't apply in older browsers
**Why it happens:** Tailwind v4 requires Safari 16.4+, Chrome 111+, Firefox 128+
**How to avoid:** Check browser requirements before using v4, or use v3 for wider support
**Warning signs:** Styles work in Chrome but not older Safari

### Pitfall 4: Vite Path Alias Issues
**What goes wrong:** Imports like `@/components` fail
**Why it happens:** Vite needs both `vite.config.ts` AND `tsconfig.json` configured
**How to avoid:**
```typescript
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
```
**Warning signs:** "Module not found" errors for @/ imports

### Pitfall 5: PocketBase Auth State Loss
**What goes wrong:** User logged out on page refresh
**Why it happens:** PocketBase auth token stored in memory, not persisted
**How to avoid:** Use `pb.authStore.loadFromCookie()` or `pb.authStore.save()` on load
**Warning signs:** Auth works but doesn't persist across refreshes
</common_pitfalls>

<code_examples>
## Code Examples

Verified patterns from official sources:

### Vite + React + Tailwind v4 Setup
```typescript
// Source: Tailwind CSS v4 announcement + Vite docs
// npm create vite@latest . -- --template react-ts
// npm install -D tailwindcss@next postcss autoprefixer

// src/index.css
@import "tailwindcss";

@theme {
  --font-sans: system-ui;
}

@custom-variant dark (&:where(.dark, .dark *));
```

### PocketBase Client Setup
```typescript
// Source: PocketBase JS SDK docs
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// Optional: Auth persistence
pb.authStore.loadFromCookie(document.cookie);

export default pb;
```

### Dark Mode Toggle
```typescript
// Source: Tailwind CSS dark mode docs
// src/components/DarkModeToggle.tsx
export function DarkModeToggle() {
  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  return (
    <button onClick={toggleDark}>
      Toggle dark mode
    </button>
  );
}
```

### Vite Config with Path Aliases
```typescript
// Source: Vite docs
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```
</code_examples>

<sota_updates>
## State of the Art (2025)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3 (JS config) | Tailwind v4 (CSS-first) | 2025 | 10x faster builds, CSS variables, simpler config |
| webpack bundler | Vite | 2022+ | Instant HMR, faster dev server, ESM-native |
| Custom backend | PocketBase | 2022+ | Single binary with auth, DB, realtime built-in |

**New tools/patterns to consider:**
- **Tailwind v4:** Use for all new projects unless browser support is a concern
- **Vite 5:** Default for React projects, superior DX
- **PocketBase:** Self-hosted alternative to Supabase/Firebase

**Deprecated/outdated:**
- **Tailwind v3 `tailwind.config.js`:** Replaced by CSS-first config in v4
- **CRA (Create React App):** Replaced by Vite for new projects
- **Custom dark mode scripts:** Use Tailwind's built-in dark mode with class strategy
</sota_updates>

<open_questions>
## Open Questions

Things that couldn't be fully resolved:

1. **Tailwind v4 stability in production**
   - What we know: v4 is released and recommended for new projects
   - What's unclear: Production adoption rate, real-world performance data
   - Recommendation: Use v4 for new projects, monitor for issues

2. **PocketBase for China deployment**
   - What we know: PocketBase is self-hosted, works anywhere
   - What's unclear: Optimal hosting providers accessible from China
   - Recommendation: Can be addressed in Phase 7 (Deployment)

</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- [Tailwind CSS v4.0 Announcement](https://tailwindcss.com/blog/tailwindcss-v4) - Official v4 release, Oxide engine, CSS-first config
- [Tailwind CSS Dark Mode Documentation](https://tailwindcss.com/docs/dark-mode) - Official dark mode setup guide
- [Vite Getting Started Guide](https://vite.dev/guide/) - Official Vite documentation (Node.js 20.19+, 22.12+)
- [PocketBase JS SDK (GitHub)](https://github.com/pocketbase/js-sdk) - Official PocketBase JavaScript SDK
- [PocketBase Documentation](https://pocketbase.io/docs/how-to-use/) - Official PocketBase docs

### Secondary (MEDIUM confidence)
- [Complete Guide: React + TypeScript + Vite 2025](https://medium.com/@robinviktorsson/complete-guide-to-setting-up-react-with-typescript-and-vite-2025-468f6556aaf2) - Modern setup guide verified against official docs
- [React Folder Structure with Vite & TypeScript 2025](https://medium.com/@prajwalabraham.21/react-folder-structure-with-vite-typescript-beginner-to-advanced-9cd12d1d18a6) - Project structure best practices
- [Getting Started with PocketBase 2025](https://www.youtube.com/watch?v=qvHAfSgjhD8) - PocketBase setup tutorial
- [Build a Flawless Tailwind Dark Mode](https://magicui.design/blog/tailwind-dark-mode) - Dark mode implementation guide
- [PocketBase: Develop JavaScript Application](https://blog.rasc.ch/2025/07/pocketbase_develop.html) - JS integration tutorial

### Tertiary (LOW confidence - needs validation)
- All WebSearch findings have been cross-verified with official docs where possible
- No critical findings rely solely on WebSearch without official documentation backup
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Vite, React, Tailwind CSS, PocketBase
- Ecosystem: TypeScript, PostCSS, Autoprefixer
- Patterns: Project structure, dark mode, PocketBase integration
- Pitfalls: CORS, browser support, auth persistence, path aliases

**Confidence breakdown:**
- Standard stack: HIGH - verified with official docs for all tools
- Architecture: HIGH - from official sources and 2025 guides
- Pitfalls: MEDIUM - common issues documented, but some may not apply to this specific project
- Code examples: HIGH - from official documentation or verified against official docs

**Research date:** 2026-01-07
**Valid until:** 2026-02-07 (30 days - stable tech stack with v4 being newest)

**Special notes:**
- Tailwind v4 is very new (2025), monitor for any breaking changes or issues
- PocketBase for China deployment needs Phase 7 research
- Dark mode flicker issue needs careful implementation to avoid
</metadata>

---

*Phase: 01-foundation*
*Research completed: 2026-01-07*
*Ready for planning: yes*
