
/**
 * Ansury Systems - Universal Smart Loader (Beta)
 * Embed this on your site to activate the AI Sales Engine.
 */
(function() {
  const script = document.currentScript;
  const clientId = script.getAttribute('data-client-id');
  
  if (!clientId) {
    console.error('Ansury Systems Error: Missing data-client-id attribute.');
    return;
  }

  // Use the current script's origin as the base URL
  const scriptUrl = new URL(script.src);
  const baseUrl = scriptUrl.origin;

  // Prevent multiple instances
  if (document.getElementById('ansury-container')) return;

  // Create the host container
  const container = document.createElement('div');
  container.id = 'ansury-container';
  container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:2147483647;pointer-events:none;';
  document.body.appendChild(container);

  // We load the app in "widget-only" mode via a URL parameter
  const iframe = document.createElement('iframe');
  iframe.src = `${baseUrl}/?clientId=${clientId}&embedded=true`;
  iframe.style.cssText = 'border:none;width:450px;height:750px;background:transparent;pointer-events:auto;';
  iframe.setAttribute('allow', 'camera; microphone; geolocation');
  
  // Optional: In a production version, the widget would send postMessage to resize this iframe
  // between a small circle (collapsed) and large rectangle (expanded).
  // For now, we set a large enough fixed size to hold the expanded widget.

  container.appendChild(iframe);
})();
