# 🦅 Ansury Systems - High-Ticket AI Sales Engine

Ansury is a multi-tenant, portable AI sales widget designed for high-ticket service businesses. It turns website traffic into qualified leads using Google's Gemini 1.5 Flash and a real-time branding engine.

---

## 🚀 Quick Start Guide

### 1. Database Setup (Supabase)
Run this script in your [Supabase SQL Editor](https://app.supabase.com/) to create the foundation.

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients Table (The Brain & Body)
CREATE TABLE clients (
    id TEXT PRIMARY KEY, 
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    primary_color TEXT DEFAULT '#4F46E5',
    greeting TEXT DEFAULT 'How can I help you?',
    system_instruction TEXT DEFAULT 'You are a professional assistant.',
    authorized_origins TEXT[] DEFAULT ARRAY['*'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads Table (The ROI)
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id TEXT REFERENCES clients(id),
    name TEXT,
    email TEXT,
    phone TEXT,
    chat_transcript JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Keys (Security)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id TEXT REFERENCES clients(id),
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE clients;
```

### 2. Environment Configuration
Ensure your `.env` (or Vercel/Cloudflare Variables) contains:
- `API_KEY`: Your Google Gemini API Key.
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anonymous Key.

### 3. Implementation (The 2-Line Script)
Clients simply paste this into their site:
```html
<script 
  src="https://your-app.com/loader.js" 
  data-client-id="client-slug-here" 
  async
></script>
```

---

## 🛠 Features

### 🏢 Multi-Tenancy
Each client has a unique `id`. The backend fetches specific `system_instruction` and `primary_color` dynamically based on this ID.

### 🎨 Real-time Branding
The widget uses Supabase Realtime. When a client changes their brand color in the Dashboard, the widget on their live website updates **instantly** without a page refresh.

### 🎣 Lead Capture Bridge
After 3 messages (customizable), the AI pauses to trigger a high-conversion lead form. All data is saved to the `leads` table for the client to close the deal.

---

## ☁️ Hosting & Deployment

### Backend (Vercel)
- Best for Next.js deployments.
- Deploy the `/api/chat` route as a Serverless Function.

### CDN & Loader (Cloudflare)
- Upload `loader.js` and your bundled React widget to **Cloudflare R2** or **Pages**.
- Use **Cloudflare Workers** for the fastest global delivery of the loader script.

### Production Bundling
Use Vite's "Library Mode" to bundle `ChatWidget.tsx` into a single `ansury-widget.js` file.
```bash
npm run build -- --lib
```

---

## 🛡 Security
1. **CORS**: The API checks `authorized_origins`.
2. **Shadow DOM**: The `loader.js` uses `attachShadow` to prevent host site CSS from breaking the widget UI.
3. **RLS**: Supabase Row Level Security ensures clients can only see their own leads.

---

*Built by Founder & Architect Alex Rivera | Ansury Systems © 2025*
