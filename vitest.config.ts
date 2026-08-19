/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

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
            'firebase/app': path.resolve(__dirname, './node_modules/firebase/app/dist/index.cjs.js'),
            'firebase/auth': path.resolve(__dirname, './node_modules/firebase/auth/dist/index.cjs.js'),
            'firebase/storage': path.resolve(__dirname, './node_modules/firebase/storage/dist/index.cjs.js'),
            'firebase/firestore': path.resolve(__dirname, './node_modules/firebase/firestore/dist/index.cjs.js'),
        }
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'src/test/setup.ts',
                '**/*.d.ts',
                '**/*.test.{ts,tsx}',
                '**/*.spec.{ts,tsx}',
                '**/types/**'
            ],
            branches: 80,
            functions: 85,
            lines: 85,
            statements: 85
        },
        include: ['src/**/*.{test,spec}.{ts,tsx}']
    }
}); 