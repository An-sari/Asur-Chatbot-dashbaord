
/**
 * Ansury Systems - Universal Smart Loader
 * This script is the entry point for all client websites.
 */
(function() {
  const script = document.currentScript;
  const clientId = script.getAttribute('data-client-id');
  
  if (!clientId) {
    console.error('Ansury Systems Error: Missing data-client-id attribute.');
    return;
  }

  // Prevent multiple instances
  if (document.getElementById('ansury-container')) return;

  // Create the host container
  const container = document.createElement('div');
  container.id = 'ansury-container';
  container.style.cssText = 'position:fixed;bottom:0;right:0;z-index:2147483647;';
  document.body.appendChild(container);

  // Attach Shadow DOM for style isolation
  const shadow = container.attachShadow({ mode: 'open' });

  // Create the mount point for React
  const root = document.createElement('div');
  root.id = 'ansury-widget-root';
  shadow.appendChild(root);

  // Load the bundled widget from CDN (Cloudflare R2/Pages)
  const widgetScript = document.createElement('script');
  // Replace with your production CDN URL
  widgetScript.src = "https://cdn.ansury.systems/assets/ansury-widget.umd.js";
  
  widgetScript.onload = () => {
    // We assume the bundled widget exposes a global 'Ansury' object
    if (window.AnsuryWidget && typeof window.AnsuryWidget.mount === 'function') {
      window.AnsuryWidget.mount(root, { clientId });
    } else {
      console.error('Ansury Systems: Widget failed to initialize.');
    }
  };

  shadow.appendChild(widgetScript);
})();
