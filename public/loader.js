
/**
 * Ansury Systems - Universal Smart Loader
 * Version: 2.1.0 (Production-Ready)
 */
(function() {
  const script = document.currentScript;
  const clientId = script.getAttribute('data-client-id');
  
  if (!clientId) {
    console.error('Ansury Systems Error: Missing data-client-id attribute.');
    return;
  }

  // Determine the base URL from the script source
  const scriptUrl = new URL(script.src);
  const baseUrl = scriptUrl.origin;

  // Prevent multiple instances
  if (document.getElementById('ansury-container')) return;

  // Create the host container
  const container = document.createElement('div');
  container.id = 'ansury-container';
  container.style.cssText = `
    position: fixed;
    bottom: 0;
    right: 0;
    z-index: 2147483647;
    width: 100px;
    height: 100px;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
    overflow: visible;
  `;
  document.body.appendChild(container);

  // Initialize the Iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'ansury-iframe';
  iframe.src = `${baseUrl}/?clientId=${clientId}&embedded=true`;
  iframe.style.cssText = `
    border: none;
    width: 100%;
    height: 100%;
    background: transparent;
    pointer-events: auto;
    color-scheme: light;
  `;
  iframe.setAttribute('allow', 'camera; microphone; geolocation');
  container.appendChild(iframe);

  // Communicate with the Widget
  window.addEventListener('message', (event) => {
    // Basic security check (optional: verify origin)
    if (event.origin !== baseUrl) return;

    const { type } = event.data;

    if (type === 'ansury-expand') {
      container.style.width = '450px';
      container.style.height = '850px';
    } else if (type === 'ansury-collapse') {
      container.style.width = '100px';
      container.style.height = '100px';
    }
  });
})();
