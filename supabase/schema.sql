-- Sapho Growth Inbox - Events Table
--
-- This table logs all user actions and LLM generations for measurement and analytics
--
-- Setup instructions:
-- 1. Create a Supabase project at https://supabase.com
-- 2. Go to SQL Editor and run this schema
-- 3. Copy your project URL and service role key to .env.local

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Post reference
  post_id TEXT NOT NULL,

  -- Action type
  action TEXT NOT NULL CHECK (action IN ('generated', 'regenerated', 'copied', 'edited', 'posted', 'skipped')),

  -- Generation configuration (JSON)
  config JSONB,

  -- LLM details
  model TEXT,
  provider TEXT,
  latency_ms INTEGER,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,

  -- Generated/edited output
  output_text TEXT,
  edit_distance INTEGER, -- Levenshtein distance for edits

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_events_post_id ON events(post_id);
CREATE INDEX IF NOT EXISTS idx_events_action ON events(action);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_provider ON events(provider);

-- Enable Row Level Security (optional - disable for MVP with service role key)
-- ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Comments for documentation
COMMENT ON TABLE events IS 'Logs all user actions and LLM generations for the Sapho Growth Inbox tool';
COMMENT ON COLUMN events.post_id IS 'Reference to the LinkedIn post (from posts.json)';
COMMENT ON COLUMN events.action IS 'Type of action: generated, regenerated, copied, edited, posted, skipped';
COMMENT ON COLUMN events.config IS 'JSON object containing goal, brandVoice, and instructions used for generation';
COMMENT ON COLUMN events.model IS 'LLM model name (e.g., gemini-2.0-flash-exp, llama-3.3-70b-versatile)';
COMMENT ON COLUMN events.provider IS 'LLM provider name (gemini, groq)';
COMMENT ON COLUMN events.latency_ms IS 'Generation latency in milliseconds';
COMMENT ON COLUMN events.output_text IS 'Generated or edited response text';
COMMENT ON COLUMN events.edit_distance IS 'Levenshtein distance between generated and final edited text';

-- Example queries for analytics

-- Acceptance rate by goal
-- SELECT
--   config->>'goal' as goal,
--   COUNT(CASE WHEN action = 'posted' THEN 1 END)::FLOAT / COUNT(*) as acceptance_rate
-- FROM events
-- WHERE action IN ('generated', 'regenerated', 'posted')
-- GROUP BY config->>'goal';

-- Average latency by provider
-- SELECT
--   provider,
--   AVG(latency_ms) as avg_latency_ms,
--   COUNT(*) as generations
-- FROM events
-- WHERE action IN ('generated', 'regenerated')
-- GROUP BY provider;

-- Generations per influencer (requires join with posts data)
-- SELECT
--   post_id,
--   COUNT(*) as generation_count
-- FROM events
-- WHERE action IN ('generated', 'regenerated')
-- GROUP BY post_id
-- ORDER BY generation_count DESC;
