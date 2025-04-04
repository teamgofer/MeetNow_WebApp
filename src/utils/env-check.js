export const checkEnvironment = () => {
    const requiredVars = {
        VITE_SUPABASE_URL: 'Supabase project URL',
        VITE_SUPABASE_ANON_KEY: 'Supabase anonymous key',
        VITE_API_URL: 'API endpoint URL',
    };
    const optionalVars = {
        VITE_WASABI_REGION: 'Wasabi region',
        VITE_WASABI_ENDPOINT: 'Wasabi endpoint',
        VITE_WASABI_BUCKET_NAME: 'Wasabi bucket name',
        VITE_WASABI_ACCESS_KEY_ID: 'Wasabi access key ID',
        VITE_WASABI_SECRET_ACCESS_KEY: 'Wasabi secret access key',
        VITE_OPENROUTE_API_KEY: 'OpenRouteService API key',
    };
    const missingVars = [];
    const missingOptionalVars = [];
    const environment = {};
    Object.entries(requiredVars).forEach(([varName, description]) => {
        const value = import.meta.env[varName];
        environment[varName] = value
            ? varName.includes('KEY') || varName.includes('SECRET')
                ? `${value.substring(0, 4)}...`
                : value
            : 'missing';
        if (!value) {
            missingVars.push(`${varName} (${description})`);
        }
    });
    Object.entries(optionalVars).forEach(([varName, description]) => {
        const value = import.meta.env[varName];
        environment[varName] = value
            ? varName.includes('KEY') || varName.includes('SECRET')
                ? `${value.substring(0, 4)}...`
                : value
            : 'missing';
        if (!value) {
            missingOptionalVars.push(`${varName} (${description})`);
        }
    });
    environment.MODE = import.meta.env.MODE;
    environment.DEV = !!import.meta.env.DEV;
    environment.PROD = !!import.meta.env.PROD;
    console.log('Environment Check:', environment);
    if (missingOptionalVars.length > 0) {
        console.warn(`Missing optional environment variables:\n${missingOptionalVars.join('\n')}`);
        if (missingOptionalVars.some(v => v.includes('WASABI'))) {
            console.warn('Wasabi credentials are missing. Image URLs will work in passthrough mode.');
            console.warn('No pre-signed URLs will be generated, which may affect direct image uploads.');
        }
        else {
            console.warn('Some features may be limited, but the app will continue to function.');
        }
    }
    if (missingVars.length > 0) {
        const error = new Error(`Missing required environment variables:\n${missingVars.join('\n')}`);
        console.error('Environment validation failed:', error);
        throw error;
    }
    return true;
};
//# sourceMappingURL=env-check.js.map