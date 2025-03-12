#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\x1b[36m%s\x1b[0m', '🔐 Security Setup Guide\n');

console.log('This project uses several free security tools:\n');
console.log('1. GitHub Security Features:');
console.log('   - CodeQL Analysis for code scanning');
console.log('   - Dependency Review for package vulnerabilities');
console.log('   - Secret scanning with TruffleHog');
console.log('   - Automated security updates\n');

console.log('2. OSV-Scanner:');
console.log('   - Vulnerability scanning from Google');
console.log('   - Checks against the Open Source Vulnerability database\n');

console.log('3. Trivy Scanner:');
console.log('   - Comprehensive security scanner');
console.log('   - Checks for vulnerabilities in dependencies');
console.log('   - Container security scanning\n');

console.log('Would you like to enable Dependabot security updates?');

rl.question('Enter y/n: ', (answer) => {
  if (answer.toLowerCase() === 'y') {
    try {
      // Get the repository URL
      const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
      const repoUrl = remoteUrl
        .replace('git@github.com:', 'https://github.com/')
        .replace('.git', '');
      
      const securityUrl = `${repoUrl}/settings/security_analysis`;
      
      // Open the URL in the default browser
      const command = process.platform === 'win32' ? 'start' :
                     process.platform === 'darwin' ? 'open' : 'xdg-open';
      execSync(`${command} ${securityUrl}`);
      
      console.log('\n\x1b[32m%s\x1b[0m', '✅ Opening GitHub security settings page...');
    } catch (error) {
      console.log('\n\x1b[31m%s\x1b[0m', '❌ Error opening GitHub security settings page. Please navigate there manually.');
    }
  }

  console.log('\n\x1b[36m%s\x1b[0m', '📝 Next steps:');
  console.log('1. Enable Dependabot alerts in your repository settings');
  console.log('2. Enable automated security updates');
  console.log('3. Run npm run security-check to verify your setup');
  console.log('4. Monitor GitHub Actions security scans in the Actions tab');
  console.log('5. Regularly check npm audit reports: npm run audit\n');

  rl.close();
}); 