#!/usr/bin/env node

const crypto = require('crypto');

// Generate a secure random string for JWT_SECRET
const generateSecret = () => {
  // Generate 64 random bytes and convert to base64
  const secret = crypto.randomBytes(64).toString('base64');
  console.log('\x1b[32m%s\x1b[0m', 'Generated JWT_SECRET:');
  console.log('\x1b[33m%s\x1b[0m', secret);
  console.log('\n\x1b[32m%s\x1b[0m', 'Add this to your .env.local file as:');
  console.log('\x1b[36m%s\x1b[0m', `JWT_SECRET="${secret}"`);
};

generateSecret(); 