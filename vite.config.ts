import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Custom logger
const customLogger = {
  warn: (...args: any[]) => {
    console.warn('⚠️ [vite]:', ...args);
  },
  error: (...args: any[]) => {
    console.error('🚨 [vite]:', ...args);
  },
  info: (...args: any[]) => {
    console.log('ℹ️ [vite]:', ...args);
  },
};

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': process.env
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'components': path.resolve(__dirname, './src/components'),
      'pages': path.resolve(__dirname, './src/pages'),
      'services': path.resolve(__dirname, './src/services'),
      'utils': path.resolve(__dirname, './src/utils'),
      'hooks': path.resolve(__dirname, './src/hooks'),
      'context': path.resolve(__dirname, './src/context'),
      'contexts': path.resolve(__dirname, './src/contexts'),
      'types': path.resolve(__dirname, './src/types'),
      'assets': path.resolve(__dirname, './src/assets'),
      'config': path.resolve(__dirname, './src/config'),
    },
  },
  optimizeDeps: {
    include: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled']
  },
  server: {
    port: 3000,
    host: '127.0.0.1',
    strictPort: false,
    watch: {
      usePolling: true,
    },
    hmr: {
      port: 3000,
      host: 'localhost',
      protocol: 'ws',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
        ws: true,
      }
    },
    cors: true,
    middlewareMode: false,
    fs: {
      strict: false,
      allow: ['..']
    },
    logger: customLogger
  },
  preview: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    }
  },
  logLevel: 'info'
});