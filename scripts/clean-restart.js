import { execSync } from 'child_process';
import chalk from 'chalk';
import axios from 'axios';

const MAX_RETRIES = 5;
const RETRY_DELAY = 2000; // 2 seconds

async function checkBackendHealth() {
  try {
    const response = await axios.get('http://localhost:3000/health');
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function waitForBackend() {
  console.log(chalk.yellow('Waiting for backend to be ready...'));
  
  for (let i = 0; i < MAX_RETRIES; i++) {
    if (await checkBackendHealth()) {
      console.log(chalk.green('Backend is ready!'));
      return true;
    }
    console.log(chalk.yellow(`Attempt ${i + 1}/${MAX_RETRIES}: Backend not ready yet...`));
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
  }
  
  throw new Error('Backend failed to start within the expected time');
}

console.log(chalk.blue('Starting clean restart sequence...'));

try {
  // Kill any existing processes
  console.log(chalk.yellow('Cleaning up existing processes...'));
  try {
    execSync('pkill -f "node.*proptii"', { stdio: 'ignore' });
  } catch (e) {
    // Ignore if no processes found
  }

  // Clean build artifacts
  console.log(chalk.yellow('Cleaning build artifacts...'));
  execSync('npm run clean', { stdio: 'inherit' });

  // Start backend
  console.log(chalk.green('Starting backend...'));
  execSync('cd proptii-backend && npm run start:dev', { stdio: 'inherit', detached: true });

  // Wait for backend to be ready
  await waitForBackend();

  // Start frontend
  console.log(chalk.green('Starting frontend...'));
  execSync('npm run dev', { stdio: 'inherit' });

} catch (error) {
  console.error(chalk.red('Error during restart:'), error);
  process.exit(1);
} 