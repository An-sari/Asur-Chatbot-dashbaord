
/**
 * Ansury Systems - Universal Widget Loader
 * Usage: <script src="https://cdn.ansury.systems/loader.js" data-client-id="YOUR_ID"></script>
 */
(function() {
  const script = document.currentScript;
  const clientId = script.getAttribute('data-client-id');
  
  if (!clientId) {
    console.error('Ansury Systems: Missing data-client-id on script tag.');
    return;
  }

  // Create container element
  const container = document.createElement('div');
  container.id = 'ansury-root';
  document.body.appendChild(container);

  // Use Shadow DOM for isolation
  const shadow = container.attachShadow({ mode: 'open' });

  // Inject Tailwind CSS (required for the widget)
  const tailwindLink = document.createElement('script');
  tailwindLink.src = 'https://cdn.tailwindcss.com';
  shadow.appendChild(tailwindLink);

  // Create a mounting point inside shadow dom
  const mountPoint = document.createElement('div');
  mountPoint.id = 'ansury-mount';
  shadow.appendChild(mountPoint);

  // In a real build, we'd load the bundled React application here
  // script.src = 'https://cdn.ansury.systems/widget-bundle.js';
  
  console.log(`Ansury Systems: Widget initialized for client ${clientId}`);
})();
