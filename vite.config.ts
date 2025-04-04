import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Define which environment variables should be available to the client
  // IMPORTANT: Don't include any secrets here!
  const clientEnvWhitelist = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_API_URL',
    'VITE_MAP_API_KEY',
    'VITE_DEFAULT_RADIUS',
    'VITE_MAX_MEETUP_DURATION',
    'VITE_TIMEZONEDB_KEY',
    'VITE_WASABI_REGION',
    'VITE_WASABI_ENDPOINT',
    'VITE_WASABI_BUCKET_NAME',
    'VITE_WASABI_PUBLIC_ACCESS_KEY_ID',
    'VITE_WASABI_PUBLIC_SECRET_KEY',
    'VITE_OPENROUTE_API_KEY'
  ];

  // Create a filtered version of the environment variables
  const clientEnv = {};
  Object.keys(env).forEach(key => {
    if (clientEnvWhitelist.includes(key)) {
      clientEnv[key] = env[key];
    }
  });
  
  return {
    define: {
      // Only expose whitelisted environment variables to the client
      'import.meta.env': JSON.stringify(clientEnv)
    },
    plugins: [
      react(),
      // Support for TypeScript path aliases
      tsconfigPaths()
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.json']
    },
    server: {
      host: true,
      port: 3000,
      hmr: {
        host: 'localhost',
        port: 3000,
        clientPort: 3000,
        protocol: 'ws',
      },
      watch: {
        usePolling: true
      }
    },
    build: {
      sourcemap: true,
      // TypeScript checking before build
      typescript: {
        tsconfigFile: 'tsconfig.build.json',
        // Report TypeScript errors during build
        typeCheck: false,
        // Faster builds with esbuild, less strict than tsc
        transpileOnly: true
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'supabase-vendor': ['@supabase/supabase-js'],
            'map-vendor': ['leaflet']
          }
        }
      }
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        '@supabase/supabase-js',
        'leaflet',
        'react-leaflet'
      ],
      exclude: ['@babel/runtime']
    }
  };
});