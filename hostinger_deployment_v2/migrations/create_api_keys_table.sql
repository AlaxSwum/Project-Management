-- Create api_keys table for external API authentication (ChatGPT, etc.)
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT 'Default API Key',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

-- Index for fast key lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);

-- Allow public access (since we're using anon key + custom auth)
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: allow all operations (auth is handled in application layer)
CREATE POLICY "Allow all api_keys operations" ON api_keys
    FOR ALL USING (true) WITH CHECK (true);
