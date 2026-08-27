import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals:     true,
    environment: 'node',
    include:     ['v2-backend/src/**/*.spec.ts'],
  },
});
