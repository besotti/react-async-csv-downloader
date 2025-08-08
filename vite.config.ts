/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import ignore from 'rollup-plugin-ignore';
import path from 'path';

export default defineConfig({
    plugins: [
        react(),
        dts({
            insertTypesEntry: true,
        }),
    ],

    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/index.ts'),
            name: 'react-csv-download',
            fileName: (format) => `index.${format}.js`,
        },
        rollupOptions: {
            external: ['react', 'react-dom', 'react-router-dom'],
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                },
            },
            plugins: [ignore(['**/example/**'])],
        },
        sourcemap: false,
    },

    optimizeDeps: {
        include: ['react', 'react-dom'],
    },

    test: {
        globals: true,
        environment: 'jsdom',
        coverage: {
            provider: 'v8',
            include: ['**/useDownloadLink.ts'],
        },
    },
});
