declare global {
  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
    readonly VITE_GOOGLE_MAPS_API_KEY: string;
    readonly VITE_APP_URL: string;
    readonly VITE_APP_NAME: string;
    readonly VITE_APP_DESCRIPTION: string;
    readonly VITE_APP_VERSION: string;
    readonly VITE_APP_ENV: 'development' | 'production' | 'test';
    readonly VITE_APP_DEBUG: boolean;
    readonly VITE_APP_ANALYTICS_ID?: string;
    readonly VITE_APP_SENTRY_DSN?: string;
    readonly VITE_OPENROUTE_API_KEY?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
