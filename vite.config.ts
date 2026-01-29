
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix: Define __dirname for ESM context to resolve build errors
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// This config builds the Dashboard/SPA by default for Cloudflare Pages.
// To build the widget for R2, you would run: vite build --mode widget
export default defineConfig(({ mode }) => {
  const isWidget = mode === 'widget';

  return {
    plugins: [
      react(),
      cssInjectedByJsPlugin(),
    ],
    build: isWidget ? {
      // Library build for R2
      lib: {
        entry: path.resolve(__dirname, 'components/ChatWidget.tsx'),
        name: 'AnsuryWidget',
        fileName: () => `ansury-widget.umd.js`,
        formats: ['umd'],
      },
      outDir: 'dist-widget',
      rollupOptions: {
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
          },
        },
      },
    } : {
      // Standard SPA build for Cloudflare Pages
      outDir: 'dist',
    },
    define: {
      'process.env': process.env,
    },
  };
});
