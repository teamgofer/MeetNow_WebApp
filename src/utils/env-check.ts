interface IEnvVariables {
  [key: string]: string | undefined;
}

export const checkEnvironment = (): boolean => {
  const requiredVars: Record<string, string> = {
    // Supabase Configuration - Required
    VITE_SUPABASE_URL: 'Supabase project URL',
    VITE_SUPABASE_ANON_KEY: 'Supabase anonymous key',

    // API URL is required
    VITE_API_URL: 'API endpoint URL',
  };

  // Optional variables that don't block app initialization
  const optionalVars: Record<string, string> = {
    // Wasabi Configuration - Optional, URLs will work in passthrough mode without these
    VITE_WASABI_REGION: 'Wasabi region',
    VITE_WASABI_ENDPOINT: 'Wasabi endpoint',
    VITE_WASABI_BUCKET_NAME: 'Wasabi bucket name',
    VITE_WASABI_ACCESS_KEY_ID: 'Wasabi access key ID',
    VITE_WASABI_SECRET_ACCESS_KEY: 'Wasabi secret access key',
    VITE_WASABI_PUBLIC_ACCESS_KEY_ID: 'Wasabi public access key ID',
    VITE_WASABI_PUBLIC_SECRET_KEY: 'Wasabi public secret key',

    // OpenRouteService API - Optional, only needed for directions feature
    VITE_OPENROUTE_API_KEY: 'OpenRouteService API key',
  };

  const missingVars: string[] = [];
  const missingOptionalVars: string[] = [];
  const environment: Record<string, string | boolean> = {};

  // Check each required variable
  Object.entries(requiredVars).forEach(([varName, description]) => {
    const value = import.meta.env[varName as keyof ImportMetaEnv];
    environment[varName] = value
      ? varName.includes('KEY') || varName.includes('SECRET')
        ? `${value.substring(0, 4)}...`
        : value
      : 'missing';

    if (!value) {
      missingVars.push(`${varName} (${description})`);
    }
  });

  // Check optional variables
  Object.entries(optionalVars).forEach(([varName, description]) => {
    const value = import.meta.env[varName as keyof ImportMetaEnv];
    environment[varName] = value
      ? varName.includes('KEY') || varName.includes('SECRET')
        ? `${value.substring(0, 4)}...`
        : value
      : 'missing';

    if (!value) {
      missingOptionalVars.push(`${varName} (${description})`);
    }
  });

  // Add environment mode information
  environment.MODE = import.meta.env.MODE as string;
  environment.DEV = !!import.meta.env.DEV;
  environment.PROD = !!import.meta.env.PROD;

  // Log environment state
  console.log('Environment Check:', environment);

  if (missingOptionalVars.length > 0) {
    console.warn(`Missing optional environment variables:\n${missingOptionalVars.join('\n')}`);

    // Special note for Wasabi variables
    if (missingOptionalVars.some(v => v.includes('WASABI'))) {
      console.warn('Wasabi credentials are missing. Image URLs will work in passthrough mode.');
      console.warn('No pre-signed URLs will be generated, which may affect direct image uploads.');
    } else {
      console.warn('Some features may be limited, but the app will continue to function.');
    }
  }

  // If any required variables are missing, throw an error
  if (missingVars.length > 0) {
    const error = new Error(`Missing required environment variables:\n${missingVars.join('\n')}`);
    console.error('Environment validation failed:', error);
    throw error;
  }

  return true;
};
