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

// NOTE: manual chunk splitting (manualChunks) has been intentionally removed.
// Custom manualChunks causes circular chunk cycles (e.g. mui-emotion-vendor ->
// vendor -> mui-emotion-vendor) which produce TDZ runtime errors ('Cannot access
// X before initialization'). Rollup's automatic splitting never creates circular
// chunks. The chunkSizeWarningLimit is raised to suppress size warnings.

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
    chunkSizeWarningLimit: 2500,
    assetsInlineLimit: 8192,
    modulePreload: {
      polyfill: true
    },
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[hash][extname]',
        chunkFileNames: 'chunks/[hash].js',
        entryFileNames: 'entries/[hash].js'
      }
    }
  },
};

// https://vitejs.dev/config/
export default defineConfig(({ mode = 'development' }) => {
  // Load .env, .env.local, .env.[mode] etc. so the proxy can read VITE_SEARCH_BACKEND_URL
  const envFromFile = loadEnv(mode, process.cwd(), '');

  const envConfig = envConfigs[mode as keyof typeof envConfigs] || envConfigs.development;
  const isProduction = mode === 'production';
  const isStaging = mode === 'staging';

  // Render dashboard may set SEARCH_BACKEND_URL; Vite only exposes VITE_* to the client.
  const viteSearchBackendUrl = (envFromFile.VITE_SEARCH_BACKEND_URL || process.env.VITE_SEARCH_BACKEND_URL || '').trim();
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
      proxy: {
        '/api/search-backend': {
          target: viteSearchBackendUrl || 'http://127.0.0.1:3001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/search-backend/, ''),
          secure: false,
          // Disable response buffering so SSE chunks reach the browser immediately.
          // Without this the proxy holds the full response before forwarding.
          ws: false,
          configure: (proxy) => {
            proxy.on('proxyRes', (proxyRes) => {
              if (proxyRes.headers['content-type']?.includes('text/event-stream')) {
                proxyRes.headers['cache-control'] = 'no-cache';
                proxyRes.headers['x-accel-buffering'] = 'no';
                proxyRes.headers['connection'] = 'keep-alive';
              }
            });
          },
        }
      },
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
      dedupe: ['react', 'react-dom', 'firebase', 'firebase/app', 'firebase/firestore', 'firebase/auth', 'firebase/storage'],
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
        // Version-pinned package aliases used by components in src/landlord_agent
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
          // Strip all console.log / .info / .debug calls from the production
          // bundle. console.warn and console.error are kept for genuine runtime
          // problems (auth failures, API errors, etc.).
          // This removes ALL 500+ diagnostic logs without touching source files —
          // no manual audit needed for new code added in the future.
          drop_console: false,
          pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace'],
          drop_debugger: true,
        },
      } : undefined,
    },
    optimizeDeps: {
      exclude: ['aria-hidden'],
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