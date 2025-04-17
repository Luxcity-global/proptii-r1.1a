import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(type, message) {
  const timestamp = new Date().toLocaleTimeString();
  switch (type) {
    case 'error':
      console.error(`${colors.red}[${timestamp}] ERROR: ${message}${colors.reset}`);
      break;
    case 'info':
      console.log(`${colors.blue}[${timestamp}] INFO: ${message}${colors.reset}`);
      break;
    case 'success':
      console.log(`${colors.green}[${timestamp}] SUCCESS: ${message}${colors.reset}`);
      break;
    case 'warning':
      console.log(`${colors.yellow}[${timestamp}] WARNING: ${message}${colors.reset}`);
      break;
  }
}

function startServer(name, command, args, cwd) {
  const server = spawn(command, args, {
    cwd,
    shell: true,
    stdio: 'pipe',
    env: { ...process.env, FORCE_COLOR: true }
  });

  server.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${colors.blue}[${name}]${colors.reset} ${line}`);
      }
    });
  });

  server.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.error(`${colors.red}[${name} ERROR]${colors.reset} ${line}`);
      }
    });
  });

  server.on('error', (error) => {
    log('error', `${name} failed to start: ${error.message}`);
  });

  server.on('close', (code) => {
    if (code !== 0) {
      log('error', `${name} process exited with code ${code}`);
    }
  });

  return server;
}

// Start frontend
log('info', 'Starting frontend server...');
const frontendServer = startServer(
  'Frontend',
  'npm',
  ['run', 'dev'],
  process.cwd()
);

// Start backend
log('info', 'Starting backend server...');
const backendServer = startServer(
  'Backend',
  'npm',
  ['run', 'start:dev'],
  join(process.cwd(), 'proptii-backend')
);

// Handle process termination
process.on('SIGINT', () => {
  log('info', 'Shutting down servers...');
  frontendServer.kill();
  backendServer.kill();
  process.exit();
});

process.on('uncaughtException', (error) => {
  log('error', `Uncaught Exception: ${error.message}`);
  frontendServer.kill();
  backendServer.kill();
  process.exit(1);
}); 