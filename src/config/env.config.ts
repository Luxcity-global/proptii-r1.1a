// Remove the Firebase configuration section.

export const envConfig = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  },

  // App Configuration
  app: {
    environment: import.meta.env.MODE || 'development',
  },
}; 