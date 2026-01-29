# 🦅 Ansury Systems - Master Setup

Follow these steps to ensure the engine is fully operational.

---

## 🛠 Database Schema (Supabase) - MASTER REPAIR SCRIPT

Paste this entire block into your Supabase **SQL Editor** and click **Run**. 
*Note: This script safely adjusts types to resolve the "invalid input syntax for type uuid" error and sets up the required tables.*

```sql
-- 1. Create/Adjust Clients Table
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY, -- Custom slugs or IDs
  user_id TEXT NOT NULL, -- TEXT to support 'user_123'
  name TEXT NOT NULL,
  primary_color TEXT DEFAULT '#101827',
  greeting TEXT DEFAULT 'Greetings. How may we assist your inquiry?',
  system_instruction TEXT NOT NULL,
  thinking_enabled BOOLEAN DEFAULT true,
  thinking_budget INTEGER DEFAULT 4000,
  authorized_origins TEXT[] DEFAULT ARRAY['*'],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely force user_id to TEXT if it was previously UUID
DO $$ 
BEGIN 
    ALTER TABLE clients ALTER COLUMN user_id TYPE TEXT;
EXCEPTION 
    WHEN others THEN NULL; 
END $$;

-- 2. Create/Adjust Leads Table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Auto-gen to prevent 409 Conflict
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  chat_transcript JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Realtime
-- This allows the dashboard to update the widget instantly without refresh
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE clients, leads;
COMMIT;
```

---

## 🛠 Cloudflare Setup
*   **API_KEY**: Set in Pages > Settings > Environment Variables (not VITE_ prefix).
*   **VITE_SUPABASE_URL**: Set in Environment Variables.
*   **VITE_SUPABASE_ANON_KEY**: Set in Environment Variables.

*Architect: Senior Full-Stack Lead | Ansury 2025*