-- Survey leads for the standalone Cloudflare Worker campaign.
-- Completely separate from Firestore campaign_leads.

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  role_other TEXT,
  property_count TEXT NOT NULL,
  time_sinks TEXT NOT NULL,
  time_sinks_other TEXT,
  admin_hours TEXT NOT NULL,
  biggest_gains TEXT NOT NULL,
  biggest_gain TEXT,
  biggest_gain_other TEXT,
  frustration TEXT,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  activated INTEGER NOT NULL DEFAULT 0,
  activated_at TEXT,
  session_token_hash TEXT NOT NULL,
  token_expires_at INTEGER NOT NULL,
  submitted_at TEXT NOT NULL,
  ip_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_leads_submitted_at ON leads (submitted_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (email);
CREATE INDEX IF NOT EXISTS idx_leads_role ON leads (role);

CREATE TABLE IF NOT EXISTS rate_limits (
  ip_hash TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip_hash, window_start)
);
