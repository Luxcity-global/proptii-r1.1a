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

// Environment-specific configurations
const envConfigs = {
  development: {
    sourcemap: true,
    minify: false,
    cssCodeSplit: true,
  },
  staging: {
    sourcemap: 'hidden',
    minify: 'esbuild',
    cssCodeSplit: true,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 800,
    assetsInlineLimit: 4096,
    modulePreload: {
      polyfill: true
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  production: {
    sourcemap: false,
    minify: 'terser',
    cssCodeSplit: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 500,
    assetsInlineLimit: 8192,
    modulePreload: {
      polyfill: true
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', '@mui/material', '@mui/x-date-pickers', '@emotion/react', '@emotion/styled'],
          utils: ['date-fns', '@date-io/date-fns', 'zod'],
          forms: ['react-hook-form', '@hookform/resolvers'],
          icons: ['@fortawesome/react-fontawesome', '@fortawesome/fontawesome-svg-core'],
          pdf: ['pdfjs-dist'],
        },
        assetFileNames: 'assets/[hash][extname]',
        chunkFileNames: 'chunks/[hash].js',
        entryFileNames: 'entries/[hash].js'
      }
    }
  },
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@mui/material',
      '@emotion/react',
      '@emotion/styled',
    ],
  },
});