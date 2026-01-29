
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix: Define __dirname for ESM environments as it is not globally available in ES modules.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    cssInjectedByJsPlugin(), // This injects the Tailwind CSS directly into the JS bundle
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'components/ChatWidget.tsx'),
      name: 'AnsuryWidget',
      fileName: (format) => `ansury-widget.${format}.js`,
      formats: ['umd'], // UMD is best for universal script tag compatibility
    },
    rollupOptions: {
      // Ensure we don't bundle React if we want to use the host's, 
      // but for a portable widget, we usually bundle everything.
      // To keep it truly "copy-paste", we bundle React + GenAI SDK.
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
  define: {
    'process.env': process.env,
  },
});
