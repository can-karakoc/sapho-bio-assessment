# Sapho Engage — Loom Walkthrough Script

Target length ~5-6 minutes. Bracketed lines are stage directions; the rest is spoken narration.

---

### 0. Cold open  (~15s)
[Start on the Influencers tab, app already loaded.]

"This is Sapho Engage, an internal growth tool I built for Sapho Bio. It helps the marketing team find the right voices in the compounding-pharmacy space, draft on-brand LinkedIn responses that are grounded in Sapho's own knowledge, and measure what works. I'll walk through the whole pipeline, from discovering an influencer to publishing a response, and I'll be explicit about what is live today versus what is deliberately scoped as roadmap."

---

### 1. The ranked influencer list  (~50s)
[Stay on the Influencers leaderboard. Scroll slowly.]

"The team lands on a ranked leaderboard of the top ten influencers in the compounding-pharmacy industry, which is the first deliverable in the brief. This is not a hand-typed list. Each person carries a composite score built from five auditable signals: reach, cadence, resonance, relevance, and recency. I assembled the list by pairing manual curation of known figures, such as leadership at the Alliance for Pharmacy Compounding, with an automated discovery run that scraped more than two hundred and fifty candidates from LinkedIn and ranked them, so the human judgment and the algorithm reinforce each other rather than competing."

[Point at a sparkline.]

"The small line next to each person is a recent-engagement sparkline. Every point is the engagement, meaning reactions plus comments, on one of their recent posts, so a jagged line signals variable performance and a flatter line signals either steady output or fewer data points. It is normalized per influencer, so it communicates a pattern rather than an absolute number."

[Hover the pin and mute controls; click Recompute.]

"The team keeps control on top of the algorithm. They can pin someone to force them onto the list, mute someone, or add a person the crawler missed, and Recompute re-runs discovery and surfaces new candidates."

---

### 2. Drill into an influencer  (~30s)
[Click an influencer row to open the workspace.]

"Clicking a person opens their workspace. Here you see the full score broken into its five components, and their recent posts filtered by an adjustable time window. This is the strategy surface, the place where the team decides who is worth engaging and understands why the model ranked them where it did."

---

### 3. The Response Queue  (~30s)
[Switch to the Response Queue tab.]

"The Response Queue is the execution surface. It shows every unactioned post across all influencers, more than two hundred of them, newest first. I can filter by influencer or sort by likes, comments, or date to prioritize the highest-leverage posts, and the cards collapse by default so a large queue stays scannable. If I want the full context of a post, I expand it in place."

---

### 4. Generating a grounded response  (~70s)
[Open one post's card. Select Comment and a voice, then Generate. Let it stream.]

"For any post I choose a response type, Comment for engagement or a direct message for lead generation, and a brand voice. When I generate, the response streams in live, token by token, the way a modern assistant feels. The important part is underneath: the response is grounded in Sapho's knowledge base, which I built as a set of source-of-truth documents covering the brand voice, the company's facts, and a primer on the compounding-pharmacy regulatory landscape. The chips show exactly which of those sources informed this draft, so the output stays accurate and on message rather than generic, and it shows which model produced it and how long it took."

[Point at the grounding chips and the model/latency line.]

"That grounding layer is the part of the brief I cared most about, an authoritative knowledge base that keeps generated content accurate without constant manual review."

---

### 5. Regenerating with control, and the evaluation loop  (~50s)
[Open the Regenerate tweaks panel. Show the chips and the custom-instruction field.]

"Regeneration is steerable rather than a blind re-roll. I can change the voice or type and they persist, or apply quick tweaks like shorter, warmer, more technical, or add a question, or type a custom instruction in plain language. There is also a 'no pitch' option, and that one came directly out of testing. I evaluated a draft that shoehorned Sapho's product onto a purely educational post about cleanroom certification, which read as self-serving. So I added a rule to the knowledge base and a one-click tweak to enforce it. That is the evaluation-to-tooling loop the role is really about: I graded the output against a rubric of relevance, added value, brand fit, and accuracy, caught a failure mode, and fixed it at the source."

---

### 6. Posting, with a human in the loop  (~35s)
[Click Post on a drafted card. Show the new tab opening and the status flipping to Posted.]

"Posting is a compliant, single-click assist. LinkedIn's API does not permit programmatic commenting or direct messaging for non-partner applications, so rather than fake automatic posting, the tool copies the draft, opens the exact post or profile, and logs the action, leaving the person to publish. That keeps a human in control of everything that reaches the public feed while preserving an auditable trail. True one-click auto-posting is a roadmap item that plugs into the same event log the moment partner API access is available."

---

### 7. History and the learning loop  (~35s)
[Switch to the History tab. Show a past entry; record a manual outcome; regenerate with feedback.]

"Every generation and post is logged to a History view, a searchable record of what the team sent. And because we cannot yet read engagement back automatically, I built a manual outcome loop: the marketer records the likes and comments a response earned, then regenerates an improved version that takes that feedback into account. The automated version of this loop is roadmap, since it depends on the same partner API."

---

### 8. Architecture and persistence, briefly  (~30s)
[Optional: mention while on any screen.]

"A quick note on how state is handled. The reference data, meaning the influencers, their posts, and the knowledge base, lives in versioned files populated by the Apify pipeline, and the backend runs real API routes for generation, logging, and overrides, with Supabase for durable event logging. The generated drafts themselves persist in the browser through localStorage, which is a deliberate choice for this MVP: anyone can open the app and try it with zero setup, and nothing they generate is written to the repository or shared, so the demo stays clean and reproducible. The tradeoff is that localStorage is per-browser, so drafts do not sync across devices yet, and moving that state server-side is the first thing I would do in production."

---

### 9. Live versus roadmap, and close  (~50s)

"To be clear about scope, here is what is live today: influencer discovery and auditable ranking, knowledge-grounded generation with configurable goal, voice, and instructions, assisted posting, a searchable response history, event logging, and a swappable model layer across Gemini and Groq."

"And here is what is intentionally scoped as roadmap, each represented as a labeled placeholder rather than faked. First, the aggregate measurement dashboards and a side-by-side model-comparison view. Second, a closed engagement loop, which has two halves: response-stats tracking, where the tool reads back the likes and comments each posted response actually earns and feeds that signal into the next draft, and a two-way responding layer, so that when someone engages with our comment the team can reply to them directly and turn a single post into an ongoing conversation. Each of these depends on LinkedIn partner-level data access this prototype deliberately does not assume, which is why they are stubbed rather than faked."

"So the full loop is: discover and rank the right influencers, triage their posts, generate a grounded and on-brand response, evaluate and tune it, publish it with a human in the loop, and log the outcome so the system can learn. The nearest next steps are the aggregate metrics dashboard and the model-comparison view, both of which plug straight into the logging that is already in place, followed by that engagement-tracking and conversation layer once partner API access is available. Thanks for watching."

---

## Delivery notes
- Before recording: delete `components/PostCard.tsx.backup`, commit a clean checkpoint, and click "Clear session data" so History starts empty.
- Keep the whole thing to five or six minutes; sections 4 and 5 are the heart of it, so give them room and move quickly through 2 and 3.
- If you build the measurement pages before recording, move them from the roadmap list in section 9 into a short demo after section 7.
