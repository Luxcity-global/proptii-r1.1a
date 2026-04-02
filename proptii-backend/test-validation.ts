import * as dotenv from 'dotenv';
import { validateEnv } from './src/config/env.validation';

dotenv.config();
try {
  console.log('Validating environment...');
  validateEnv();
  console.log('Environment is valid!');
} catch (error) {
  console.error('Validation failed as expected (if MSAL vars are missing).');
}
