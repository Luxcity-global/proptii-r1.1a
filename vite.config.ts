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
        manualChunks: getManualChunks,
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
        // Vendor splitting: keeps large libraries in separate cached chunks.
        // MUI + Emotion must stay together (MUI has Emotion peer dep).
        manualChunks: getManualChunks,
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

  // Render dashboard may set SEARCH_BACKEND_URL; Vite only exposes VITE_* to the client.
  const viteSearchBackendUrl = process.env.VITE_SEARCH_BACKEND_URL?.trim() || '';
  const aliasSearchBackendUrl = process.env.SEARCH_BACKEND_URL?.trim() || '';
  const define: Record<string, string> = {};
  if (!viteSearchBackendUrl && aliasSearchBackendUrl) {
    define['import.meta.env.VITE_SEARCH_BACKEND_URL'] = JSON.stringify(aliasSearchBackendUrl);
  }

  return {
    define,
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
        usePolling: true,
        interval: 500,
        ignored: [
          '**/node_modules/**',
          // Explicitly exclude the landlord sub-app's node_modules — the glob above
          // does not match paths nested inside src/ with chokidar, so without this
          // entry all ~20k files there are polled on every interval.
          '**/src/landlord_agent/node_modules/**',
          '**/.git/**',
          '**/dist/**',
          '**/api/**',
          '**/proptii-backend/**',
          '**/proptii-search/**',
          '**/public/landlord/**',
          '**/coverage/**',
        ],
      },
    },
    resolve: {
      dedupe: ['firebase', 'firebase/app', 'firebase/firestore', 'firebase/auth', 'firebase/storage'],
      alias: {
        // Short-form src/ path aliases
        '@':        path.resolve(__dirname, './src'),
        'components': path.resolve(__dirname, './src/components'),
        'pages':    path.resolve(__dirname, './src/pages'),
        'services': path.resolve(__dirname, './src/services'),
        'utils':    path.resolve(__dirname, './src/utils'),
        'hooks':    path.resolve(__dirname, './src/hooks'),
        'context':  path.resolve(__dirname, './src/context'),
        'contexts': path.resolve(__dirname, './src/contexts'),
        'types':    path.resolve(__dirname, './src/types'),
        'assets':   path.resolve(__dirname, './src/assets'),
        'config':   path.resolve(__dirname, './src/config'),
        // NOTE: version-pinned package aliases (e.g. 'vaul@1.1.2': 'vaul') have
        // been removed. They were generated by a Figma plugin and cause Rollup
        // to resolve the un-versioned package twice, inflating bundle size and
        // breaking tree-shaking. Use plain package names in imports instead.
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
      // Pre-bundle every bare-package import found in src/ so Vite never has to
      // discover and recompile deps on-demand (which causes browser reloads and
      // the visible "stall then reload" during local dev startup).
      //
      // Rule: add a package here whenever you add a new npm import to src/.
      // Sub-path imports (e.g. firebase/app) must be listed explicitly.
      include: [
        // ── React core ──────────────────────────────────────────────────────
        'react',
        'react/jsx-dev-runtime',
        'react/jsx-runtime',
        'react-dom',
        'react-dom/client',
        'react-router-dom',
        'react-hook-form',
        'react-hot-toast',
        'react-dropzone',

        // ── MUI + Emotion (must stay together — MUI has Emotion peer dep) ──
        '@emotion/react',
        '@emotion/styled',
        '@mui/material',
        '@mui/material/styles',
        '@mui/material/CssBaseline',
        '@mui/icons-material',
        '@mui/icons-material/Lock',
        '@mui/icons-material/Check',
        '@mui/icons-material/FiberManualRecord',
        '@mui/icons-material/AccountBalance',
        '@mui/icons-material/ArrowBackIosNew',
        '@mui/icons-material/ArrowForwardIos',
        '@mui/icons-material/CheckCircle',
        '@mui/icons-material/Close',
        '@mui/icons-material/CloudUpload',
        '@mui/icons-material/Delete',
        '@mui/icons-material/Error',
        '@mui/icons-material/FolderOpen',
        '@mui/icons-material/Home',
        '@mui/icons-material/InsertDriveFile',
        '@mui/icons-material/LockOpen',
        '@mui/icons-material/Person',
        '@mui/icons-material/Save',
        '@mui/icons-material/SupervisorAccount',
        '@mui/icons-material/VerifiedUser',
        '@mui/icons-material/Warning',
        '@mui/icons-material/Work',

        // ── Azure / MSAL ────────────────────────────────────────────────────
        '@azure/msal-browser',
        '@azure/msal-react',

        // ── Firebase (sub-paths must be listed individually) ────────────────
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
        'firebase/storage',

        // ── Icons ────────────────────────────────────────────────────────────
        'lucide-react',

        // ── Networking ───────────────────────────────────────────────────────
        'axios',

        // ── Forms / validation ───────────────────────────────────────────────
        '@hookform/resolvers/zod',
        'yup',
        'zod',

        // ── Stripe ───────────────────────────────────────────────────────────
        '@stripe/stripe-js',
        '@stripe/react-stripe-js',

        // ── Misc ─────────────────────────────────────────────────────────────
        '@sentry/react',
        '@microsoft/applicationinsights-web',
        'swiper/react',
        'signature_pad',
        'web-vitals',
        'jspdf',
        'jszip',
        'pdf-lib',
        'pdfjs-dist',
      ],
    },
  };
});