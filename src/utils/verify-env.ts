/**
 * Environment Variable Verification Utility
 *
 * This script helps verify that all required environment variables
 * are present and correctly configured before deployment.
 */

// Define types of environment variables
enum EnvVarType {
  REQUIRED = 'required',
  OPTIONAL = 'optional',
}

// Function to check if environment variables are present
export function verifyEnvironmentVariables(): {
  isValid: boolean;
  missing: string[];
  optional: string[];
  message: string;
} {
  // Define the required environment variables
  const envVars: Record<string, { type: EnvVarType; description: string }> = {
    // Supabase - Required for basic functionality
    VITE_SUPABASE_URL: {
      type: EnvVarType.REQUIRED,
      description: 'Supabase project URL',
    },
    VITE_SUPABASE_ANON_KEY: {
      type: EnvVarType.REQUIRED,
      description: 'Supabase anonymous key',
    },

    // API URL - Required for backend communication
    VITE_API_URL: {
      type: EnvVarType.REQUIRED,
      description: 'API endpoint URL',
    },

    // Wasabi Storage - Optional, URLs work in passthrough mode without these
    VITE_WASABI_REGION: {
      type: EnvVarType.OPTIONAL,
      description: 'Wasabi storage region',
    },
    VITE_WASABI_ENDPOINT: {
      type: EnvVarType.OPTIONAL,
      description: 'Wasabi endpoint URL',
    },
    VITE_WASABI_BUCKET_NAME: {
      type: EnvVarType.OPTIONAL,
      description: 'Wasabi storage bucket name',
    },
    VITE_WASABI_ACCESS_KEY_ID: {
      type: EnvVarType.OPTIONAL,
      description: 'Wasabi access key ID',
    },
    VITE_WASABI_SECRET_ACCESS_KEY: {
      type: EnvVarType.OPTIONAL,
      description: 'Wasabi secret key',
    },
    VITE_WASABI_PUBLIC_ACCESS_KEY_ID: {
      type: EnvVarType.OPTIONAL,
      description: 'Wasabi public access key ID',
    },
    VITE_WASABI_PUBLIC_SECRET_KEY: {
      type: EnvVarType.OPTIONAL,
      description: 'Wasabi public secret key',
    },

    // OpenRouteService - Optional, only needed for directions
    VITE_OPENROUTE_API_KEY: {
      type: EnvVarType.OPTIONAL,
      description: 'OpenRouteService API key for directions',
    },
  };

  // Track missing variables
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];

  // Check each variable
  Object.entries(envVars).forEach(([name, config]) => {
    const value = import.meta.env[name as keyof ImportMetaEnv];

    if (!value) {
      if (config.type === EnvVarType.REQUIRED) {
        missingRequired.push(`${name} (${config.description})`);
      } else {
        missingOptional.push(`${name} (${config.description})`);
      }
    }
  });

  // Build the result message
  let message = '';

  if (missingRequired.length === 0) {
    message = '✅ All required environment variables are set.\n';
  } else {
    message = `❌ Missing ${missingRequired.length} required environment variables!\n`;
    message += missingRequired.map(v => `  - ${v}`).join('\n');
    message += '\n\nThese variables are required for the application to function properly.';
  }

  if (missingOptional.length > 0) {
    message += '\n\n⚠️ Missing optional environment variables:\n';
    message += missingOptional.map(v => `  - ${v}`).join('\n');

    // Special note for Wasabi variables
    const missingWasabiVars = missingOptional.filter(v => v.includes('WASABI'));
    if (missingWasabiVars.length > 0) {
      message +=
        '\n\nNote: Wasabi credentials are missing. Image URLs will work in passthrough mode.';
      message += '\nNo pre-signed URLs will be generated, which may affect direct image uploads.';
    } else {
      message += '\n\nThese variables are optional but some features might be limited.';
    }
  }

  // Log the environment mode
  message += `\n\nCurrent environment: ${import.meta.env.MODE}`;

  return {
    isValid: missingRequired.length === 0,
    missing: missingRequired,
    optional: missingOptional,
    message,
  };
}

// Function to display the verification results in the console
export function printEnvironmentVerification(): void {
  const result = verifyEnvironmentVariables();

  console.log(
    '%c Environment Variables Verification ',
    'background: #333; color: #fff; padding: 4px 8px; border-radius: 4px;'
  );

  if (result.isValid) {
    console.log(
      '%c ✅ All required variables present ',
      'background: #2e7d32; color: #fff; padding: 4px 8px;'
    );
  } else {
    console.log(
      '%c ❌ Missing required variables ',
      'background: #c62828; color: #fff; padding: 4px 8px;'
    );
  }

  console.log(result.message);

  // Detailed information for developers
  console.log('\nEnvironment Values:');
  Object.keys(import.meta.env).forEach(key => {
    if (key.startsWith('VITE_')) {
      const value = import.meta.env[key as keyof ImportMetaEnv];
      // Hide sensitive values
      const displayValue =
        key.includes('KEY') || key.includes('SECRET')
          ? `${String(value).substring(0, 4)}...`
          : value;
      console.log(`  ${key}: ${displayValue}`);
    }
  });
}

// Export default function for easy importing
export default verifyEnvironmentVariables;
