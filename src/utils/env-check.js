export const checkEnvironment = () => {
  const requiredVars = {
    // Supabase Configuration
    VITE_SUPABASE_URL: 'Supabase project URL',
    VITE_SUPABASE_ANON_KEY: 'Supabase anonymous key',
    
    // Wasabi Configuration
    VITE_WASABI_REGION: 'Wasabi region',
    VITE_WASABI_ENDPOINT: 'Wasabi endpoint',
    VITE_WASABI_BUCKET_NAME: 'Wasabi bucket name',
    VITE_WASABI_ACCESS_KEY_ID: 'Wasabi access key ID',
    VITE_WASABI_SECRET_ACCESS_KEY: 'Wasabi secret access key',
    
    // Public Wasabi Configuration (optional, will fallback to main credentials)
    VITE_WASABI_PUBLIC_ACCESS_KEY_ID: 'Public Wasabi access key ID',
    VITE_WASABI_PUBLIC_SECRET_KEY: 'Public Wasabi secret key'
  };

  const missingVars = [];
  const environment = {};

  // Check each required variable
  Object.entries(requiredVars).forEach(([varName, description]) => {
    const value = import.meta.env[varName];
    environment[varName] = value ? 
      (varName.includes('KEY') || varName.includes('SECRET') ? 
        value.substring(0, 4) + '...' : value) : 
      'missing';
    
    if (!value) {
      missingVars.push(`${varName} (${description})`);
    }
  });

  // Add environment mode information
  environment.MODE = import.meta.env.MODE;
  environment.DEV = import.meta.env.DEV;
  environment.PROD = import.meta.env.PROD;

  // Log environment state
  console.log('Environment Check:', environment);

  // If any required variables are missing, throw an error
  if (missingVars.length > 0) {
    const error = new Error(`Missing required environment variables:\n${missingVars.join('\n')}`);
    console.error('Environment validation failed:', error);
    throw error;
  }

  return true;
}; 