import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174, // Use a different port than your main app
    open: true,
  },
  // Entry point for the demo app
  build: {
    outDir: 'dist-ui-demo',
  },
  // Use this index.html for the UI demo
  root: resolve(__dirname, 'src/features/ui-poc'),
}); 