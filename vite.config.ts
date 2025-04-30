import { defineConfig, loadEnv } from 'vite';
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
    minify: 'esbuild',
    cssCodeSplit: true,
    reportCompressedSize: false,
  },
};

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  const envConfig = envConfigs[mode] || envConfigs.development;

  return {
    plugins: [react()],
    // Base URL configuration for Azure Static Web Apps
    base: '/',
    define: {
      // Expose env variables to the client
      'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:3002'),
      'process.env.VITE_AZURE_AD_CLIENT_ID': JSON.stringify(env.VITE_AZURE_AD_CLIENT_ID || 'e221eddb-ad9f-47d3-9b64-c4b2ed273aaf'),
      'process.env.VITE_AZURE_STORAGE_URL': JSON.stringify(env.VITE_AZURE_STORAGE_URL || 'https://black-wave-0bb98540f.azurestaticapps.net'),
      'process.env.NODE_ENV': JSON.stringify(command === 'serve' ? 'development' : mode),
      'process.env.VITE_ENVIRONMENT': JSON.stringify(mode),
      'process.env.VITE_ENABLE_DEBUG_LOGGING': JSON.stringify(mode !== 'production'),
      'process.env.VITE_ENABLE_PERFORMANCE_MONITORING': JSON.stringify(mode !== 'development'),
      'process.env.VITE_ENABLE_ERROR_REPORTING': JSON.stringify(mode !== 'development'),
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
      include: [
        '@mui/material',
        '@mui/icons-material',
        '@mui/x-date-pickers',
        '@emotion/react',
        '@emotion/styled',
        'swiper',
        'swiper/react',
        'lucide-react',
        '@fortawesome/react-fontawesome',
        '@fortawesome/fontawesome-svg-core',
        '@fortawesome/free-solid-svg-icons',
        '@fortawesome/free-regular-svg-icons',
        '@fortawesome/free-brands-svg-icons',
        'pdfjs-dist',
        'react-hook-form',
        '@hookform/resolvers/zod',
        'zod',
        'date-fns',
        '@date-io/date-fns'
      ],
      exclude: []
    },
    server: {
      port: 5173,
      strictPort: true,
      host: true,
      watch: {
        usePolling: true,
      },
      hmr: {
        port: 5173,
        host: 'localhost',
        protocol: 'ws',
      },
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3002',
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
    },
    preview: {
      port: 5173,
      strictPort: true,
      host: true,
    },
    build: {
      ...envConfig,
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', '@mui/material', '@mui/x-date-pickers', '@emotion/react', '@emotion/styled'],
            swiper: ['swiper', 'swiper/react'],
            icons: ['lucide-react'],
            fontawesome: [
              '@fortawesome/react-fontawesome',
              '@fortawesome/fontawesome-svg-core',
              '@fortawesome/free-solid-svg-icons',
              '@fortawesome/free-regular-svg-icons',
              '@fortawesome/free-brands-svg-icons'
            ],
            pdf: ['pdfjs-dist'],
            forms: ['react-hook-form', '@hookform/resolvers/zod', 'zod'],
            utils: ['date-fns', '@date-io/date-fns']
          },
        },
        external: []
      },
      // Optimize build for Azure Static Web Apps
      chunkSizeWarningLimit: 1000,
      cssCodeSplit: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: command === 'build',
        },
      },
    },
    logLevel: 'info'
  };
});