# API Testing Guide

Quick reference for testing the backend APIs with curl or the test script.

## Prerequisites

```bash
# Start the dev server
npm run dev

# In another terminal, run tests
./scripts/test-api.sh

# Or use curl directly (examples below)
```

## POST /api/generate

Generate a LinkedIn response for a post.

### Request Contract
```typescript
{
  postId: string;
  config: {
    goal: 'comment' | 'dm';
    brandVoice: string;
    instructions: string;
  }
}
```

### Response Contract
```typescript
{
  text: string;           // Generated response text
  model: string;          // Model name (e.g., "gemini-2.0-flash-exp")
  latencyMs: number;      // Generation time in ms
  usedSources: string[];  // KB files that grounded the response
  needsReview: boolean;   // True if human review recommended
  variantId: string;      // Unique ID for this generation
  provider?: string;      // "gemini" or "groq"
}
```

### Example: Generate Comment

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "post-001",
    "config": {
      "goal": "comment",
      "brandVoice": "professional-friendly",
      "instructions": "Mention our rapid sterility platform"
    }
  }'
```

**Expected Response (with API key):**
```json
{
  "text": "Great insights! Environmental monitoring truly is the foundation of quality in sterile compounding...",
  "model": "gemini-2.0-flash-exp",
  "latencyMs": 1250,
  "usedSources": ["sapho-bio-facts.md", "brand-voice.md", "compounding-pharmacy-primer.md"],
  "needsReview": false,
  "variantId": "1725814800000-a1b2c3d4e",
  "provider": "gemini"
}
```

**Expected Response (NO API key - mock):**
```json
{
  "text": "[MOCK RESPONSE - No Gemini API key configured]\n\nGreat insights! Environmental monitoring truly...",
  "model": "gemini-2.0-flash-exp (mock)",
  "latencyMs": 2,
  "usedSources": ["sapho-bio-facts.md", "brand-voice.md"],
  "needsReview": true,
  "variantId": "1725814800000-a1b2c3d4e",
  "provider": "gemini"
}
```

### Example: Generate DM

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "post-002",
    "config": {
      "goal": "dm",
      "brandVoice": "authoritative",
      "instructions": "Reference USP 1223 validation"
    }
  }'
```

DM responses always have `needsReview: true` by design.

### Error Cases

**400 - Missing fields:**
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"postId": "post-001"}'

# Response: {"error": "Missing postId or config"}
```

**404 - Post not found:**
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "invalid-post",
    "config": {"goal": "comment", "brandVoice": "professional-friendly", "instructions": ""}
  }'

# Response: {"error": "Post not found"}
```

## POST /api/event

Log a user action or generation event.

### Request Contract
```typescript
{
  postId: string;
  action: 'generated' | 'regenerated' | 'copied' | 'edited' | 'posted' | 'skipped';
  config?: GenerationConfig;
  model?: string;
  provider?: string;
  latencyMs?: number;
  promptTokens?: number;
  completionTokens?: number;
  outputText?: string;
  editDistance?: number;
}
```

### Response
```json
{"success": true}
```

### Example: Log Copy Action

```bash
curl -X POST http://localhost:3000/api/event \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "post-001",
    "action": "copied"
  }'
```

### Example: Log Posted Action (Full Metadata)

```bash
curl -X POST http://localhost:3000/api/event \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "post-001",
    "action": "posted",
    "config": {
      "goal": "comment",
      "brandVoice": "professional-friendly",
      "instructions": ""
    },
    "model": "gemini-2.0-flash-exp",
    "provider": "gemini",
    "latencyMs": 1250,
    "outputText": "Great insights! Environmental monitoring..."
  }'
```

## Testing with Different Providers

Set `LLM_PROVIDER` in `.env.local` to switch between providers:

```bash
# Use Gemini (default)
LLM_PROVIDER=gemini

# Use Groq
LLM_PROVIDER=groq
```

Both providers fall back to clearly-labeled mock responses when API keys are absent.

## Verification Checklist

- [ ] `/api/generate` returns mock response with no API keys
- [ ] Mock responses include `[MOCK RESPONSE - ...]` prefix
- [ ] Mock responses have `needsReview: true`
- [ ] `usedSources` includes relevant KB files
- [ ] `variantId` is unique per generation
- [ ] DM responses always have `needsReview: true`
- [ ] `/api/event` logs to console when Supabase not configured
- [ ] Error cases return proper 400/404 status codes
