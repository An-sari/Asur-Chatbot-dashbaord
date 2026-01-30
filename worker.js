
/**
 * Ansury Systems - Master Loader Worker
 * This worker serves the 'loader.js' script to client websites.
 */

// 1. CHANGE THIS to your deployed Cloudflare Pages URL
const APP_URL = "https://ansury-titan.pages.dev"; 

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "*";

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, data-client-id",
        },
      });
    }

    // Serve the Loader Script
    if (url.pathname === "/loader.js") {
      const loaderScript = `
/**
 * Ansury Systems - Universal Smart Loader
 * Version: 2.2.0
 */
(function() {
  const script = document.currentScript;
  const clientId = script.getAttribute('data-client-id');
  
  if (!clientId) {
    console.error('Ansury Systems Error: Missing data-client-id attribute.');
    return;
  }

  const baseUrl = "${APP_URL}";

  if (document.getElementById('ansury-container')) return;

  const container = document.createElement('div');
  container.id = 'ansury-container';
  container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:2147483647;width:80px;height:80px;transition:width 0.4s cubic-bezier(0.19, 1, 0.22, 1), height 0.4s cubic-bezier(0.19, 1, 0.22, 1);pointer-events:none;overflow:visible;';
  document.body.appendChild(container);

  const iframe = document.createElement('iframe');
  iframe.id = 'ansury-iframe';
  iframe.src = baseUrl + "/?clientId=" + clientId + "&embedded=true";
  iframe.style.cssText = 'border:none;width:100%;height:100%;background:transparent;pointer-events:auto;color-scheme:light;';
  iframe.setAttribute('allow', 'camera; microphone; geolocation');
  container.appendChild(iframe);

  window.addEventListener('message', function(event) {
    if (event.origin !== baseUrl) return;
    
    if (event.data.type === 'ansury-expand') {
      container.style.width = '420px';
      container.style.height = '700px';
      // Adjust for mobile screens
      if (window.innerWidth < 500) {
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.bottom = '0';
        container.style.right = '0';
      }
    } else if (event.data.type === 'ansury-collapse') {
      container.style.width = '80px';
      container.style.height = '80px';
      container.style.bottom = '20px';
      container.style.right = '20px';
    }
  });
})();`;

      return new Response(loaderScript, {
        headers: {
          "content-type": "application/javascript;charset=UTF-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=300"
        }
      });
    }

    // Default: Redirect to the main app dashboard
    return Response.redirect(APP_URL, 302);
  }
};
