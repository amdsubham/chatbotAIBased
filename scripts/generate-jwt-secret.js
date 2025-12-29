#!/usr/bin/env node
/**
 * Generate JWT Secret
 * This script generates a secure random JWT secret
 */

import crypto from 'crypto';

const secret = crypto.randomBytes(32).toString('hex');
console.log('Generated JWT Secret:');
console.log(secret);
console.log('\nCopy this value and add it to your env.json file as JWT_SECRET');

