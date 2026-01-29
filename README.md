# 🦅 Ansury Systems - Enterprise Deployment

High-ticket AI Sales Engine powered by Gemini 3 Pro reasoning.

---

## 🛠 Cloudflare Setup (Must Follow)

### 1. Cloudflare Pages (Main App)
*   **Repo**: Link your GitHub repository.
*   **Build Command**: `npm run build`
*   **Root Directory**: `/`
*   **Output Directory**: `dist`
*   **Variables** (Settings > Variables):
    *   `API_KEY`: Your Gemini API Key.
    *   `NEXT_PUBLIC_SUPABASE_URL`: From Supabase dashboard.
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: From Supabase dashboard.

### 2. Cloudflare R2 (CDN)
The widget is a single-file library. Uploading to R2 ensures zero-latency loading.
*   Run `npm run build`.
*   Take `dist/ansury-widget.umd.js` and upload to an R2 bucket named `ansury-cdn`.
*   Enable a Custom Domain for your bucket (e.g., `cdn.ansury.systems`).

### 3. Cloudflare Worker (The Dynamic Loader)
Deploy this worker to handle the `<script>` tag logic elegantly. This allows you to update the widget without asking clients to update their sites.

```javascript
// worker.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const clientId = url.searchParams.get('cid');
    
    const loaderCode = `
(function() {
  if (window.AnsuryLoaded) return;
  window.AnsuryLoaded = true;
  const container = document.createElement('div');
  container.id = 'ansury-root';
  document.body.appendChild(container);
  const shadow = container.attachShadow({ mode: 'open' });
  const script = document.createElement('script');
  script.src = "https://cdn.ansury.systems/ansury-widget.umd.js";
  script.onload = () => window.AnsuryWidget.mount(shadow, { clientId: "${clientId}" });
  shadow.appendChild(script);
})();`;

    return new Response(loaderCode, {
      headers: { 'Content-Type': 'application/javascript', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
```

---

## 🏗 Database Schema (Supabase)

Execute in SQL Editor:

```sql
-- Client Table
CREATE TABLE clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  primary_color TEXT DEFAULT '#101827',
  greeting TEXT DEFAULT 'Greetings. How may we assist your inquiry?',
  system_instruction TEXT NOT NULL,
  thinking_enabled BOOLEAN DEFAULT true,
  thinking_budget INTEGER DEFAULT 4000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads Table
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

*Architect: Senior Full-Stack Lead | Ansury 2025*
