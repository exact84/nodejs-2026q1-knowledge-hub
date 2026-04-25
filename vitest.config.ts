import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      src: resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.spec.ts'],
    exclude: ['test/**', 'dist/**', 'node_modules/**'],
    setupFiles: ['vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.service.ts'],
      exclude: ['src/**/*.spec.ts', 'src/prisma/**'],
    },
  },
});
