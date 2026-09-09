# Sapho Engage — Posting Model, Live vs. Roadmap (README framing)

## Posting model and LinkedIn integration

Sapho Engage is built as a human-in-the-loop drafting and measurement tool rather than an autonomous posting bot, a boundary that reflects both LinkedIn's platform rules and the realities of operating in a regulated industry. LinkedIn does not permit programmatic commenting or direct messaging through its ordinary developer APIs, since those capabilities are reserved for approved Marketing and Community Management partners. Consequently no responsible implementation of this workflow can silently post on a user's behalf, and this prototype does not attempt to.

Instead, the application treats posting as an assisted action. When a marketer approves a generated response, the tool copies it to the clipboard, opens the original LinkedIn post or the influencer's profile in a new tab, and records the action in the event log, after which the person completes the final paste-and-publish step. This keeps a human in control of everything that reaches the public feed while preserving an auditable trail of what was generated and acted upon, and it satisfies the assignment's optional "one-click deploy and logging" requirement in the only manner consistent with LinkedIn's terms.

## Live vs. roadmap

The following capabilities are fully implemented and demonstrable in this MVP:

- Influencer discovery and a transparent, auditable ranking across reach, cadence, resonance, relevance, and recency, with manual pin, mute, and add overrides that persist across ranking runs.
- Knowledge-grounded response generation with a configurable goal (public comment versus direct message), brand voice, and freeform instructions.
- Assisted posting through the copy-open-log flow described above, together with a searchable history of the responses produced during a session.
- Measurement through per-response event logging and an aggregate metrics view.
- Multi-model comparison across Gemini and Groq for evaluating draft quality and latency against one another.

The following capabilities are intentionally scoped as roadmap items and are represented in the interface as clearly labeled, non-live placeholders, because each depends on data access this prototype deliberately does not assume:

- Automated engagement tracking, whereby the likes and comments a posted response earns are read back automatically to inform subsequent drafts. This requires LinkedIn Marketing Partner API access; in the MVP the same feedback loop is available through manual outcome entry, which then conditions the next generation.
- Conversation continuation, whereby replies to a posted response are threaded and answered in context. This likewise depends on partner-level read access.
- Continuous knowledge-base ingestion, whereby internal and external sources refresh automatically rather than through the provided discovery and refresh scripts.

Presenting these as a deliberate boundary rather than as missing features is the point. The system is designed so that each roadmap capability slots into an existing seam, the event log, the generation prompt, and the knowledge-base loader respectively, once the corresponding data access becomes available.
