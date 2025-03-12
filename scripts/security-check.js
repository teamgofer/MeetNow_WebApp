#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

console.log('\x1b[36m%s\x1b[0m', '🔒 Running security checks...\n');

// Check for sensitive files
const sensitiveFiles = ['.env', '.env.local', '.env.development', '.env.production'];
sensitiveFiles.forEach(file => {
  if (fs.existsSync(path.join(process.cwd(), file))) {
    console.log('\x1b[31m%s\x1b[0m', `⚠️  Warning: ${file} exists in the project root. Make sure it's in .gitignore`);
  }
});

// Check for sensitive patterns in code
console.log('\n\x1b[36m%s\x1b[0m', '🔍 Checking for sensitive patterns in code...');
const sensitivePatterns = [
  'password=',
  'apikey=',
  'api_key=',
  'secret=',
  'token=',
  'amazonaws.com',
  'firebase',
];

try {
  sensitivePatterns.forEach(pattern => {
    try {
      const result = execSync(`git grep -l "${pattern}"`, { stdio: 'pipe' }).toString();
      if (result) {
        console.log('\x1b[33m%s\x1b[0m', `⚠️  Found potentially sensitive pattern '${pattern}' in:`);
        console.log(result);
      }
    } catch (e) {
      // No matches found, ignore
    }
  });
} catch (error) {
  console.log('\x1b[31m%s\x1b[0m', '⚠️  Error checking for sensitive patterns');
}

// Check npm audit
console.log('\n\x1b[36m%s\x1b[0m', '📦 Checking npm packages for vulnerabilities...');
try {
  execSync('npm audit', { stdio: 'inherit' });
} catch (error) {
  console.log('\x1b[31m%s\x1b[0m', '⚠️  Vulnerabilities found in dependencies. Run npm audit fix');
}

// Check for outdated packages
console.log('\n\x1b[36m%s\x1b[0m', '📦 Checking for outdated packages...');
try {
  execSync('npm outdated', { stdio: 'inherit' });
} catch (error) {
  console.log('\x1b[33m%s\x1b[0m', '⚠️  Some packages are outdated. Consider updating them.');
}

// Check environment variables
console.log('\n\x1b[36m%s\x1b[0m', '🔑 Checking required environment variables...');
const requiredEnvVars = [
  'JWT_SECRET',
  'POSTGRES_PASSWORD',
  'MAPTILER_API_KEY',
  'TIMEZONEDB_API_KEY'
];

const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingVars.length > 0) {
  console.log('\x1b[31m%s\x1b[0m', `⚠️  Missing required environment variables: ${missingVars.join(', ')}`);
}

// Check JWT secret strength
const jwtSecret = process.env.JWT_SECRET;
if (jwtSecret) {
  const entropy = crypto.randomBytes(32).toString('base64');
  if (jwtSecret.length < 32) {
    console.log('\x1b[31m%s\x1b[0m', '⚠️  JWT_SECRET is too weak. Use a stronger secret (at least 32 characters)');
  }
  if (jwtSecret === 'your_jwt_secret_key') {
    console.log('\x1b[31m%s\x1b[0m', '⚠️  JWT_SECRET is using the default value. Please change it!');
  }
}

// Check for common security headers
console.log('\n\x1b[36m%s\x1b[0m', '🛡️  Checking for security headers...');
const nextConfigPath = path.join(process.cwd(), 'next.config.ts');
if (fs.existsSync(nextConfigPath)) {
  const configContent = fs.readFileSync(nextConfigPath, 'utf8');
  const securityHeaders = [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Strict-Transport-Security',
    'Content-Security-Policy',
  ];

  securityHeaders.forEach(header => {
    if (!configContent.includes(header)) {
      console.log('\x1b[33m%s\x1b[0m', `⚠️  Missing security header: ${header}`);
    }
  });
}

// Check for proper CORS configuration
console.log('\n\x1b[36m%s\x1b[0m', '🌐 Checking CORS configuration...');
const apiRoutesPath = path.join(process.cwd(), 'src', 'app', 'api');
if (fs.existsSync(apiRoutesPath)) {
  const routeFiles = fs.readdirSync(apiRoutesPath, { recursive: true });
  routeFiles.forEach(file => {
    if (file.endsWith('.ts') || file.endsWith('.js')) {
      const content = fs.readFileSync(path.join(apiRoutesPath, file), 'utf8');
      if (!content.includes('Access-Control-Allow-Origin')) {
        console.log('\x1b[33m%s\x1b[0m', `⚠️  No CORS headers found in: ${file}`);
      }
    }
  });
}

console.log('\n\x1b[36m%s\x1b[0m', '✅ Security check complete');
console.log('\x1b[36m%s\x1b[0m', 'Remember to:');
console.log('1. Regularly rotate API keys and credentials');
console.log('2. Keep dependencies updated');
console.log('3. Use HTTPS in production');
console.log('4. Never commit sensitive files');
console.log('5. Implement rate limiting for API endpoints');
console.log('6. Use proper CORS policies');
console.log('7. Enable security headers');
console.log('8. Monitor application logs for security events'); 