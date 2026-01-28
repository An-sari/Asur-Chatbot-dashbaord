
# Ansury Systems - Deployment Guide

This guide explains how to bundle the ChatWidget and host it as a portable sales engine.

## 1. Bundling for Production

To create the `widget-bundle.js` that clients will actually load, follow these steps:

1. **Vite Library Mode**: Use Vite to bundle the `ChatWidget.tsx` and its dependencies.
   ```js
   // vite.config.ts
   export default defineConfig({
     build: {
       lib: {
         entry: 'src/components/ChatWidget.tsx',
         name: 'AnsuryWidget',
         fileName: 'ansury-widget',
         formats: ['umd']
       },
       rollupOptions: {
         external: ['react', 'react-dom'],
         output: {
           globals: { react: 'React', 'react-dom': 'ReactDOM' }
         }
       }
     }
   });
   ```
2. **Post-Processing**: Ensure Tailwind is injected into the bundle or loaded within the Shadow DOM in `loader.js`.

## 2. Cloudflare Hosting

### Frontend / CDN
1. **Cloudflare Pages**: Connect your repository to Cloudflare Pages.
2. Set build command: `npm run build`.
3. Set output directory: `dist`.
4. Your `loader.js` and `widget-bundle.js` will be available at `https://your-app.pages.dev/loader.js`.

### Backend (The API)
1. **Cloudflare Workers / Pages Functions**: Use Next.js on Cloudflare Pages (via the `@cloudflare/next-on-pages` adapter).
2. Ensure your `API_KEY` for Google Gemini is added to the Cloudflare Environment Variables.

## 3. Client Installation
Provide this snippet to your high-ticket clients:

```html
<!-- Ansury Systems AI Widget -->
<script 
  src="https://cdn.ansury.systems/loader.js" 
  data-client-id="CLIENT_ID_HERE"
  async
></script>
<!-- End Ansury Systems -->
```

## 4. Multi-Tenancy Architecture
The current setup uses `constants.ts` for mock data. To scale:
1. Replace `MOCK_CLIENTS` lookups in `app/api/chat/route.ts` with a Supabase or Prisma database call.
2. Index by `clientId`.
3. Use Redis/KV for caching system instructions to ensure low latency.
