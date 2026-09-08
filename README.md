# Sapho Growth Inbox

An AI-assisted LinkedIn engagement tool for biotech marketing teams. Automatically generates on-brand, context-aware responses to LinkedIn posts from compounding pharmacy influencers, grounded in an internal knowledge base, with full measurement and multi-model comparison.

## 🎯 Purpose

This tool helps Sapho Bio's marketing team:

1. **Engage efficiently** with industry influencers at scale
2. **Maintain brand consistency** across all LinkedIn interactions
3. **Generate qualified leads** through strategic thought leadership
4. **Measure what works** with detailed engagement analytics
5. **Optimize model selection** by comparing Gemini and Groq performance

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 14 App                        │
├─────────────────────────────────────────────────────────┤
│  Pages:                                                  │
│  • /          → Two-pane inbox (queue + detail)          │
│  • /metrics   → Acceptance rates, latency, conversions   │
│  • /validation → Discovery coverage analysis             │
│  • /compare   → Side-by-side model comparison            │
├─────────────────────────────────────────────────────────┤
│  LLM Provider Layer (lib/llm.ts)                         │
│  ├─ GeminiProvider    (Gemini 2.0 Flash, default)        │
│  └─ GroqProvider      (Llama 3.3 70B)                    │
├─────────────────────────────────────────────────────────┤
│  Knowledge Base (lib/kb.ts)                              │
│  • Keyword-based retrieval (MVP)                         │
│  • TODO: pgvector semantic search                        │
├─────────────────────────────────────────────────────────┤
│  Data Layer                                              │
│  • Seed JSON (influencers, posts, discovery)             │
│  • Supabase Events (optional, for analytics)             │
└─────────────────────────────────────────────────────────┘
```

**Deployment:** Vercel (serverless Next.js)  
**Database:** Supabase Postgres (optional, for event logging)  
**LLMs:** Gemini 2.0 Flash (free tier) or Groq Llama 3.3 70B (free tier)  
**Scraping:** Apify LinkedIn actors (optional, for live data refresh)

## 🚀 Quick Start

### 1. Installation

```bash
git clone https://github.com/can-karakoc/sapho-bio-assessment.git
cd sapho-growth-inbox
npm install
```

### 2. Configuration (Optional)

The app **works fully offline** with seed data and mock LLM responses. To enable live features:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:

- **GEMINI_API_KEY**: Free at https://aistudio.google.com/app/apikey
- **GROQ_API_KEY**: Free at https://console.groq.com/keys
- **SUPABASE_URL + SERVICE_ROLE_KEY**: Free at https://supabase.com (run `/supabase/schema.sql` after creating project)
- **APIFY_TOKEN**: For live LinkedIn scraping (optional)

### 3. Run the App

```bash
npm run dev
```

Open http://localhost:3000

## 📚 Usage

### Main Inbox

1. **Select a post** from the left-hand queue
2. **Configure your response**:
   - **Goal**: Engagement / Lead Gen / Thought Leadership
   - **Brand Voice**: Professional-Friendly / Authoritative / Collaborative / Educational
   - **Additional Instructions**: Custom tweaks for this response
3. **Generate** a response using the selected LLM
4. **Review** the generated text (sources, latency, "needs review" flag)
5. **Edit** in-place if needed
6. **Copy & Open Post** to paste your comment and engage

Every action is logged for measurement.

### Metrics Dashboard (`/metrics`)

Track:

- Acceptance rate (posted / generated)
- Performance by goal type
- Average latency by provider
- Generations per influencer

### Model Comparison (`/compare`)

Run the same post+config through **both** Gemini and Groq side-by-side to evaluate:

- **Quality**: Which response is more on-brand, more engaging?
- **Speed**: Latency comparison (typically Groq is faster)

Use this to inform your `LLM_PROVIDER` selection.

### Influencer Validation (`/validation`)

See how well your **curated** influencer list overlaps with **discovery** results:

- **Overlap**: Influencers confirmed by both manual curation and algorithmic discovery
- **Gaps**: High-engagement influencers the algorithm found that you haven't added yet
- **Manual Only**: Curated picks the algorithm didn't surface (may use different keywords)

## 🛠️ Scripts

### Refresh Posts (`npm run refresh`)

Scrapes fresh LinkedIn posts from your curated influencer list using Apify.

**Requires:** `APIFY_TOKEN`

```bash
npm run refresh
```

Updates `data/posts.json` with live posts.

### Discover Influencers (`npm run discover`)

Runs keyword-based LinkedIn post searches to discover new influencers:

- Keywords: "compounding pharmacy", "503B", "sterile compounding", "USP 797", etc.
- Ranks authors by post frequency and total engagement
- Saves results to `data/discovery.json`

**Requires:** `APIFY_TOKEN`

```bash
npm run discover
```

Then visit `/validation` to see the coverage analysis.

## 📦 Data Files

### `data/influencers.json`

Your curated list of 10 compounding pharmacy influencers. **Edit this file** to add/remove influencers.

### `data/posts.json`

LinkedIn posts from those influencers. Starts with 30 seed posts. Regenerate with `npm run refresh`.

### `data/discovery.json`

Influencer discovery results from `npm run discover`. Auto-generated, don't edit manually.

### `knowledge/*.md`

Your knowledge base:

- **sapho-bio-facts.md**: Company info, products, value prop *(TODO: fill in real content)*
- **brand-voice.md**: Tone guidelines, example responses *(TODO: fill in real content)*
- **compounding-pharmacy-primer.md**: Industry context (already has baseline content)

**Action required:** Replace placeholder TODO sections with real Sapho Bio content.

## 🧪 Growth Hypotheses

This tool tests:

1. **AI can maintain brand voice at scale** → Measure: acceptance rate by brand voice setting
2. **Contextual responses outperform generic ones** → Measure: engagement on posted comments (manual tracking)
3. **Lead-gen goal increases qualified inbound** → Measure: LinkedIn DM/connection requests after posting
4. **Thought leadership builds authority** → Measure: profile views, followers gained (manual tracking)
5. **Model choice affects quality and cost** → Measure: acceptance rate + latency by provider

## 🔐 Limitations & Disclaimers

### LinkedIn ToS

This tool **does not auto-post** to LinkedIn. The "Copy & Open Post" flow:

1. Copies generated text to clipboard
2. Opens the LinkedIn post in a new tab
3. Logs the action as "posted" for measurement

You still **manually paste and submit** the comment. This keeps you in control and compliant with LinkedIn's ToS.

### Scraping

The Apify actors use **no-cookie** LinkedIn scraping (public data only). LinkedIn's ToS prohibit automated scraping of logged-in content. Apify's public-data actors are designed to stay compliant, but check LinkedIn's latest policies before deploying at scale.

### Data Privacy

- **Seed data** is synthetic/public (names, companies, post snippets are realistic but not real individuals)
- **Event logging** stores generated responses in Supabase—do not log PII or confidential business data
- **Knowledge base** files may contain proprietary info—keep this repo private

### API Costs

- **Gemini 2.0 Flash**: Free tier = 15 RPM, 1500 RPD
- **Groq Llama 3.3 70B**: Free tier with rate limits
- **Apify**: Free tier = 5 monthly scraping runs; paid plans for more

Monitor your usage to avoid surprise bills.

## 📈 Success Metrics (Logged Automatically)

The `events` table in Supabase tracks:

| Metric                     | What It Measures                                    |
| -------------------------- | --------------------------------------------------- |
| **Acceptance Rate**        | % of generations that get posted                    |
| **Edits per Goal**         | How much generated text needs tweaking by goal type |
| **Avg Latency**            | Speed by provider (Gemini vs Groq)                  |
| **Generations per Post**   | Re-generation count (low = good first-gen quality)  |
| **Posted by Brand Voice**  | Which tone performs best                            |

**Manual tracking** (not in the tool):

- LinkedIn comment engagement (likes, replies)
- DMs/connection requests from influencers
- Profile views, follower growth

## 🗂️ Project Structure

```
sapho-growth-inbox/
├── app/
│   ├── page.tsx              # Main inbox (two-pane UI)
│   ├── metrics/              # Analytics dashboard
│   ├── validation/           # Discovery coverage
│   ├── compare/              # Model comparison
│   └── api/
│       ├── generate/         # POST /api/generate
│       └── event/            # POST /api/event
├── components/
│   ├── PostListItem.tsx      # Queue item
│   └── PostDetailPane.tsx    # Detail + config + actions
├── lib/
│   ├── llm.ts                # Provider abstraction (Gemini, Groq)
│   ├── kb.ts                 # Knowledge base loader
│   ├── events.ts             # Supabase event logging
│   ├── data.ts               # Seed data loaders
│   └── types.ts              # TypeScript types
├── data/
│   ├── influencers.json      # Curated influencer list
│   ├── posts.json            # LinkedIn posts (seed or scraped)
│   └── discovery.json        # Discovery results (generated)
├── knowledge/
│   ├── sapho-bio-facts.md
│   ├── brand-voice.md
│   └── compounding-pharmacy-primer.md
├── scripts/
│   ├── refresh.ts            # Scrape fresh posts
│   └── discover.ts           # Discover new influencers
├── supabase/
│   └── schema.sql            # Events table DDL
├── .env.example              # Environment variables template
└── README.md                 # This file
```

## 🔗 GitHub Repository

https://github.com/can-karakoc/sapho-bio-assessment

## 🚢 Deployment (Vercel)

1. Push code to GitHub
2. Connect repo to Vercel: https://vercel.com/new
3. Add environment variables in Vercel dashboard (same as `.env.local`)
4. Deploy

Vercel's free tier supports serverless Next.js apps.

## 🛡️ Security Notes

- **Do not commit `.env.local`** (already in `.gitignore`)
- **Keep `SUPABASE_SERVICE_ROLE_KEY` secret** (bypass RLS)
- **Rotate Apify token** if it leaks (manage in Apify console)
- **Review generated responses** before posting—LLMs can hallucinate

## 📝 Next Steps / TODO

1. **Fill in knowledge base** (`knowledge/*.md`) with real Sapho Bio content
2. **Run discovery** (`npm run discover`) to validate influencer list
3. **Test model comparison** (`/compare`) and pick preferred provider
4. **Measure for 2 weeks**, then review metrics dashboard
5. **Iterate on prompts** based on acceptance rate + manual engagement feedback

### Future Enhancements

- **pgvector retrieval** for KB (replace keyword matching)
- **Webhook integration** to auto-refresh posts daily
- **Slack notifications** when high-priority influencers post
- **A/B testing framework** for prompt variants
- **Lead scoring** based on comment reply sentiment

---

Built for the Sapho Bio growth team. Questions? Check the code or reach out.
