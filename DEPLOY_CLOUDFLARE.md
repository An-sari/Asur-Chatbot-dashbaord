Cloudflare Pages — Static Frontend Deploy
========================================

This project is a Vite + React single-page app. The instructions below publish the static `dist` output to Cloudflare Pages.

Prerequisites
-------------
- Node.js + npm installed locally.
- A Cloudflare account.
- (Optional) `wrangler` CLI for command-line publishing.

Build
-----
1. Install dependencies and build:

```bash
npm install
npm run build
```

This produces a `dist` directory (Vite default) ready to publish.

Publish options
---------------
1) Publish via Cloudflare Pages UI
  - Create a new Pages project in the Cloudflare dashboard and connect your Git repository.
  - Set the build command to `npm run build` and the build output directory to `dist`.
  - Add any environment variables via the Pages settings (see Environment below).

2) Publish via Wrangler CLI (quick publish)
  - Install or use npx:

```bash
npm i -g wrangler
# or
npx wrangler@latest pages publish dist --project-name=<YOUR_PROJECT_NAME>
```

Environment & runtime notes
---------------------------
- This deployment option only publishes static assets (frontend). The project contains server code in `app/api/chat/route.ts` and an AI helper `lib/ai.ts` that require a Node/runtime and `API_KEY` (Google GenAI). Those are NOT deployed to Pages as static files.
- If your frontend should call a backend for `/api/chat`, deploy a separate server (Cloudflare Worker, Vercel, or other). Update the frontend to call that URL (or use a relative `/api/chat` route if you deploy a Worker on the same domain).
- `lib/supabase.ts` currently includes a hardcoded Supabase URL and anon key — the frontend will work with that key, but consider moving secrets to Cloudflare Pages environment variables for production.

Setting environment variables (Pages)
-----------------------------------
- In the Pages project settings, add `API_KEY` (if you plan to use any serverless function) and any Supabase keys you need. Note: Publishing static files alone does not expose `process.env` at runtime in the browser — variables configured in Pages are injected at build time only.

Limitations & recommended next steps
-----------------------------------
- Full AI functionality requires a server/runtime with `API_KEY` (Gemini). For a production setup, either:
  - Deploy `app/api/chat/route.ts` as a Cloudflare Worker or other server, and set `API_KEY` & Supabase keys in that environment; or
  - Modify the frontend to call an external hosted API endpoint (e.g., Vercel, AWS Lambda).
- The repo currently calls `runAnsuryEngine` from `components/ChatWidget.tsx` which expects server-side behavior. Verify the frontend calls the intended backend endpoint before deploying.

Commands summary
----------------
Build:

```bash
npm install
npm run build
```

Publish (wrangler):

```bash
npx wrangler@latest pages publish dist --project-name=my-project
```

Want me to:
- add a `wrangler.toml` and helper npm scripts for publishing?
- convert `app/api/chat/route.ts` into a Cloudflare Worker (so Pages + Worker runs the full app)?
