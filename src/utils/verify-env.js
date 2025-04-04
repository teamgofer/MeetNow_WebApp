var EnvVarType;
(function (EnvVarType) {
    EnvVarType["REQUIRED"] = "required";
    EnvVarType["OPTIONAL"] = "optional";
})(EnvVarType || (EnvVarType = {}));
export function verifyEnvironmentVariables() {
    const envVars = {
        VITE_SUPABASE_URL: {
            type: EnvVarType.REQUIRED,
            description: 'Supabase project URL',
        },
        VITE_SUPABASE_ANON_KEY: {
            type: EnvVarType.REQUIRED,
            description: 'Supabase anonymous key',
        },
        VITE_API_URL: {
            type: EnvVarType.REQUIRED,
            description: 'API endpoint URL',
        },
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
        VITE_OPENROUTE_API_KEY: {
            type: EnvVarType.OPTIONAL,
            description: 'OpenRouteService API key for directions',
        },
    };
    const missingRequired = [];
    const missingOptional = [];
    Object.entries(envVars).forEach(([name, config]) => {
        const value = import.meta.env[name];
        if (!value) {
            if (config.type === EnvVarType.REQUIRED) {
                missingRequired.push(`${name} (${config.description})`);
            }
            else {
                missingOptional.push(`${name} (${config.description})`);
            }
        }
    });
    let message = '';
    if (missingRequired.length === 0) {
        message = '✅ All required environment variables are set.\n';
    }
    else {
        message = `❌ Missing ${missingRequired.length} required environment variables!\n`;
        message += missingRequired.map(v => `  - ${v}`).join('\n');
        message += '\n\nThese variables are required for the application to function properly.';
    }
    if (missingOptional.length > 0) {
        message += '\n\n⚠️ Missing optional environment variables:\n';
        message += missingOptional.map(v => `  - ${v}`).join('\n');
        const missingWasabiVars = missingOptional.filter(v => v.includes('WASABI'));
        if (missingWasabiVars.length > 0) {
            message +=
                '\n\nNote: Wasabi credentials are missing. Image URLs will work in passthrough mode.';
            message += '\nNo pre-signed URLs will be generated, which may affect direct image uploads.';
        }
        else {
            message += '\n\nThese variables are optional but some features might be limited.';
        }
    }
    message += `\n\nCurrent environment: ${import.meta.env.MODE}`;
    return {
        isValid: missingRequired.length === 0,
        missing: missingRequired,
        optional: missingOptional,
        message,
    };
}
export function printEnvironmentVerification() {
    const result = verifyEnvironmentVariables();
    console.log('%c Environment Variables Verification ', 'background: #333; color: #fff; padding: 4px 8px; border-radius: 4px;');
    if (result.isValid) {
        console.log('%c ✅ All required variables present ', 'background: #2e7d32; color: #fff; padding: 4px 8px;');
    }
    else {
        console.log('%c ❌ Missing required variables ', 'background: #c62828; color: #fff; padding: 4px 8px;');
    }
    console.log(result.message);
    console.log('\nEnvironment Values:');
    Object.keys(import.meta.env).forEach(key => {
        if (key.startsWith('VITE_')) {
            const value = import.meta.env[key];
            const displayValue = key.includes('KEY') || key.includes('SECRET')
                ? `${String(value).substring(0, 4)}...`
                : value;
            console.log(`  ${key}: ${displayValue}`);
        }
    });
}
export default verifyEnvironmentVariables;
//# sourceMappingURL=verify-env.js.map