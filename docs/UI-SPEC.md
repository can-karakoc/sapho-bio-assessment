# Sapho Engage — UI & Build Spec

This document preserves the agreed product design and API contracts so the
minimal test-harness UI can be built now and the full frontend reworked later
without renegotiating the backend. Clickable reference mockup:
https://claude.ai/code/artifact/1935dfcb-4f0a-45da-8124-5f812f100dbd

## Chosen direction: Hybrid

Two views that share one `PostCard` component. The app lands on the Influencers
tab.

### 1. Influencers (leaderboard) — the strategy surface
- Ranked list of influencers, sorted by composite score, pinned first.
- Each row: rank, avatar, name, role/company, quick stats (followers, cadence,
  avg engagement, relevance %), an engagement sparkline, the composite score
  with a bar, a "N new" badge (count of that influencer's New posts), and
  pin / mute controls.
- "Recompute ranking" re-runs discovery/scoring; surfaces discovered CANDIDATE
  rows with Add / Dismiss.
- "Add manually" accepts a profile URL, which discovery scores and adds.
- Clicking a row opens that influencer's workspace.

### 2. Influencer workspace (drill-in)
- Header: avatar, name, role, LinkedIn link, composite score, and the five
  subscores as labeled mini-bars; pin/mute here too.
- Time-window control: Last 30d / Last 90d / All (or last 10).
- Below: that influencer's posts as `PostCard`s.

### 3. Response Queue — the execution surface
- All posts with status New or Drafted across all influencers, newest first.
- Live count badge in the tab. Actioning a post removes it from the queue.

### Shared PostCard
- Attribution (avatar, name, role, relative date, reactions/comments) + status
  chip (New / Drafted / Posted / Skipped).
- The post text.
- Draft section with a Comment / DM toggle whose selection FOLLOWS THE GOAL
  (comment = engagement, DM = lead-gen). DM is disabled on compliance-negative
  posts (recall / warning / 483), which are comment-only.
- Draft text; Edit swaps to a textarea.
- Grounding chips (which knowledge sources grounded the draft) + a
  "needs human review" flag.
- Actions: Regenerate, Edit, Copy, Post/Send (copy + open post or profile +
  log), Skip. Every action logs an event.

### The updatable ranked list (MVP scope)
- Score is computed by `lib/score.ts`, shared by the UI and discovery, so it is
  defined once and auditable. Default weights: reach .20, cadence .15,
  resonance .25, relevance .25, recency .15 (each subscore normalized 0-100).
- Manual overrides (pin / mute / add / dismiss) persist and are reapplied on
  every re-rank: pinned forced to top, muted excluded.
- MVP does not require a real-time crawler; "recompute" and "add manually" are
  wired to the right shape and re-score on a refresh run.

## API contracts (lock these before building the frontend)

### Data model
- Influencer: `{ id, name, role, company, linkedinUrl, followers,
  postsPerMonth, avgEngagement, relevance, signals{...}, recentEngagement:
  number[], selectionRationale }` plus computed `score` and
  `subscores{ reach, cadence, resonance, relevance, recency }`.
- Post: `{ id, influencerId, text, url, postedAt, reactions, comments,
  flags:{ complianceNegative?: boolean } }`.

### Endpoints
- `POST /api/generate`
  - req: `{ postId, config: { goal: 'comment'|'dm', brandVoice, instructions } }`
  - res: `{ text, model, latencyMs, usedSources: string[], needsReview: boolean,
    variantId }`
- `POST /api/event`
  - `{ postId, action: 'generated'|'edited'|'copied'|'posted'|'skipped',
    config, model?, latencyMs?, outputText?, editDistance? }`
- `GET /api/overrides` → current overrides; `POST /api/overrides`
  - `{ influencerId, action: 'pin'|'mute'|'unmute'|'add'|'dismiss' }`
  - persisted in Supabase (`influencer_overrides`) with a `data/overrides.json`
    fallback so the app runs with zero keys.

### Libraries / scripts
- `lib/score.ts` — `scoreInfluencer(signals) -> { score, subscores }`.
- `lib/kb.ts` — selects relevant `knowledge/` markdown for a post (keyword match
  now; pgvector seam later).
- `lib/llm.ts` — provider interface with `geminiProvider` (default) and
  `groqProvider`, selected by `LLM_PROVIDER`; same signature/return for both.
- `scripts/discover.ts` — Apify post-search → candidates scored via `score.ts`
  → `data/discovery.json`.
- `scripts/refresh.ts` — Apify profile-posts actor → `data/posts.json`.

## Recommended build order (contract-first, backend before frontend)
1. `types.ts` + the contracts above; `lib/score.ts` computing real scores from
   seed signals.
2. `lib/kb.ts` grounding + `POST /api/generate` (Gemini + Groq); test on seed
   posts. Core value — build first among the working pieces.
3. `POST /api/event` logging to Supabase; a quick metrics read.
4. Scrapers (`refresh.ts`, `discover.ts`) + overrides persistence +
   `/validation`. Scraping last: external and fragile; the app already runs on
   seed data.

Keep everything runnable with zero API keys (seed JSON + mock LLM + in-memory
overrides). The frontend rework to the Hybrid design happens only after the
backend is verified against the minimal harness.
