
# 🦅 Ansury Systems - Enterprise Deployment

High-ticket AI Sales Engine powered by Gemini 3 Pro reasoning.

---

## 🛠 Database Schema (Supabase) - REPAIR & UPGRADE

If you are seeing "column not found" errors, run this script in your Supabase SQL Editor. It will safely add missing columns without deleting your data.

```sql
-- 1. Upgrade Clients Table
ALTER TABLE IF EXISTS clients 
ADD COLUMN IF NOT EXISTS user_id TEXT,
ADD COLUMN IF NOT EXISTS thinking_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS thinking_budget INTEGER DEFAULT 4000,
ADD COLUMN IF NOT EXISTS authorized_origins TEXT[] DEFAULT ARRAY['*'];

-- 2. Upgrade Leads Table
-- Ensure ID is auto-generated to avoid 409 Conflict
ALTER TABLE IF EXISTS leads 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Create API Keys Table (Optional but recommended for high-ticket)
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Verify/Re-create Clients Table if it doesn't exist
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  primary_color TEXT DEFAULT '#101827',
  greeting TEXT DEFAULT 'Greetings. How may we assist your inquiry?',
  system_instruction TEXT NOT NULL,
  thinking_enabled BOOLEAN DEFAULT true,
  thinking_budget INTEGER DEFAULT 4000,
  authorized_origins TEXT[] DEFAULT ARRAY['*'],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🛠 Cloudflare Setup
*   **API_KEY**: Set in Pages > Settings > Environment Variables.
*   **VITE_SUPABASE_URL**: Set in Environment Variables.
*   **VITE_SUPABASE_ANON_KEY**: Set in Environment Variables.

*Architect: Senior Full-Stack Lead | Ansury 2025*
