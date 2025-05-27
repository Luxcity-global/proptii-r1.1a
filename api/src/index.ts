import { app } from '@azure/functions';
import { setupLogging } from './shared/utils/logging';
import { validateEnv } from './shared/config/environment';

// Initialize logging
setupLogging();

// Validate environment variables
validateEnv();

// Import function handlers
import './functions/health';
import './functions/users';
import './functions/properties';
import './functions/viewings';

// Export the app
export default app; 