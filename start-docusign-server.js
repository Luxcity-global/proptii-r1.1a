#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting DocuSign Test Server...');
console.log('=====================================\n');

// Check if .env.local exists and load it
const envLocalPath = join(__dirname, '.env.local');
let envVars = {};

try {
  if (await import('fs').then(fs => fs.existsSync(envLocalPath))) {
    const envContent = await import('fs').then(fs => fs.readFileSync(envLocalPath, 'utf8'));
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (value && !key.startsWith('#')) {
          envVars[key.trim()] = value;
        }
      }
    });
    console.log('✅ Loaded environment variables from .env.local');
  } else {
    console.log('⚠️  No .env.local file found. Using default configuration.');
  }
} catch (error) {
  console.log('⚠️  Could not load .env.local file:', error.message);
}

// Set environment variables for the child process
const childEnv = {
  ...process.env,
  ...envVars,
  NODE_ENV: 'development'
};

// Start the DocuSign test server
const serverProcess = spawn('node', ['test-docusign-server.js'], {
  stdio: 'inherit',
  env: childEnv,
  cwd: __dirname
});

serverProcess.on('error', (error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});

serverProcess.on('close', (code) => {
  console.log(`\n🔚 Server stopped with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  serverProcess.kill('SIGTERM');
}); 