# AI Image Generator

## What This Is

A personal web app for text-to-image generation using Qwen models. Users type prompts and get AI-generated images with minimal friction between idea and output.

## Core Value

Simple workflow above all else. The path from "idea" to "generated image" must be fast, intuitive, and require minimal clicks or cognitive load.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Text-to-image generation — Users enter text prompts, receive AI-generated images
- [ ] Qwen model integration — Use Alibaba's Qwen image models
- [ ] Simple UI — Minimal interface: prompt input → generate → view result
- [ ] China-compatible deployment — Ensure API/hosting works from China

### Out of Scope

- User accounts — Personal use tool, no authentication or user management needed
- Multi-model support — Focus on Qwen only, don't build abstraction layer for multiple providers
- Image gallery/persistence — Generated images can be downloaded, no server-side storage needed
- Sharing features — Not a social platform, personal tool only

## Context

**Target user**: Personal use by the developer

**Location context**: Deployed/accessed from China, which affects:
- API availability (must use services accessible in China)
- CDN choices (if needed)
- Network latency considerations

**Model choice**: Qwen (Alibaba's image models) — chosen for regional availability and quality

## Constraints

- **Regional**: Must work from China — APIs, hosting, and any external services must be accessible
- **Simplicity**: Personal tool, can be opinionated and streamlined
- **No authentication**: Removes entire security/compliance surface area

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Qwen models | Regional availability in China, good quality, developer is familiar | — Pending |
| No user accounts | Personal use tool, authentication adds unnecessary complexity | — Pending |
| Client-side focus | Minimize server infrastructure, deploy to simple hosting | — Pending |

---
*Last updated: 2026-01-07 after initialization*
