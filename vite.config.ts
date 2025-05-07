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
    minify: 'terser',
    cssCodeSplit: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 500,
    assetsInlineLimit: 8192, // 8kb
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
    },
    build: {
      target: 'es2015',
      cssTarget: 'chrome61',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace'],
        },
        mangle: {
          safari10: true,
        },
        format: {
          comments: false,
        },
      },
      commonjsOptions: {
        include: [/node_modules/],
        extensions: ['.js', '.cjs'],
        strictRequires: true,
        transformMixedEsModules: true,
      }
    }
  },
};

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  const envConfig = envConfigs[mode] || envConfigs.development;

  return {
    plugins: [
      react(),
      mode === 'production' && {
        name: 'production-optimizations',
        configResolved(config) {
          // Remove development-only code
          config.define = {
            ...config.define,
            __DEV__: false,
            'process.env.NODE_ENV': '"production"'
          };
        },
        transform(code, id) {
          if (mode === 'production' && id.includes('node_modules')) {
            // Remove PropTypes in production
            return code.replace(/PropTypes\..*?[,;]/g, '');
          }
        }
      }
    ].filter(Boolean),
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
      ...envConfig.optimizeDeps,
      include: [
        ...(envConfig.optimizeDeps?.include || []),
        'react',
        'react-dom',
        '@mui/material',
        '@emotion/react',
        '@emotion/styled'
      ],
      exclude: ['@azure/msal-browser']
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
      ...(mode === 'production' && {
        headers: {
          'Cache-Control': 'public, max-age=31536000',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
          'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
        }
      })
    },
    preview: {
      port: 5173,
      strictPort: true,
      host: true,
    },
    build: {
      ...envConfig,
      outDir: 'dist',
      emptyOutDir: true,
      manifest: true,
      ssrManifest: true,
      reportCompressedSize: mode === 'production',
      rollupOptions: {
        ...envConfig.rollupOptions,
        output: {
          ...envConfig.rollupOptions?.output,
          manualChunks: {
            ...(envConfig.rollupOptions?.output?.manualChunks || {}),
          }
        }
      },
      // CDN configuration for production
      ...(mode === 'production' && {
        assetsDir: 'assets',
        cssCodeSplit: true,
        sourcemap: false,
        write: true,
        brotliSize: false,
        chunkSizeWarningLimit: 500,
        terserOptions: envConfig.build?.terserOptions,
      })
    },
    logLevel: 'info'
  };
});