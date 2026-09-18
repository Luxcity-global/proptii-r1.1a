// Remove the Firebase configuration section.

import { getResolvedApiBaseUrl } from './apiBaseUrl';

export const envConfig = {
  // API Configuration
  api: {
    baseUrl: getResolvedApiBaseUrl(),
  },

  // App Configuration
  app: {
    environment: import.meta.env.MODE || 'development',
  },
}; 