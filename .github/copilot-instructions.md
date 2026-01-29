Purpose
-------
This document tells AI coding agents how this repository is structured and where to make changes safely and productively.

High-level architecture
-----------------------
- Frontend: React + Vite app (entry points: `index.tsx`, `App.tsx`) driving UI components in `components/`.
- Server/API: a serverless route at `app/api/chat/route.ts` handles chat POSTs, authenticates (optional `x-api-key`), fetches client config from Supabase, and calls Google GenAI.
- AI helpers: `lib/ai.ts` contains the high-level functions that prepare prompts, choose Gemini models, and declare tool functions.
- Storage & realtime: `lib/supabase.ts` provides the Supabase client; client config and API keys live in a `clients` table and `api_keys` table.

Key flows and why
-----------------
- Chat flow: UI sends messages → `/api/chat` with `clientId` → server reads client config from `clients` → calls Gemini via `@google/genai` → returns `{ text }` JSON. See `app/api/chat/route.ts`.
- Config & control: `clients` row contains `system_instruction`, `thinking_enabled`, `thinking_budget`, `greeting`, `primary_color`, etc. The Dashboard (`components/Dashboard.tsx`) edits and upserts this row.
- Realtime updates: `ChatWidget.tsx` subscribes to `supabase.channel('live-${clientId}')` so dashboard changes push to live widgets.
- Model selection: `lib/ai.ts` toggles between `'gemini-3-pro-preview'` and `'gemini-3-flash-preview'` based on `thinking_enabled`.

Developer workflows
-------------------
- Install & run dev server:

  npm install
  npm run dev

- Build and preview:

  npm run build
  npm run preview

- Environment & secrets:
  - `API_KEY` (Google GenAI key) must be set in the environment for server routes to call Gemini. `lib/ai.ts` and `app/api/chat/route.ts` read `process.env.API_KEY`.
  - `lib/supabase.ts` currently contains a hardcoded Supabase URL + anon key for local use; prefer replacing these with env vars in production.
  - Supabase setup: `lib/supabase.ts` includes a comment listing required tables (`clients`, `api_keys`) and RLS guidance—ensure those exist in the project's Supabase instance.

Project-specific conventions & patterns
-------------------------------------
- DB-first config: Most runtime behavior is driven by the `clients` DB row. To change system instructions or greetings, update the `clients.system_instruction` field (Dashboard UI writes this via `supabase.from('clients').upsert(...)`).
- Role mapping: When preparing history for Gemini, code maps `assistant` → `model` and `user` → `user`. See history construction in `app/api/chat/route.ts` and `components/ChatWidget.tsx`.
- Tool declarations: `lib/ai.ts` registers function declarations (e.g., `get_product_details`) and expects the AI response to include `functionCalls`. Currently tool execution is mocked/logged—implement actual tool handlers if needed.
- Error handling: API route logs errors with `console.error` and returns simple HTTP responses (404/401/403/500). Keep messages short and status codes explicit.

Integration points
------------------
- `@google/genai` — used in `lib/ai.ts` and `app/api/chat/route.ts`. Model names are in code; change here to use different Gemini variants.
- Supabase — `lib/supabase.ts` client is used across UI & server code. Realtime channel names follow `live-${clientId}`.

Where to edit for common tasks (examples)
----------------------------------------
- Change the model or temperature: edit `lib/ai.ts` (model selection and config.temperature).
- Add a new tool that the model can call: add a `FunctionDeclaration` in `lib/ai.ts`, implement the execution in `lib/ai.ts` or `app/api/chat/route.ts` where `response.functionCalls` is processed.
- Lock down auth: `app/api/chat/route.ts` checks `x-api-key` then falls back to origin validation using `clients.authorized_origins` — modify here for stricter policies.
- Update Supabase schema or SQL: see the inline comment in `lib/supabase.ts` for required tables and RLS guidance.

Debugging tips
--------------
- Use browser DevTools to watch the POST to `/api/chat` and inspect the returned JSON `{ text }`.
- Server logs: `console.error` in `app/api/chat/route.ts` and `lib/ai.ts` are the first places to look for failures.
- Realtime: if `ChatWidget` doesn't reflect DB changes, verify the `supabase.channel(...).on('postgres_changes', ...)` subscription in `components/ChatWidget.tsx`.

What not to change lightly
-------------------------
- `lib/supabase.ts` default keys are used across the app; changing them without a matching Supabase project will break runtime behavior.
- The shape of the `clients` row (fields like `system_instruction`, `thinking_enabled`) — many parts of the app expect these keys.

Next steps for the agent
------------------------
- If implementing tool execution, wire `response.functionCalls` in `lib/ai.ts` to real DB/service calls and return those results to the model.
- Replace hardcoded keys with env var lookups and update README with Supabase setup SQL if asked.

If anything above is unclear or you want more detail about a specific file, tell me which area to expand.
