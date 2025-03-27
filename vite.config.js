import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    },
    define: {
      __SUPABASE_URL__: JSON.stringify(env.VITE_SUPABASE_URL),
      __SUPABASE_ANON_KEY__: JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
    },
    server: {
      host: true,
      port: 3000,
      strictPort: true,
      watch: {
        usePolling: true
      },
      hmr: {
        overlay: true
      },
      optimizeDeps: {
        force: true
      }
    },
    build: {
      sourcemap: true,
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true
      }
    }
  };
});