
/**
 * Ansury Systems - Universal Widget Loader
 * Properly isolates the widget using Shadow DOM and injects styles.
 */
(function() {
  const script = document.currentScript;
  const clientId = script.getAttribute('data-client-id');
  
  if (!clientId) {
    console.error('Ansury Systems: data-client-id is missing.');
    return;
  }

  // Prevent double injection
  if (document.getElementById('ansury-root')) return;

  const container = document.createElement('div');
  container.id = 'ansury-root';
  container.style.position = 'fixed';
  container.style.bottom = '0';
  container.style.right = '0';
  container.style.zIndex = '2147483647';
  document.body.appendChild(container);

  const shadow = container.attachShadow({ mode: 'open' });

  // Inject Tailwind via CDN inside Shadow DOM
  const tw = document.createElement('script');
  tw.src = 'https://cdn.tailwindcss.com';
  shadow.appendChild(tw);

  // Inject Google Fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap';
  shadow.appendChild(fontLink);

  const mountPoint = document.createElement('div');
  mountPoint.id = 'ansury-mount';
  mountPoint.style.fontFamily = "'Inter', sans-serif";
  shadow.appendChild(mountPoint);

  // In production, this would load the actual React build
  console.log(`Ansury Engine: Connected to node [${clientId}]`);
  
  // Example of how we'd mount the React app inside the Shadow DOM:
  // import('https://cdn.ansury.com/widget.js').then(m => m.render(mountPoint, clientId));
})();
