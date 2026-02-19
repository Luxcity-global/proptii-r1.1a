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

// Enhanced manual chunks function for better code splitting
function getManualChunks(id: string) {
  // Vendor chunks - split large libraries
  if (id.includes('node_modules')) {
    // React core
    if (id.includes('react/') || id.includes('react-dom/')) {
      return 'react-vendor';
    }
    // MUI and Emotion packages - keep ALL together to avoid circular dependencies
    // MUI depends on Emotion, so they must be in the same chunk
    if (id.includes('@mui/') || id.includes('@emotion/')) {
      return 'mui-emotion-vendor';
    }
    // PDF libraries
    if (id.includes('pdfjs-dist') || id.includes('pdf-lib') || id.includes('pdf2pic')) {
      return 'pdf-vendor';
    }
    // Azure SDKs
    if (id.includes('@azure/')) {
      return 'azure-vendor';
    }
    // Firebase
    if (id.includes('firebase/')) {
      return 'firebase-vendor';
    }
    // Date libraries
    if (id.includes('date-fns') || id.includes('@date-io/') || id.includes('dayjs')) {
      return 'date-vendor';
    }
    // Form libraries
    if (id.includes('react-hook-form') || id.includes('@hookform/') || id.includes('yup') || id.includes('zod')) {
      return 'forms-vendor';
    }
    // Icons
    if (id.includes('@fortawesome/') || id.includes('lucide-react')) {
      return 'icons-vendor';
    }
    // Other large dependencies
    if (id.includes('axios') || id.includes('openai')) {
      return 'api-vendor';
    }
    // Default vendor chunk for everything else
    return 'vendor';
  }
}

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
        // Temporarily disabled manual chunks to fix circular dependency issue
        // manualChunks: getManualChunks
        assetFileNames: 'assets/[hash][extname]',
        chunkFileNames: 'chunks/[hash].js',
        entryFileNames: 'entries/[hash].js'
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
        // Temporarily disabled manual chunks to fix circular dependency issue
        // Let Vite handle chunking automatically to avoid circular deps
        // manualChunks: getManualChunks,
        assetFileNames: 'assets/[hash][extname]',
        chunkFileNames: 'chunks/[hash].js',
        entryFileNames: 'entries/[hash].js'
      }
    }
  },
};

// https://vitejs.dev/config/
export default defineConfig(({ mode = 'development' }) => {
  const envConfig = envConfigs[mode as keyof typeof envConfigs] || envConfigs.development;
  const isProduction = mode === 'production';
  const isStaging = mode === 'staging';

  return {
    plugins: [
      react(),
      // Custom plugin to handle SPA fallback for landlord dashboard
      {
        name: 'landlord-spa-fallback',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            // Check if request is for landlord app route (not a file)
            if (req.url && req.url.startsWith('/landlord/') && !req.url.includes('.')) {
              req.url = '/landlord/index.html';
            }
            next();
          });
        },
      }
    ],
    // Temporarily disabled CSP for development
    // server: {
    //   headers: {
    //     'Content-Security-Policy': [
    //       "default-src 'self'",
    //       "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    //       "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    //       "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
    //       "img-src 'self' data: blob: https:",
    //       "font-src 'self' data: https://fonts.gstatic.com",
    //       "connect-src 'self' https://*.googleapis.com https://*.firebaseapp.com https://*.firebaseio.com https://*.google.com wss://*.googleapis.com wss://*.firebaseio.com wss://*.firebaseapp.com",
    //       "frame-src 'self' https://*.google.com",
    //       "object-src 'none'",
    //       "base-uri 'self'",
    //       "form-action 'self'"
    //     ].join('; ')
    //   }
    // },
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
      sourcemap: envConfig.sourcemap,
      minify: envConfig.minify as any,
      cssCodeSplit: envConfig.cssCodeSplit,
      reportCompressedSize: envConfig.reportCompressedSize,
      chunkSizeWarningLimit: envConfig.chunkSizeWarningLimit,
      assetsInlineLimit: envConfig.assetsInlineLimit,
      modulePreload: envConfig.modulePreload,
      rollupOptions: envConfig.rollupOptions,
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      } : undefined,
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        '@mui/material',
        '@mui/icons-material',
        '@emotion/react',
        '@emotion/styled',
      ],
      // Force re-optimization when dependencies change
      force: false, // Set to true if you need to force re-bundling
    },
  };
});