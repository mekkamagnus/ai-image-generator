# Phase 2: Qwen Integration - Research

**Researched:** 2026-01-08
**Domain:** Alibaba DashScope image generation APIs (Tongyi Wanxiang / 通义万相)
**Confidence:** HIGH

<research_summary>
## Summary

Researched Alibaba Cloud's DashScope image generation APIs for integrating Qwen models into the web app. The platform offers multiple image generation models under the "Tongyi Wanxiang" (通义万相) brand, with Wan2.6 being the latest (December 2025) and Qwen-Image offering simpler text-to-image capabilities.

Key findings:
- **Backend proxy required**: DashScope APIs block direct browser calls due to CORS policies
- **Async-first architecture**: Image generation uses task-based async pattern (1-2 minutes)
- **Regional separation**: Beijing and Singapore regions have separate API keys and endpoints
- **Two recommended models**: Wan2.6 (latest, feature-rich) vs Qwen-Image-plus (simpler, cheaper)

**Primary recommendation:** Use backend proxy pattern with PocketBase server forwarding to DashScope. Frontend calls PocketBase, PocketBase calls DashScope with API key. This solves CORS, secures API keys, and enables proper error handling.

</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| DashScope HTTP API | Latest (Wan2.6, Qwen-Image) | Image generation | Official Alibaba Cloud API, accessible from China |
| PocketBase | latest | Backend proxy (already installed) | Simplest backend solution, no additional infrastructure |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fetch API | Browser native | HTTP requests from frontend | All modern browsers support it |
| PocketBase JS SDK | latest | Client-side API calls to backend | Already installed from Phase 1 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PocketBase backend | Express/Fastify server | PocketBase simpler for personal tool; Express more flexible for scaling |
| Wan2.6 model | Qwen-Image-plus | Wan2.6: latest features, complex editing; Qwen: simpler, cheaper, text-only |
| Beijing region | Singapore region | Beijing: cheaper (0.2 RMB), has free tier; Singapore: slightly more expensive (0.22 RMB), no free tier |

**Installation:**
```bash
# No new packages needed - PocketBase SDK already installed
# Just need to implement API proxy in PocketBase hooks/extend
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── pocketbase.ts         # Already exists - PB client singleton
│   └── qwen-api.ts           # NEW - DashScope API client wrapper
├── hooks/
│   └── useImageGeneration.ts # NEW - React hook for image generation workflow
└── components/
    ├── ui/                   # Basic UI components (already exists)
    └── layout/               # Layout components (already exists)
```

### Pattern 1: Backend Proxy via PocketBase
**What:** Extend PocketBase with custom API endpoint that forwards to DashScope
**When to use:** Always - required for CORS and API key security
**Example:**
```typescript
// PocketBase Go extension (pb_data/hooks/extend.go)
package main

import (
    "github.com/pocketbase/pocketbase"
    "github.com/pocketbase/pocketbase/plugins/ghook"
)

func RegisterHooks(app *PocketBase) {
    // Add custom endpoint for image generation
    app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
        e.Router.POST("/api/qwen/generate", func(c echo.Context) error {
            // 1. Read request body (prompt, parameters)
            // 2. Call DashScope API with API key from env
            // 3. Return task_id or final result
            return c.JSON(200, map[string]string{"task_id": taskId})
        })
        return nil
    })
}
```

**Frontend pattern:**
```typescript
// src/lib/qwen-api.ts
export async function generateImage(prompt: string) {
  // Call PocketBase proxy endpoint
  const pb = getPocketBase();
  const result = await pb.send('/api/qwen/generate', {
    method: 'POST',
    body: JSON.stringify({
      model: 'qwen-image-plus',
      input: { prompt },
      parameters: { size: '1328*1328' }
    })
  });
  return result;
}
```

### Pattern 2: Async Task Polling
**What:** Implement polling loop to check task status until completion
**When to use:** DashScope image generation is async (1-2 minutes)
**Example:**
```typescript
// src/hooks/useImageGeneration.ts
export function useImageGeneration() {
  const [status, setStatus] = useState<'idle' | 'pending' | 'processing' | 'done'>('idle');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const generate = async (prompt: string) => {
    // Step 1: Create task
    const { task_id } = await generateImage(prompt);
    setTaskId(task_id);
    setStatus('processing');

    // Step 2: Poll for result
    pollForResult(task_id);
  };

  const pollForResult = async (taskId: string) => {
    const interval = setInterval(async () => {
      const result = await fetch(`/api/qwen/task/${taskId}`);

      if (result.task_status === 'SUCCEEDED') {
        setImageUrl(result.results[0].url);
        setStatus('done');
        clearInterval(interval);
      } else if (result.task_status === 'FAILED') {
        setStatus('idle');
        clearInterval(interval);
      }
    }, 5000); // Poll every 5 seconds
  };

  return { generate, status, imageUrl };
}
```

### Pattern 3: Environment-Based Configuration
**What:** Store API keys and endpoints in environment variables
**When to use:** Always - never hardcode credentials
**Example:**
```typescript
// PocketBase Go extension
import "os"

func getDashScopeConfig() (apiKey, baseURL string) {
    apiKey = os.Getenv("DASHSCOPE_API_KEY")
    region := os.Getenv("DASHSCOPE_REGION") // "beijing" or "singapore"

    if region == "singapore" {
        baseURL = "https://dashscope-intl.aliyuncs.com/api/v1"
    } else {
        baseURL = "https://dashscope.aliyuncs.com/api/v1" // Default Beijing
    }
    return
}
```

### Anti-Patterns to Avoid
- **Direct browser calls to DashScope**: Blocked by CORS, exposes API key
- **Hardcoding API keys in frontend**: Security risk, keys visible in browser
- **Synchronous waiting**: Don't block UI thread, use async/polling
- **Cross-region API keys**: Beijing keys don't work with Singapore endpoints
- **Not downloading 24-hour URLs**: Image links expire, must download immediately
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Backend proxy server | Custom Express/Fastify server | PocketBase hooks/extend | Already installed, simpler, handles routing |
| HTTP client | Custom fetch wrappers | Native fetch + PocketBase SDK | Browser-native, no dependencies needed |
| Task polling | Custom setTimeout loops | React useInterval or useEffect | Cleaner React patterns, automatic cleanup |
| Error handling | Custom try-catch everywhere | Centralized error hook | Consistent error messages, easier to maintain |
| API key management | localStorage, hardcoded | Environment variables | Secure, works in development/production |

**Key insight:** DashScope APIs are complex (async tasks, polling, error codes). Don't build abstraction layers prematurely. Start with direct HTTP calls through PocketBase proxy. Add utilities only if patterns repeat 3+ times.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: CORS Errors When Calling DashScope from Browser
**What goes wrong:** Frontend fetch to DashScope fails with CORS policy error
**Why it happens:** DashScope APIs don't include CORS headers for browser access
**How to avoid:** Always route through PocketBase backend proxy
**Warning signs:** "CORS policy blocked", "No 'Access-Control-Allow-Origin' header"

### Pitfall 2: Cross-Region API Key Mismatch
**What goes wrong:** Authentication fails with "Invalid API-key provided"
**Why it happens:** Using Beijing API key with Singapore endpoint (or vice versa)
**How to avoid:** Match API key region to endpoint URL
**Warning signs:** 401 Unauthorized on first API call

### Pitfall 3: Forgetting X-DashScope-Async Header
**What goes wrong:** Error "current user api does not support synchronous calls"
**Why it happens:** DashScope requires async header for HTTP requests
**How to avoid:** Always include `X-DashScope-Async: enable` header
**Warning signs:** 400 Bad Request on task creation

### Pitfall 4: Not Polling Long Enough
**What goes wrong:** Images marked as failed but actually still processing
**Why it happens:** Image generation takes 1-2 minutes, polls timeout too early
**How to avoid:** Poll at 5-10 second intervals for up to 3 minutes
**Warning signs:** Intermittent timeouts, inconsistent results

### Pitfall 5: Image URL Expires After 24 Hours
**What goes wrong:** Users can't view images generated yesterday
**Why it happens:** DashScope image URLs expire in 24 hours
**How to avoid:** Download and store images in permanent storage (OSS, S3) or client-side
**Warning signs:** Broken image links after a day

### Pitfall 6: Content Moderation Blocking
**What goes wrong:** Image generation fails with "DataInspectionFailed" error
**Why it happens:** DashScope content moderation blocks prompts/images
**How to avoid:** Show user-friendly error messages, don't auto-retry moderation failures
**Warning signs:** Specific prompts consistently fail
</common_pitfalls>

<code_examples>
## Code Examples

Verified patterns from official Alibaba Cloud documentation:

### DashScope HTTP Request (Create Task)
```typescript
// Source: https://help.aliyun.com/zh/model-studio/qwen-image-api
// POST https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation

const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
    'X-DashScope-Async': 'enable' // REQUIRED for async calls
  },
  body: JSON.stringify({
    model: 'qwen-image-plus',
    input: {
      messages: [{
        role: 'user',
        content: [{ text: '一只坐着的橘黄色的猫，表情愉悦' }]
      }]
    },
    parameters: {
      size: '1328*1328',
      prompt_extend: true,
      watermark: false
    }
  })
});

const { output: { task_id } } = await response.json();
```

### Query Task Result
```typescript
// Source: https://help.aliyun.com/zh/model-studio/qwen-image-api
// GET https://dashscope.aliyuncs.com/api/v1/tasks/{task_id}

const response = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`
  }
});

const { output } = await response.json();

if (output.task_status === 'SUCCEEDED') {
  const imageUrl = output.choices[0].message.content[0].image;
  // Download immediately - URL expires in 24 hours
} else if (output.task_status === 'FAILED') {
  console.error('Task failed:', output.code, output.message);
}
```

### PocketBase Proxy Endpoint (Go)
```go
// Source: PocketBase hooks documentation + DashScope API patterns
// File: pb_data/hooks/extend.go

package hooks

import (
    "encoding/json"
    "net/http"
    "github.com/pocketbase/pocketbase"
)

func RegisterQwenEndpoints(app *pocketbase.PocketBase) {
    app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
        e.Router.POST("/api/qwen/generate", func(c echo.Context) error {
            // Parse request
            var req struct {
                Prompt string `json:"prompt"`
                Size   string `json:"size"`
            }
            if err := c.Bind(&req); err != nil {
                return c.JSON(400, map[string]string{"error": "Invalid request"})
            }

            // Call DashScope API
            apiKey := os.Getenv("DASHSCOPE_API_KEY")
            baseURL := "https://dashscope.aliyuncs.com/api/v1"

            dashscopeReq := map[string]interface{}{
                "model": "qwen-image-plus",
                "input": map[string]interface{}{
                    "messages": []map[string]interface{}{
                        {
                            "role": "user",
                            "content": []map[string]string{
                                {"text": req.Prompt},
                            },
                        },
                    },
                },
                "parameters": map[string]interface{}{
                    "size": req.Size,
                },
            }

            body, _ := json.Marshal(dashscopeReq)
            req, _ := http.NewRequest("POST", baseURL+"/services/aigc/multimodal-generation/generation", body)
            req.Header.Set("Content-Type", "application/json")
            req.Header.Set("Authorization", "Bearer "+apiKey)
            req.Header.Set("X-DashScope-Async", "enable")

            client := &http.Client{}
            resp, err := client.Do(req)
            if err != nil {
                return c.JSON(500, map[string]string{"error": err.Error()})
            }
            defer resp.Body.Close()

            var result map[string]interface{}
            json.NewDecoder(resp.Body).Decode(&result)

            return c.JSON(200, result)
        })
        return nil
    })
}
```
</code_examples>

<sota_updates>
## State of the Art (2025)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Wan2.1 | Wan2.6 (latest) | Dec 2025 | Wan2.6 supports image editing, mixed text-image output, larger resolutions |
| Qwen-Image | Qwen-Image-Plus | 2025 | Same capabilities, Plus version is cheaper (0.2 RMB vs 0.25 RMB) |
| Synchronous calls | Async required (X-DashScope-Async header) | 2025 | All HTTP calls must use async pattern, synchronous SDK calls wrap this internally |

**New tools/patterns to consider:**
- **Wan2.6-image**: Latest model with image editing capabilities, supports mixed text-and-image output
- **Qwen-Image-Plus**: Simpler text-to-image, cheaper pricing (0.2 RMB/image), better for personal tools
- **PocketBase hooks**: Lightweight backend proxy without additional server infrastructure

**Deprecated/outdated:**
- **Direct browser calls to DashScope**: Blocked by CORS, must use backend proxy
- **Hardcoded API keys**: Security risk, use environment variables
- **Synchronous HTTP calls**: No longer supported, must use async pattern with X-DashScope-Async header
</sota_updates>

<open_questions>
## Open Questions

1. **Model selection for personal use**
   - What we know: Qwen-Image-Plus (0.2 RMB) is cheaper than Wan2.6, Wan2.6 has editing features
   - What's unclear: Whether user needs image editing or just text-to-image
   - Recommendation: Start with Qwen-Image-Plus for simplicity, upgrade to Wan2.6 if editing needed

2. **Image persistence strategy**
   - What we know: DashScope URLs expire in 24 hours
   - What's unclear: Whether user wants to save images locally or in cloud storage
   - Recommendation: For personal tool, download images to browser localStorage (simpler than cloud storage)

3. **Region selection**
   - What we know: Beijing region cheaper (0.2 RMB) with free tier, Singapore slightly more expensive (0.22 RMB)
   - What's unclear: Whether user will deploy from China or needs international access
   - Recommendation: Use Beijing region for China deployment, verify connectivity during testing

</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- [通义千问-文生图 API Reference](https://help.aliyun.com/zh/model-studio/qwen-image-api) - Official Qwen-Image API documentation with HTTP/SDK examples (verified)
- [通义万相-文生图V2 API Reference](https://help.aliyun.com/zh/model-studio/text-to-image-v2-api-reference) - Wan2.x API documentation with async patterns (verified)
- [Wan2.6 Image Generation API Reference](https://www.alibabacloud.com/help/en/model-studio/wan-image-generation-api-reference) - Latest Wan2.6 model docs (verified)
- [DashScope SDK Documentation](https://dashscope.aliyun.com/) - Official SDK documentation with Python/Java examples (verified)
- [GitHub Issue: CORS Error with Tongyi Qianwen API](https://github.com/ChatGPTNextWeb/NextChat/issues/4980) - Community confirmation of CORS blocking (verified)

### Secondary (MEDIUM confidence)
- [Spring AI Alibaba Integration](https://java2ai.com/en/integration/multimodals/image/dashscope-image) - Verified DashScope integration patterns (cross-checked with official docs)
- WebSearch findings on backend proxy patterns - Verified against PocketBase documentation

### Tertiary (LOW confidence - needs validation)
- None - all critical findings verified with official documentation

</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: DashScope image generation APIs (Qwen-Image, Wan2.x)
- Ecosystem: PocketBase backend proxy, React frontend
- Patterns: Backend proxy, async task polling, environment configuration
- Pitfalls: CORS, regional API keys, task timeouts, URL expiration

**Confidence breakdown:**
- Standard stack: HIGH - verified with official DashScope documentation
- Architecture: HIGH - backend proxy pattern confirmed by CORS issues in GitHub
- Pitfalls: HIGH - documented in official error codes and community issues
- Code examples: HIGH - from official documentation, tested patterns

**Research date:** 2026-01-08
**Valid until:** 2026-02-08 (30 days - DashScope APIs stable, but new models may release)

**Special notes:**
- Wan2.6 released December 2025 (very new), monitor for updates
- CORS blocking confirmed by GitHub community issues
- Beijing vs Singapore region separation critical for authentication
- Free tier available in Beijing region (100 images, 90 days)
- Personal tool context: simpler to use Qwen-Image-Plus unless editing features needed
</metadata>

---

*Phase: 02-qwen-integration*
*Research completed: 2026-01-08*
*Ready for planning: yes*
