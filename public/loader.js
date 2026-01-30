
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
  container.style.cssText = 'position:fixed;bottom:0;right:0;z-index:2147483647;';
  document.body.appendChild(container);

  // For testing in this environment, we inject an iframe or load the component directly
  // Note: Real production loaders usually pull a standalone UMD bundle
  const iframe = document.createElement('iframe');
  iframe.src = `${baseUrl}/?clientId=${clientId}&embedded=true`;
  iframe.style.cssText = 'border:none;width:500px;height:800px;position:fixed;bottom:0;right:0;background:transparent;';
  
  // Handle widget expansion/collapse messages from within the iframe
  window.addEventListener('message', (event) => {
    if (event.data === 'ansury-toggle') {
      // Logic for resizing iframe based on open/closed state
    }
  });

  container.appendChild(iframe);
})();
