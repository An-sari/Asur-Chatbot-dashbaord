# 🦅 Ansury Systems - Enterprise AI Sales Engine

A production-ready, multi-tenant sales system leveraging Gemini 3's "Thinking" capabilities.

---

## 🏗 High-Performance Stack

### 1. Cloudflare R2 (Static Asset Delivery)
We bundle the widget into a single JS file and host it on R2. This ensures 100% uptime and sub-50ms loading globally.
- Bucket: `ansury-cdn`
- File: `ansury-widget.umd.js`
- Domain: `cdn.ansury.systems`

### 2. Cloudflare Workers (The Gatekeeper)
The `loader.js` is served via a Worker to handle dynamic versioning and security checks.

```javascript
// deploy this to workers.ansury.systems/loader.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const clientId = url.searchParams.get('cid');
    
    const script = `
      (function() {
        if (window.AnsuryInited) return;
        window.AnsuryInited = true;
        const root = document.createElement('div');
        root.id = 'ansury-root';
        document.body.appendChild(root);
        const shadow = root.attachShadow({ mode: 'open' });
        const s = document.createElement('script');
        s.src = "https://cdn.ansury.systems/ansury-widget.umd.js";
        s.onload = () => window.AnsuryWidget.mount(shadow, { clientId: "${clientId}" });
        shadow.appendChild(s);
      })();
    `;
    return new Response(script, { headers: { 'Content-Type': 'application/javascript' } });
  }
}
```

### 3. Cloudflare Pages (Core Application)
Hosts the `/dashboard` and `/api/chat` routes.
- **Build Command**: `npm run build`
- **Output Dir**: `dist`
- **Env**: `API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`

---

## ⚡ Production SQL (Supabase)

```sql
CREATE TABLE clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  primary_color TEXT DEFAULT '#4F46E5',
  greeting TEXT DEFAULT 'Hello',
  system_instruction TEXT DEFAULT 'You are a sales pro.',
  thinking_enabled BOOLEAN DEFAULT false,
  thinking_budget INTEGER DEFAULT 2000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT REFERENCES clients(id),
  name TEXT,
  email TEXT,
  chat_transcript JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

*Architect: Senior Engineer | Ansury Systems 2025*
