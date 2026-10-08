CREATE TABLE IF NOT EXISTS agent_runs (
  id TEXT PRIMARY KEY,
  input TEXT NOT NULL,
  routerDecision JSONB NOT NULL,
  contributions JSONB NOT NULL,
  totalConfidence DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
