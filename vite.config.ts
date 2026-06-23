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
      // Intercept /landlord/* child routes (e.g. /landlord/messages) so Vite
      // serves the main app's index.html for SPA routing instead of any static
      // file that might exist under public/landlord-app/landlord/.
      // The landlord agent iframe is served at /landlord-app/index.html (unchanged).
      {
        name: 'landlord-child-route-fallback',
        configureServer(server) {
          // Use unshift so this middleware runs BEFORE Vite's static file serving.
          server.middlewares.stack.unshift({
            route: '',
            handle: (req: any, res: any, next: () => void) => {
              const url: string = req.url ?? '';
              // Rewrite /landlord/<path> (no dot = not an asset) to the main index.html.
              // Exclude /landlord-app/ (the iframe build) and /landlord/index.html itself.
              if (
                url.startsWith('/landlord/') &&
                !url.startsWith('/landlord-app/') &&
                !url.includes('.')
              ) {
                req.url = '/index.html';
              }
              next();
            },
          });
        },
      },
    ],
    server: {
      watch: {
        ignored: [
          '**/api/**',
          '**/proptii-backend/**',
          '**/proptii-search/**',
          '**/node_modules/**',
          '**/public/landlord-app/**',
        ]
      }
      // Temporarily disabled CSP for development
      // headers: {
      //   'Content-Security-Policy': [ ... ]
      // }
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
        'vaul@1.1.2': 'vaul',
        'sonner@2.0.3': 'sonner',
        'recharts@2.15.2': 'recharts',
        'react-resizable-panels@2.1.7': 'react-resizable-panels',
        'react-hook-form@7.55.0': 'react-hook-form',
        'react-day-picker@8.10.1': 'react-day-picker',
        'next-themes@0.4.6': 'next-themes',
        'lucide-react@0.487.0': 'lucide-react',
        'input-otp@1.4.2': 'input-otp',
        'embla-carousel-react@8.6.0': 'embla-carousel-react',
        'cmdk@1.1.1': 'cmdk',
        'class-variance-authority@0.7.1': 'class-variance-authority',
        '@radix-ui/react-tooltip@1.1.8': '@radix-ui/react-tooltip',
        '@radix-ui/react-toggle@1.1.2': '@radix-ui/react-toggle',
        '@radix-ui/react-toggle-group@1.1.2': '@radix-ui/react-toggle-group',
        '@radix-ui/react-tabs@1.1.3': '@radix-ui/react-tabs',
        '@radix-ui/react-switch@1.1.3': '@radix-ui/react-switch',
        '@radix-ui/react-slot@1.1.2': '@radix-ui/react-slot',
        '@radix-ui/react-slider@1.2.3': '@radix-ui/react-slider',
        '@radix-ui/react-separator@1.1.2': '@radix-ui/react-separator',
        '@radix-ui/react-select@2.1.6': '@radix-ui/react-select',
        '@radix-ui/react-scroll-area@1.2.3': '@radix-ui/react-scroll-area',
        '@radix-ui/react-radio-group@1.2.3': '@radix-ui/react-radio-group',
        '@radix-ui/react-progress@1.1.2': '@radix-ui/react-progress',
        '@radix-ui/react-popover@1.1.6': '@radix-ui/react-popover',
        '@radix-ui/react-navigation-menu@1.2.5': '@radix-ui/react-navigation-menu',
        '@radix-ui/react-menubar@1.1.6': '@radix-ui/react-menubar',
        '@radix-ui/react-label@2.1.2': '@radix-ui/react-label',
        '@radix-ui/react-hover-card@1.1.6': '@radix-ui/react-hover-card',
        '@radix-ui/react-dropdown-menu@2.1.6': '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-dialog@1.1.6': '@radix-ui/react-dialog',
        '@radix-ui/react-context-menu@2.2.6': '@radix-ui/react-context-menu',
        '@radix-ui/react-collapsible@1.1.3': '@radix-ui/react-collapsible',
        '@radix-ui/react-checkbox@1.1.4': '@radix-ui/react-checkbox',
        '@radix-ui/react-avatar@1.1.3': '@radix-ui/react-avatar',
        '@radix-ui/react-aspect-ratio@1.1.2': '@radix-ui/react-aspect-ratio',
        '@radix-ui/react-alert-dialog@1.1.6': '@radix-ui/react-alert-dialog',
        '@radix-ui/react-accordion@1.2.3': '@radix-ui/react-accordion',
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